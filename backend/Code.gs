/**
 * 一年级数学网页 × Google Sheet 后台
 * 学生名单只保存在 Students 工作表；网页不含名单和班级代码。
 */

const STUDENTS_SHEET = 'Students';
const SCORES_SHEET = 'Scores';
const SCORE_HEADERS = ['UpdatedAt','序号','ChineseName','EnglishName','Unit','Activity','Difficulty','Group','Score','Total','WrongAttempts','DurationSeconds'];
const UNIT7_SHEET = 'Unit7Scores';
const UNIT7_HEADERS = SCORE_HEADERS.concat(['ScoreType','QuestionCount','CorrectAnswers','ObstacleHits']);
const SESSION_HOURS = 8;
const TEACHER_SESSION_HOURS = 2;

/** 首次安装时运行一次。会建立成绩表并产生一个班级代码。 */
function setupBackend() {
  setupSheets();
  getSessionSecret_();
  const properties = PropertiesService.getScriptProperties();
  let classCode = '';
  if (!properties.getProperty('CLASS_CODE_HASH')) {
    classCode = generateReadableCode_(6);
    properties.setProperty('CLASS_CODE_HASH', hashClassCode_(classCode));
  }
  const message = classCode
    ? '后台设置完成。\n\n班级代码：' + classCode + '\n\n请只告诉本班学生。'
    : '后台设置完成。现有班级代码保持不变。';
  showTeacherMessage_(message);
  return { ok: true, classCode: classCode || '(保持现有代码)' };
}

/** 首次开启教师后台时运行一次。密码只显示这一次。 */
function setupTeacherAccess() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('TEACHER_PASSWORD_HASH')) {
    showTeacherMessage_('教师后台已启用。\n\n如果忘记密码，请运行 changeTeacherPassword。');
    return { ok: true, password: '(已设置)' };
  }
  const password = generateReadableCode_(10);
  properties.setProperty('TEACHER_PASSWORD_HASH', hashTeacherPassword_(password));
  showTeacherMessage_('教师后台已启用。\n\n教师密码：' + password + '\n\n请立即记录，不要发给学生。');
  return { ok: true, password: password };
}

/** 教师要更换后台密码时运行。 */
function changeTeacherPassword() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('更换教师密码', '请输入至少 6 个字符的新密码：', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const password = String(response.getResponseText() || '').trim();
  if (password.length < 6 || password.length > 64) {
    ui.alert('教师密码必须是 6–64 个字符。');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('TEACHER_PASSWORD_HASH', hashTeacherPassword_(password));
  ui.alert('教师密码已更新。旧密码立即失效；已登录的教师会话最长保留 2 小时。');
}

/** 教师要更换班级代码时运行。代码不会写入网页或工作表。 */
function changeClassCode() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('更换班级代码', '请输入至少 4 个字符的新代码：', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const code = normalizeClassCode_(response.getResponseText());
  if (code.length < 4 || code.length > 20) {
    ui.alert('班级代码必须是 4–20 个字符。');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('CLASS_CODE_HASH', hashClassCode_(code));
  ui.alert('班级代码已经更新。旧代码立即失效；已登录的学生可继续使用至会话到期。');
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const students = ss.getSheetByName(STUDENTS_SHEET);
  if (!students || students.getLastRow() < 2) throw new Error('Students 工作表没有学生名单。');
  students.getRange(1, 1, 1, 4).setValues([['序号','ChineseName','EnglishName','Class']]);
  students.setFrozenRows(1);
  getScoresSheet_();
}

/** 确保旧成绩表增加 Unit 栏，不会覆盖旧资料。 */
function getLegacyScoresSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let scores = ss.getSheetByName(SCORES_SHEET);
  if (!scores) scores = ss.insertSheet(SCORES_SHEET);
  const lastRow = scores.getLastRow();
  if (lastRow > 0 && String(scores.getRange(1, 5).getDisplayValue()) !== 'Unit') {
    scores.insertColumnAfter(4);
    if (lastRow > 1) scores.getRange(2, 5, lastRow - 1, 1).setValue('单元3：分数');
  }
  scores.getRange(1, 1, 1, SCORE_HEADERS.length).setValues([SCORE_HEADERS]);
  scores.setFrozenRows(1);
  return scores;
}

/** GET 只提供健康检查，不公开名单、姓名或排行榜。 */
function doGet() {
  return jsonOutput({ ok: true, service: 'year1-math-score-api', version: 7, units:['单元3：分数','单元4：纸币和硬币','单元4：经济来源和储蓄','单元5：时间与时刻','单元6：度量衡','单元7：空间'] });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(data.action || 'save');
    if (action === 'classes') return jsonOutput(getClassChoices_());
    if (action === 'searchStudents') return jsonOutput(searchStudents_(data));
    if (action === 'login') return jsonOutput(loginStudent_(data));
    if (action === 'teacherLogin') return jsonOutput(loginTeacher_(data));
    if (action === 'teacherDashboard') {
      const teacherSession = verifyTeacherSessionToken_(String(data.teacherToken || ''));
      if (!teacherSession) return jsonOutput({ error: 'teacher_session_invalid' });
      return jsonOutput(getTeacherDashboard_());
    }

    const session = verifySessionToken_(String(data.sessionToken || ''));
    if (!session) return jsonOutput({ error: 'session_invalid', saved: false });
    if (action === 'leaderboard') return jsonOutput(getLeaderboards_(normalizeUnit_(data.unit), (findStudent_(session.studentNo) || {}).className));
    if (action !== 'save') return jsonOutput({ error: 'action_invalid', saved: false });

    lock.waitLock(10000);
    return jsonOutput(saveBestResult_(data, session.studentNo));
  } catch (error) {
    return jsonOutput({ error: String(error.message || error), saved: false });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function loginTeacher_(data) {
  const configuredHash = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD_HASH');
  if (!configuredHash) return { error: 'teacher_access_not_configured' };
  const suppliedHash = hashTeacherPassword_(String(data.password || '').trim());
  if (!constantTimeEqual_(configuredHash, suppliedHash)) return { error: 'teacher_password_invalid' };
  return {
    ok: true,
    teacherToken: createTeacherSessionToken_(),
    expiresInSeconds: TEACHER_SESSION_HOURS * 60 * 60
  };
}

function loginStudent_(data) {
  let student;
  if (data.selectionToken) {
    const selected = verifyStudentChoice_(data.selectionToken);
    if (!selected) return { error: 'selection_expired' };
    student = findStudent_(selected.studentNo);
    if (!student || student.className !== selected.className || student.className !== String(data.className || '').trim()) return { error: 'student_not_found' };
  } else {
    const configuredHash = PropertiesService.getScriptProperties().getProperty('CLASS_CODE_HASH');
    if (!configuredHash) return { error: 'class_code_not_configured' };
    if (!constantTimeEqual_(configuredHash, hashClassCode_(normalizeClassCode_(data.classCode)))) return { error: 'class_code_invalid' };
    student = findStudent_(String(data.studentNo || ''));
  }
  if (!student) return { error: 'student_not_found' };
  return {ok:true, sessionToken:createSessionToken_(student.studentNo), expiresInSeconds:SESSION_HOURS*3600,
    student:{studentNo:student.studentNo,chineseName:student.chineseName,englishName:student.englishName,className:student.className}};
}

function rosterRows_() {
  // Cache the roster briefly so class and name lookups avoid repeated Sheet reads.
  const cache=typeof CacheService!=='undefined'?CacheService.getScriptCache():null;
  if(cache){const saved=cache.get('roster-v1');if(saved)try{return JSON.parse(saved)}catch(_){}}
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS_SHEET);
  const rows=sheet && sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,4).getDisplayValues().filter(r=>String(r[0]).trim()) : [];
  if(cache)try{cache.put('roster-v1',JSON.stringify(rows),60)}catch(_){}
  return rows;
}
function getClassChoices_() {
  return {ok:true,classes:Array.from(new Set(rosterRows_().map(r=>String(r[3]).trim()).filter(Boolean))).sort().map(name=>({id:name,label:name}))};
}
function searchStudents_(data) {
  const className = String(data.className || '').trim(), query = String(data.query || '').trim().toLowerCase().replace(/\s+/g,' ').slice(0,80);
  if (!query || !className) return {ok:true,students:[],more:false};
  const matches = rosterRows_().filter(r=>String(r[3]).trim()===className && String(r[2]).toLowerCase().split(/\s+/).some((_,i,words)=>words.slice(i).join(' ').startsWith(query)));
  return {ok:true,more:matches.length>12,students:matches.slice(0,12).map(r=>({englishName:String(r[2]),selectionToken:createStudentChoice_(String(r[0]),className)}))};
}
function createStudentChoice_(studentNo,className) {
  const encoded=base64UrlEncode_(JSON.stringify({role:'student-choice',studentNo,className,expiresAt:Date.now()+600000}));
  return encoded+'.'+sign_(encoded);
}
function verifyStudentChoice_(token) {
  const parts=String(token||'').split('.');
  if(parts.length!==2 || !constantTimeEqual_(parts[1],sign_(parts[0]))) return null;
  try {const payload=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(padBase64_(parts[0]))).getDataAsString());return payload.role==='student-choice' && payload.expiresAt>Date.now()?payload:null} catch(_){return null}
}
function getScoresSheet_(unit) {
  if (normalizeUnit_(unit)!=='单元7：空间') return getLegacyScoresSheet_();
  const ss=SpreadsheetApp.getActiveSpreadsheet();let sheet=ss.getSheetByName(UNIT7_SHEET);
  if(!sheet) {sheet=ss.insertSheet(UNIT7_SHEET);sheet.getRange(1,1,1,UNIT7_HEADERS.length).setValues([UNIT7_HEADERS]);sheet.setFrozenRows(1);sheet.getRange(1,1,1,UNIT7_HEADERS.length).setFontWeight('bold').setBackground('#eef0ff');sheet.autoResizeColumns(1,UNIT7_HEADERS.length);sheet.setTabColor('#6f74ef')}
  return sheet;
}
function setupUnit7() { getScoresSheet_('单元7：空间'); return {ok:true,sheet:UNIT7_SHEET} }
function scoreRows_(sheet) {return sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,Math.min(sheet.getLastColumn(),UNIT7_HEADERS.length)).getValues():[]}
function allScoreRows_() {return scoreRows_(getLegacyScoresSheet_()).concat(scoreRows_(getScoresSheet_('单元7：空间')))}

function saveBestResult_(data, studentNo) {
  const student = findStudent_(studentNo);
  if (!student) return { error: 'student_not_found', saved: false };
  const unit = normalizeUnit_(data.unit);
  const activity = safeChoice_(data.activity, unit==='单元7：空间'?['硬币闯关','离堂小检核']:unit==='单元6：度量衡'?['叠塔挑战','配对游戏','离堂小检核']:['配对游戏','离堂小检核'], unit==='单元7：空间'?'硬币闯关':'配对游戏');
  const isCoins=unit==='单元7：空间' && activity==='硬币闯关', isTower=unit==='单元6：度量衡'&&activity==='叠塔挑战', numeric=Number(data.score);
  if(!Number.isFinite(numeric) || numeric<0 || !Number.isSafeInteger(Math.round(numeric))) return {error:'score_invalid',saved:false};
  const score = Math.max(0, Math.min(isCoins||isTower?Number.MAX_SAFE_INTEGER:100, Math.round(numeric)));
  const duration = Math.max(0, Math.round(Number(data.durationSeconds) || 0));
  const difficulty = safeChoice_(data.difficulty, ['简单','中等','困难','综合'], '综合');
  const row = [new Date(), student.studentNo, student.chineseName, student.englishName, unit, activity, difficulty,
    Math.max(1, Math.round(Number(data.group) || 1)), score, 100,
    Math.max(0, Math.round(Number(data.wrongAttempts) || 0)), duration];

  if(unit==='单元7：空间') row.push(isCoins?'coins':'percent',Math.max(0,Math.round(Number(data.questionCount)||0)),Math.max(0,Math.round(Number(data.correctAnswers)||0)),Math.max(0,Math.round(Number(data.obstacleHits)||0)));
  const sheet = getScoresSheet_(unit);
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SCORE_HEADERS.length).getValues() : [];
  const found = rows.findIndex(r => {
    const same = String(r[1]) === student.studentNo && String(r[4]) === unit && String(r[5]) === activity;
    return activity !== '离堂小检核' ? same && String(r[6]) === difficulty : same;
  });
  let saved = false;
  if (found < 0) {
    sheet.appendRow(row);
    saved = true;
  } else {
    const oldScore = Number(rows[found][8]) || 0;
    const oldDuration = Number(rows[found][11]) || 0;
    if (score > oldScore || (score === oldScore && (oldDuration === 0 || duration < oldDuration))) {
      sheet.getRange(found + 2, 1, 1, row.length).setValues([row]);
      saved = true;
    }
  }
  return { ok: true, saved: saved, score: score, unit:unit };
}

function findStudent_(no) {
  const cleanNo = String(Math.trunc(Number(no || 0)));
  if (!/^\d{1,3}$/.test(cleanNo) || Number(cleanNo) < 1) return null;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues();
  const row = rows.find(r => String(r[0]).trim() === cleanNo);
  return row ? { studentNo: cleanNo, chineseName: row[1], englishName: row[2], className: row[3] } : null;
}

function createSessionToken_(studentNo) {
  const payload = { version: 1, studentNo: String(studentNo), expiresAt: Date.now() + SESSION_HOURS * 3600000 };
  const encoded = base64UrlEncode_(JSON.stringify(payload));
  return encoded + '.' + sign_(encoded);
}

function verifySessionToken_(token) {
  const pieces = String(token || '').split('.');
  if (pieces.length !== 2 || !constantTimeEqual_(pieces[1], sign_(pieces[0]))) return null;
  try {
    const text = Utilities.newBlob(Utilities.base64DecodeWebSafe(padBase64_(pieces[0]))).getDataAsString();
    const payload = JSON.parse(text);
    if (payload.version !== 1 || Number(payload.expiresAt) < Date.now()) return null;
    const studentNo = String(payload.studentNo || '');
    return studentNo ? { studentNo: studentNo } : null;
  } catch (_) { return null; }
}

function createTeacherSessionToken_() {
  const payload = { version: 2, role: 'teacher', expiresAt: Date.now() + TEACHER_SESSION_HOURS * 3600000 };
  const encoded = base64UrlEncode_(JSON.stringify(payload));
  return encoded + '.' + sign_(encoded);
}

function verifyTeacherSessionToken_(token) {
  const pieces = String(token || '').split('.');
  if (pieces.length !== 2 || !constantTimeEqual_(pieces[1], sign_(pieces[0]))) return null;
  try {
    const text = Utilities.newBlob(Utilities.base64DecodeWebSafe(padBase64_(pieces[0]))).getDataAsString();
    const payload = JSON.parse(text);
    if (payload.version !== 2 || payload.role !== 'teacher' || Number(payload.expiresAt) < Date.now()) return null;
    return { role: 'teacher' };
  } catch (_) { return null; }
}

function getTeacherDashboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName(STUDENTS_SHEET);
  const scoresSheet = getScoresSheet_();
  if (!studentsSheet || studentsSheet.getLastRow() < 2) throw new Error('Students 工作表没有学生名单。');

  const roster = studentsSheet.getRange(2, 1, studentsSheet.getLastRow() - 1, 4).getDisplayValues()
    .filter(r => String(r[0]).trim())
    .map(r => ({
      studentNo: String(r[0]).trim(), chineseName: String(r[1] || ''),
      englishName: String(r[2] || ''), className: String(r[3] || ''),
      easy: null, medium: null, hard: null, ticket: null,
      moneyEasy: null, moneyMedium: null, moneyHard: null, moneyTicket: null, timeEasy:null, timeMedium:null, timeHard:null, timeTicket:null, spaceEasy:null, spaceMedium:null, spaceHard:null, spaceTicket:null, lastActive: ''
    }));
  const byNo = {};
  roster.forEach(student => { byNo[student.studentNo] = student; });
  const recent = [];
  const scoreRows = allScoreRows_();
  const difficultyKeys = { '简单': 'easy', '中等': 'medium', '困难': 'hard' };

  scoreRows.forEach(r => {
    const no = String(r[1]), student = byNo[no];
    if (!student) return;
    const updatedAt = r[0] instanceof Date ? r[0].toISOString() : String(r[0] || '');
    const unit = normalizeUnit_(r[4]), activity = String(r[5]), difficulty = String(r[6]);
    const entry = {
      score: Number(r[8]) || 0, duration: Number(r[11]) || 0,
      wrongAttempts: Number(r[10]) || 0, updatedAt: updatedAt
    };
    if (unit === '单元3：分数' && activity === '配对游戏' && difficultyKeys[difficulty]) student[difficultyKeys[difficulty]] = entry;
    if (unit === '单元3：分数' && activity === '离堂小检核') student.ticket = entry;
    if (unit.indexOf('单元4：')===0 && activity === '配对游戏' && difficultyKeys[difficulty]) {
      const moneyKey = 'money' + difficultyKeys[difficulty].charAt(0).toUpperCase() + difficultyKeys[difficulty].slice(1);
      student[moneyKey] = entry;
    }
    if (unit.indexOf('单元4：')===0 && activity === '离堂小检核') student.moneyTicket = entry;
    if(unit==='单元5：时间与时刻'){const key=activity==='离堂小检核'?'timeTicket':activity==='配对游戏'&&difficultyKeys[difficulty]?'time'+difficultyKeys[difficulty].charAt(0).toUpperCase()+difficultyKeys[difficulty].slice(1):null;if(key&&(!student[key]||entry.score>student[key].score||(entry.score===student[key].score&&entry.duration<student[key].duration)))student[key]=entry;}
    if(unit==='单元7：空间') {const key=activity==='离堂小检核'?'spaceTicket':activity==='硬币闯关'&&difficultyKeys[difficulty]?'space'+difficultyKeys[difficulty].charAt(0).toUpperCase()+difficultyKeys[difficulty].slice(1):null;if(key&&(!student[key]||entry.score>student[key].score))student[key]=entry;}
    if (!student.lastActive || updatedAt > student.lastActive) student.lastActive = updatedAt;
    recent.push({
      studentNo: no, name: student.chineseName, unit: unit, activity: activity, difficulty: difficulty,
      score: entry.score, duration: entry.duration, updatedAt: updatedAt
    });
  });

  recent.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const activeStudents = roster.filter(s => s.lastActive).length;
  const completed = key => roster.filter(s => !!s[key]).length;
  const average = key => {
    const values = roster.filter(s => s[key]).map(s => s[key].score);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  };
  const leaderboards = getLeaderboards_('单元3：分数');
  const moneyLeaderboards = getLeaderboards_('单元4：钱币');
  const spaceLeaderboards = getLeaderboards_('单元7：空间');
  const timeLeaderboards = getLeaderboards_('单元5：时间与时刻');
  const unitStats=prefix=>({totalStudents:roster.length,activeStudents:roster.filter(s=>['Easy','Medium','Hard','Ticket'].some(k=>s[prefix+k])).length,easyCompleted:completed(prefix+'Easy'),mediumCompleted:completed(prefix+'Medium'),hardCompleted:completed(prefix+'Hard'),ticketCompleted:completed(prefix+'Ticket'),gameAverage:prefix==='space'?Math.round(roster.reduce((sum,s)=>sum+Math.max(...['Easy','Medium','Hard'].map(k=>s[prefix+k]?.score||0)),0)/(roster.filter(s=>['Easy','Medium','Hard'].some(k=>s[prefix+k])).length||1)):Math.round(average(prefix+'Easy')*.2+average(prefix+'Medium')*.3+average(prefix+'Hard')*.5),ticketAverage:average(prefix+'Ticket')});
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    stats: {
      totalStudents: roster.length, activeStudents: activeStudents,
      easyCompleted: completed('easy'), mediumCompleted: completed('medium'), hardCompleted: completed('hard'),
      ticketCompleted: completed('ticket'), gameAverage: Math.round((average('easy') * .2) + (average('medium') * .3) + (average('hard') * .5)),
      ticketAverage: average('ticket')
    },
    unitStats:{unit4:unitStats('money'),unit5:unitStats('time'),unit7:unitStats('space')},
    students: roster,
    recent: recent,
    gameLeaderboard: leaderboards.gameLeaderboard,
    ticketLeaderboard: leaderboards.ticketLeaderboard,
    moneyGameLeaderboard: moneyLeaderboards.gameLeaderboard,
    moneyTicketLeaderboard: moneyLeaderboards.ticketLeaderboard,
    timeGameLeaderboard:timeLeaderboards.gameLeaderboard,timeTicketLeaderboard:timeLeaderboards.ticketLeaderboard,
    spaceGameLeaderboard:spaceLeaderboards.gameLeaderboard,spaceTicketLeaderboard:spaceLeaderboards.ticketLeaderboard
  };
}

function getLeaderboards_(unit, className) {
  unit = normalizeUnit_(unit);
  const rows=unit==='单元7：空间'?scoreRows_(getScoresSheet_(unit)):scoreRows_(getLegacyScoresSheet_());
  const allowed=className?new Set(rosterRows_().filter(r=>String(r[3]).trim()===className).map(r=>String(r[0]))):null;
  const gameByStudent = new Map();
  const ticketByStudent = new Map();
  const difficultyKeys = { '简单': 'easy', '中等': 'medium', '困难': 'hard' };

  rows.forEach(r => {
    if(allowed&&!allowed.has(String(r[1])))return;
    if(unit==='单元4：钱币'?String(r[4]).indexOf('单元4：')!==0:normalizeUnit_(r[4])!==unit)return;
    const studentNo = String(r[1]), name = String(r[2]), activity = String(r[5]);
    const difficulty = String(r[6]), score = Number(r[8]) || 0, duration = Number(r[11]) || 0;
    if ((unit==='单元6：度量衡'?activity==='叠塔挑战':(activity==='配对游戏'||activity==='硬币闯关')) && difficultyKeys[difficulty]) {
      if (!gameByStudent.has(studentNo)) gameByStudent.set(studentNo, { name: name, easy: null, medium: null, hard: null });
      const student = gameByStudent.get(studentNo), key = difficultyKeys[difficulty], old = student[key];
      if (!old || score > old.score || (score === old.score && (old.duration === 0 || duration < old.duration))) student[key] = { score: score, duration: duration };
    }
    if (activity === '离堂小检核') {
      const old = ticketByStudent.get(studentNo), entry = { name: name, score: score, duration: duration };
      if (!old || score > old.score || (score === old.score && (old.duration === 0 || duration < old.duration))) ticketByStudent.set(studentNo, entry);
    }
  });

  const gameLeaderboard = Array.from(gameByStudent.values()).map(student => {
    const easy = student.easy ? student.easy.score : null;
    const medium = student.medium ? student.medium.score : null;
    const hard = student.hard ? student.hard.score : null;
    const score = (unit==='单元7：空间'||unit==='单元6：度量衡')?Math.max(easy||0,medium||0,hard||0):Math.round((easy || 0) * .2 + (medium || 0) * .3 + (hard || 0) * .5);
    const duration = ['easy','medium','hard'].reduce((sum, key) => sum + (student[key] ? student[key].duration : 0), 0);
    return { name: student.name, score: score, easy: easy, medium: medium, hard: hard, duration: duration };
  }).sort((a,b) => b.score-a.score || a.duration-b.duration || a.name.localeCompare(b.name,'zh'))
    .map((r,i) => ({ rank:i+1, name:r.name, score:r.score, easy:r.easy, medium:r.medium, hard:r.hard }));

  const ticketLeaderboard = Array.from(ticketByStudent.values())
    .sort((a,b) => b.score-a.score || a.duration-b.duration || a.name.localeCompare(b.name,'zh'))
    .map((r,i) => ({ rank:i+1, name:r.name, score:r.score }));
  return { unit:unit, scoreType:unit==='单元6：度量衡'?'height':'percent', gameLeaderboard: gameLeaderboard, ticketLeaderboard: ticketLeaderboard, leaderboard: gameLeaderboard };
}

let sessionSecretMemory_=null;
function getSessionSecret_() {
  if(sessionSecretMemory_)return sessionSecretMemory_;
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('SESSION_SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); properties.setProperty('SESSION_SECRET', secret); }
  sessionSecretMemory_=secret;
  return secret;
}
function normalizeClassCode_(value) { return String(value || '').trim().toUpperCase().replace(/\s+/g, ''); }
function normalizeUnit_(value) { if(['单元7：空间','单元7：空间硬币闯关'].indexOf(String(value))>=0)return '单元7：空间';return safeChoice_(value,['单元3：分数','单元4：钱币','单元4：纸币和硬币','单元4：经济来源和储蓄','单元5：时间与时刻','单元6：度量衡'],'单元3：分数'); }
function hashClassCode_(code) { return sign_('class-code:' + normalizeClassCode_(code)); }
function hashTeacherPassword_(password) { return sign_('teacher-password:' + String(password || '')); }
function sign_(value) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(value), getSessionSecret_())).replace(/=+$/g, ''); }
function base64UrlEncode_(value) { return Utilities.base64EncodeWebSafe(String(value)).replace(/=+$/g, ''); }
function padBase64_(value) { return value + '='.repeat((4 - value.length % 4) % 4); }
function constantTimeEqual_(left, right) {
  left = String(left || ''); right = String(right || '');
  let difference = left.length ^ right.length, length = Math.max(left.length, right.length);
  for (let i=0; i<length; i++) difference |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return difference === 0;
}
function generateReadableCode_(length) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i=0; i<length; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
function showTeacherMessage_(message) { try { SpreadsheetApp.getUi().alert(message); } catch (_) { console.log(message); } }
function safeChoice_(value, allowed, fallback) { const text = String(value || ''); return allowed.indexOf(text) >= 0 ? text : fallback; }
function jsonOutput(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
