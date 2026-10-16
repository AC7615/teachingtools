const $=id=>document.getElementById(id);
let state=null,pack=null,mode='endless',duration=90,demo=false,busy=false,configured=false,offset=0,pending=null,aimX=150,landingVersion=-1,questionDelay=0,resultDelay=0,hasMoved=false,boardRevision=0;
let boardPage=0,boardLeaders=[],localSession=null;
let skyCache=null,cloudSprites=[],cloudClock=0,localPreview=false;
let access={light:true,mixtures:false},accessRequest=null;
let catalog=[],bankBusy=false,identity=null,lobbyOpen=false,nameSearchVersion=0;
try{identity=JSON.parse(sessionStorage.getItem("tower-identity")||"null");}catch{}
function deviceId(){let id;try{id=localStorage.getItem('tower-device');if(!id){id=crypto.randomUUID();localStorage.setItem('tower-device',id);}}catch{id=sessionStorage.getItem('tower-device')||crypto.randomUUID();sessionStorage.setItem('tower-device',id);}return id;}
function activateLocal(initial){if(initial.protocol!==2)return initial;localSession?.stop();localSession=new LocalSession({initial,deviceId:deviceId(),request:api,storage:localStorage,onUpdate:s=>{state=s;render();if(s.saved)refreshBoard();},onError:(message,fatal)=>{if(fatal){state.phase='ended';state.reason=message;showError(message);render();}}});offset=localSession.offset;localSession.schedule();return localSession.state;}
let answerPreview=false,queuedCommand=null,boardBusy=false,previewFall=false;
let particles=[],toastUntil=0,collapseAt=0,lastFrame=performance.now(),lastAutoAttempt=0,fastDrop=null,cameraPose=null,crashSoundPlayed=false;
const music=new TowerAudio();
const held=new Set(),canvas=$('canvas'),ctx=canvas.getContext('2d');
const colors=['#ffe42b','#ff426b','#2de668','#aa43fa','#ffad2c','#25b9ff'];
const unit=()=>packKey();
let mathIdentity={logged:false,name:'访客小建筑师'},mathSaveStatus='',mathReported=new Set(),mathFrames=null,mathPractice=false;const mathRequests=new Map();
function mathBridge(type,payload={}){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{mathRequests.delete(id);reject(Error('数学主页连接超时'));},60000);mathRequests.set(id,{resolve,reject,timer});parent.postMessage({channel:'measurement-tower',type,payload,id},location.origin);});}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;const m=e.data;if(m?.channel==='measurement-tower-response'){const p=mathRequests.get(m.id);if(!p)return;clearTimeout(p.timer);mathRequests.delete(m.id);if(m.result?.error)p.reject(Error(m.result.error));else p.resolve(m.result);}if(m?.type==='measurement-tower-visible'){if(!m.visible){Unit6Voice.stop();if(!mathPaused)mathPaused=Date.now();music.ctx?.suspend().catch(()=>{});}else{if(mathPaused){const paused=Date.now()-mathPaused;if(state?.phase==='placing')state.dropStarted+=paused;if(fastDrop)fastDrop.started+=paused;if(collapseAt)collapseAt+=paused;if(resultDelay)resultDelay+=paused;if(questionDelay)questionDelay+=paused;mathPaused=0;}music.ctx?.resume().catch(()=>{});}}});let mathPaused=0;
async function api(b){if(b.action==='access')return{access:{light:true,mixtures:true}};if(b.action==='leaderboard')return mathBridge('board',{level:pack.id.replace('measure-','')});if(b.action==='content')return{pack:PACK};throw Error('此操作请使用数学主页。');}
async function reportMath(){if(!state||state.phase!=='ended'||mathReported.has(state.created))return;mathReported.add(state.created);if(mathPractice||!mathIdentity.logged){mathSaveStatus='访客体验，成绩不上传。';render();return;}mathSaveStatus=mathIdentity.logged?'正在保存最高塔高…':'访客体验，成绩不上传。';render();try{const r=await mathBridge('save',{height:state.best,correct:state.correct,attempts:state.attempts,duration:(Date.now()-state.created)/1000,level:pack.id.replace('measure-','')});mathSaveStatus=r.status;render();refreshBoard();}catch{mathSaveStatus='成绩同步暂时中断，请回数学主页重试。';render();}}
async function loginRequest(body){for(let attempt=0;;attempt++){try{return await api(body);}catch(e){if(!e.retryable||attempt>=6)throw e;await new Promise(r=>setTimeout(r,1000+Math.random()*3000));}}}

function showError(message,retry=false){$('error').textContent=message;$('errorBox').hidden=false;$('retry').hidden=!retry;}
function toast(text){$('toast').textContent=text;toastUntil=Date.now()+1800;}
function loadContent(content){pack=setPack(content);skyCache=null;document.body.dataset.theme=pack.theme;$('unitTitle').textContent=pack.title;$('startTitle').replaceChildren(document.createTextNode(pack.title));const span=document.createElement('span');span.textContent='叠叠塔';$('startTitle').append(span);document.title=pack.title+' · 数学叠叠塔';$('bankSelect').value=pack.id;$('bankDescription').textContent=pack.description+' · '+pack.questions.length+' 道图画题'+(pack.variants?.enabled?'＋变式':'');}
async function selectBank(id){
 if(state||busy||bankBusy)return;const entry=catalog.find(p=>p.id===id);if(!entry)return;
 bankBusy=true;$('bankSelect').disabled=true;$('demo').disabled=true;$('login').querySelector('button').disabled=true;$('connection').textContent='正在读取题库…';
 try{const content=await(await fetch(entry.path)).json();if(content.id!==id)throw Error('题库编号与选择列表不一致。');
 loadContent(content);$('bankSelect').value=id;$('bankDescription').textContent=pack.description+' · '+pack.questions.length+' 道图画题'+(pack.variants?.enabled?'＋变式':'');
 try{localStorage.setItem('tower-bank',id);}catch{}boardLeaders=[];boardPage=0;boardRevision++;$('tickerText').textContent=pack.title+'挑战 · 等待第一位高塔冠军';renderBoardPage();render();refreshBoard();$('errorBox').hidden=true;
 $('connection').textContent=configured?(localPreview?'● 本地预览 · 成绩仅供测试':'● 班级成绩表已连接'):'访客模式可用 · 等待连接班级成绩表';
 }catch(e){showError('题库未能载入：'+e.message);if(pack)$('bankSelect').value=pack.id;else $('connection').textContent='请稍后重新选择题库';}
 finally{bankBusy=false;$('bankSelect').disabled=false;$('demo').disabled=!pack;$('login').querySelector('button').disabled=!pack;}
}
function persist(){if(!demo&&state)sessionStorage.setItem('tower-session',state.token);}
async function command(action,extra={}){
 if(action==='answer'||action==='finish')Unit6Voice.stop();
 if(localSession&&!demo){
  if(busy||localSession.blocked)return;
  try{state=localSession.perform(action,extra);persist();$('errorBox').hidden=true;
   if(['answer','skill'].includes(action)&&state.phase==='placing'){aimX=95+Math.random()*110;landingVersion=-1;fastDrop=null;music.tempo(state.height);music.fall(fallDuration(state));toast('答对了！积木来了 ✦');}
   if(action==='answer'&&state.phase==='powerup'){music.stopFall();music.land(true);}
   if(action==='place'&&state.phase==='question'){questionDelay=Date.now()+250;fastDrop=null;burst(aimX);music.land(state.lastPlacement?.perfect);music.tempo(state.height);toast('接住了！继续向上 ↑');}
   if(state.phase==='ended'){music.stopFall();if(state.failedBlock){collapseAt=Date.now();resultDelay=Date.now()+4200;crashSoundPlayed=false;}else music.finish();localSession.flush();}
  }catch(e){showError(e.message);}render();return;
 }

 if(!state)return;
 if(busy){if(answerPreview&&!queuedCommand&&['skill','place','continue','finish'].includes(action)){queuedCommand={action,extra:action==='place'?{...extra,quick:true}:extra};render();}return;}
 busy=true;$('errorBox').hidden=true;
 const body={action,...extra,token:state.token,version:state.version,requestId:crypto.randomUUID()};if(action==='place'&&previewFall)body.quick=true;pending=body;
 const previous=state;let confirmed=false;
 if(!demo&&action==='answer'){
  const preview=previewAnswer(state,extra.choice,Date.now()+offset);
  if(preview){state=preview;answerPreview=true;
   if(state.phase==='placing'){aimX=95+Math.random()*110;landingVersion=-1;fastDrop=null;music.tempo(state.height);music.fall(fallDuration(state));toast('答对了！积木来了 ✦');}
   else if(state.phase==='powerup'){music.stopFall();music.land(true);}
  }
 }
 render();
 try{
  if(demo){act(state,body,Date.now());state.saved=false;try{localStorage.setItem('tower-seen:'+unit(),JSON.stringify(state.recentIds));}catch{}}else{
   const visualStart=answerPreview&&state.phase==='placing'?state.dropStarted-offset:null;
   state=await api(body);offset=state.serverNow-Date.now();
   if(visualStart!==null&&state.phase==='placing'){state.dropStarted=visualStart+offset;previewFall=true;}else previewFall=false;
   persist();
  }
  pending=null;confirmed=true;
  if(!answerPreview&&['answer','skill'].includes(action)&&state.phase==='placing'){aimX=95+Math.random()*110;landingVersion=-1;fastDrop=null;music.tempo(state.height);music.fall(fallDuration(state));toast(state.layers.length<2?'两块可以并排，搭好地基！':'答对了！积木来了 ✦');}
  if(!answerPreview&&action==='answer'&&state.phase==='powerup'){music.stopFall();music.land(true);}
  if(action==='place'&&state.phase==='question'){questionDelay=Date.now()+650;fastDrop=null;burst(aimX);music.land(state.lastPlacement?.perfect);music.tempo(state.height);toast(state.lastPlacement?.sideBySide?'并排接稳！地基更宽了 ✦':state.lastPlacement?.perfect?'完美接住！ ✦':'接住了！继续向上 ↑');}
  if(state.phase==='ended'){music.stopFall();if(state.failedBlock){collapseAt=Date.now();resultDelay=Date.now()+4200;crashSoundPlayed=false;}else music.finish();refreshBoard();}
 }catch(e){if(answerPreview){state=previous;fastDrop=null;music.stopFall();}queuedCommand=null;showError(e.message,!demo);lastAutoAttempt=Date.now();}
 finally{busy=false;answerPreview=false;render();if(state?.phase==='ended')reportMath();if(confirmed&&queuedCommand){const next=queuedCommand;queuedCommand=null;command(next.action,next.extra);}}
}
async function start(isDemo){
 if(busy||bankBusy||!pack)return;busy=true;await music.unlock().catch(()=>{});music.start();demo=true;mathSaveStatus='';$('errorBox').hidden=true;
 try{
  await refreshAccess();if(access[pack.id]===false)throw Error('混合物题库尚未开放，请等待老师解锁。');
  if(demo){localSession?.stop();localSession=null;let seen=[];try{seen=JSON.parse(localStorage.getItem('tower-seen:'+unit())||'[]');}catch{}state=newGame(unit(),mode,duration,Date.now(),seen);state.student={name:mathPractice?'访客小建筑师':mathIdentity.name,class:''};offset=0;}
  else{const verified=(await api({action:'content',unit:unit()})).pack;if(verified.id!==pack.id)throw Error('后台题库尚未更新，请稍后再试。');loadContent(verified);state=activateLocal(await loginRequest({action:'start',studentId:identity?.studentId||$('studentId').value.trim(),unit:unit(),mode,duration,protocol:2,deviceId:deviceId()}));if(!localSession)offset=state.serverNow-Date.now();persist();}
  aimX=150;collapseAt=0;landingVersion=-1;questionDelay=0;resultDelay=0;hasMoved=false;fastDrop=null;cameraPose=null;particles=[];render();
 }catch(e){showError(e.message);}finally{busy=false;render();}
}
function render(){
 if(!pack)return;
 $('modeHint').textContent='无限挑战 · 只拼高度，塔越高越考验地基！';
 $('setupOverlay').hidden=Boolean(state)||lobbyOpen;$('lobby').hidden=!lobbyOpen||Boolean(state);$('stats').hidden=!state;$('finish').hidden=!state||state.phase==='ended';$('boardButton').disabled=state?.phase==='placing';
 $('finish').setAttribute('aria-label',mathIdentity.logged&&!mathPractice?'结束挑战并记录成绩':'结束访客游戏');
 const question=state&&['question','review'].includes(state.phase)&&Date.now()>=questionDelay,placing=state?.phase==='placing',powerup=state?.phase==='powerup',ended=state?.phase==='ended';
 const showPowerup=powerup&&$('powerupOverlay').hidden;$('powerupOverlay').hidden=!powerup;
 $('questionOverlay').hidden=!question;$('resultOverlay').hidden=!ended||Date.now()<resultDelay;$('skills').hidden=!powerup;$('moveHint').hidden=!placing||hasMoved;
 if(!powerup||state.skill)$('shapeMenu').hidden=true;
 if(!state){$('height').innerHTML='0 <span>cm</span>';return;}
 $('height').innerHTML=state.best+' <span>cm</span>';$('playerName').textContent=state.student.name;$('correct').textContent=state.correct+' / '+state.attempts;$('energy').textContent=state.energy;$('streak').textContent='连对 '+state.streak;$('powerupText').textContent='连续答对 '+state.streak+' 题！选择一个技能后积木才会下降。';
 if(question){
  const q=state.question;$('questionNumber').textContent='第 '+(state.attempts+(state.phase==='question'?1:0))+' 题';$('questionText').textContent=q.text;$('standard').textContent=(q.standard?'DSKP '+q.standard+' · ':'')+q.source;
  const sourceQuestion=PACK.questions.find(a=>a.id===q.id);$('measurementArt').innerHTML=MeasurementScenes.render(sourceQuestion.scene,q.text);
  const img=$('questionImage'),src=q.visual?questionVisual(q.visual):q.image;img.hidden=!src;if(src){if(img.getAttribute('src')!==src)img.src=src;img.alt=q.imageAlt;}
  const visual=q.options.every(o=>o.image);$('answers').className='answers'+(visual?' visual':'');$('answers').style.gridTemplateColumns=visual?'repeat('+q.options.length+',1fr)':'';
  $('answers').replaceChildren(...q.options.map((option,i)=>{const b=document.createElement('button'),letter=document.createElement('span');letter.className='letter';letter.textContent=String.fromCharCode(65+i);b.append(letter);if(option.image){const image=document.createElement('img');image.src=option.image;image.alt=option.imageAlt||option.text;b.append(image);}const text=document.createElement('span');text.textContent=option.text;b.append(text);b.disabled=state.phase!=='question'||busy;if(state.phase==='review'){if(option.text===state.feedback.answer)b.classList.add('correct');if(i===state.feedback.choice)b.classList.add('wrong');}b.onclick=()=>command('answer',{choice:i});return b;}));
  $('feedback').hidden=state.phase!=='review';$('feedback').textContent=state.phase==='review'?'正确答案：'+state.feedback.answer+'。'+state.feedback.explanation:'';$('continue').hidden=state.phase!=='review';$('continue').disabled=(busy&&!answerPreview)||Boolean(queuedCommand);
 }
 document.querySelectorAll('[data-skill]').forEach(b=>{b.disabled=(busy&&!answerPreview)||Boolean(queuedCommand)||state.energy<1||Boolean(state.skill);b.classList.toggle('selected',state.skill===b.dataset.skill);});$('shapeButton').disabled=(busy&&!answerPreview)||Boolean(queuedCommand)||state.energy<1||Boolean(state.skill);$('shapeButton').classList.toggle('selected',state.skill==='shape');$('finish').disabled=(busy&&!answerPreview)||Boolean(queuedCommand);
 $('skipSkill').disabled=(busy&&!answerPreview)||Boolean(queuedCommand);if(showPowerup)$('skills').querySelector('button').focus();document.querySelectorAll('[data-shape]').forEach(b=>b.disabled=(busy&&!answerPreview)||Boolean(queuedCommand));
 if(demo){$('syncStatus').textContent=mathIdentity.logged&&!mathPractice?'班级挑战':'访客模式';$('again').disabled=false;}
 if(localSession&&!demo){$('syncStatus').textContent=localSession.blocked?'登录已失效':localSession.events.length?'待同步 '+localSession.events.length+' 项':'已同步';$('again').disabled=ended&&!state.saved&&!localSession.blocked;}
 if(ended){$('switchBank').disabled=$('again').disabled;$('switchIdentity').disabled=$('again').disabled;$('resultHeight').innerHTML=state.best+' <small>cm</small>';$('resultReason').textContent=state.reason;$('resultStats').replaceChildren(...[[state.layers.length,'积木数量'],[state.correct+'/'+state.attempts,'答对 / 作答'],[(state.attempts?Math.round(state.correct/state.attempts*100):0)+'%','正确率']].map(([n,label])=>{const p=document.createElement('span'),b=document.createElement('b');b.textContent=n;p.append(b,document.createTextNode(label));return p;}));$('saveStatus').textContent=mathSaveStatus||'挑战结束后记录最高塔高。';}
}
$('mathReadQuestion').onclick=()=>{if(state?.question)Unit6Voice.play(state.question.text);};
$('questionImage').onerror=()=>{showError('这道题的图片未能载入，请检查题库图片。');};
function showLoginPanel(open){$('entryChoices').hidden=open;$('loginPanel').hidden=!open;$('showLogin').setAttribute('aria-expanded',String(open));(open?$('studentName'):$('showLogin')).focus();}
$('showLogin').onclick=()=>showLoginPanel(true);$('backToEntry').onclick=()=>showLoginPanel(false);
$('bankSelect').onchange=()=>selectBank($('bankSelect').value);
function rememberIdentity(value){identity=value;sessionStorage.setItem('tower-identity',JSON.stringify(value));}
function clearGame(){localSession?.stop();localSession=null;state=null;pending=null;questionDelay=0;resultDelay=0;collapseAt=0;fastDrop=null;cameraPose=null;music.stop();sessionStorage.removeItem('tower-session');$('errorBox').hidden=true;}
function showWorld(){lobbyOpen=true;$('lobbyPlayer').textContent=identity?.guest?'访客小建筑师 · 自由探索':identity?.name+' · '+(identity?.class||'');renderWorld();render();refreshAccess().catch(()=>{});}
async function refreshAccess(){if(accessRequest)return accessRequest;accessRequest=(async()=>{const result=await api({action:'access'});if(!result.access||typeof result.access.mixtures!=='boolean')throw Error('题库开放设置暂时无法读取，请稍后重试。');access=result.access;if(lobbyOpen)renderWorld();})();try{await accessRequest;}finally{accessRequest=null;}}
function changeIdentity(){if(busy)return;if(state&&!demo&&!state.saved&&!localSession?.blocked)return;clearGame();rememberIdentity(null);lobbyOpen=false;$('studentName').value='';$('studentId').value='';$('nameResults').replaceChildren();render();showLoginPanel(false);}
function renderWorld(){
 $('worldCards').replaceChildren(...catalog.map((entry,index)=>{const locked=access[entry.id]===false,card=document.createElement('button');card.className='world-card measurement-world '+entry.theme+' '+entry.id+(locked?' is-locked':'');card.disabled=busy||bankBusy||locked;card.setAttribute('aria-label',entry.title+(locked?'，尚未开放，等待老师解锁':'，进入挑战'));card.innerHTML='<span class="island-number">'+(index+1)+'</span><span class="theme-art" style="background-image:url(../../assets/unit6/map-'+entry.theme+'.png)" aria-hidden="true"></span><strong>'+entry.title+'</strong><span class="world-description">'+entry.description+'</span><span class="world-enter">进入挑战 →</span>';card.onclick=async()=>{if(busy||bankBusy||access[entry.id]===false)return;$('lobbyStatus').textContent='正在准备 '+entry.title+'…';await selectBank(entry.id);if(pack?.id!==entry.id){$('lobbyStatus').textContent='题库读取失败，请重试';return;}lobbyOpen=false;await start(Boolean(identity?.guest));if(!state){lobbyOpen=true;render();}$('lobbyStatus').textContent='';};return card;}));
}
$('studentName').oninput=()=>{const version=++nameSearchVersion;const query=$('studentName').value.trim();$('studentId').value='';$('nameResults').replaceChildren();if(!query)return;setTimeout(async()=>{if(version!==nameSearchVersion)return;try{const result=await api({action:'students',query});if(version!==nameSearchVersion)return;$('nameResults').replaceChildren(...result.students.map(student=>{const button=document.createElement('button');button.type='button';button.textContent=student.name+' · '+student.class;button.onclick=()=>{$('studentName').value=student.name;$('studentId').value=student.studentId;$('nameResults').replaceChildren();rememberIdentity({...student,guest:false});};return button;}));if(!result.students.length)$('nameResults').textContent='没有找到，请继续输入或检查拼写。';}catch(e){if(version===nameSearchVersion)$('nameResults').textContent='名字列表暂时无法读取，请稍后重试。';}},250);};
$('login').onsubmit=e=>{e.preventDefault();if(!$('studentId').value){$('nameResults').textContent='请先从匹配名单中选择自己的名字。';return;}showWorld();};$('demo').onclick=()=>{mathPractice=true;configured=false;rememberIdentity({guest:true});showWorld();};$('continue').onclick=()=>command('continue');$('finish').onclick=()=>command('finish');
$('again').onclick=()=>{if(busy||$('again').disabled)return;clearGame();lobbyOpen=false;render();start(Boolean(identity?.guest));};
$('switchBank').onclick=()=>{if(busy||$('again').disabled)return;clearGame();showWorld();};$('switchIdentity').onclick=changeIdentity;$('lobbyIdentity').onclick=changeIdentity;
function updateSoundButton(){$('soundButton').textContent=music.enabled?'♫':'♩';$('soundButton').setAttribute('aria-pressed',String(music.enabled));$('soundButton').setAttribute('aria-label',music.enabled?'关闭音乐与音效':'开启音乐与音效');}
$('soundButton').onclick=()=>{music.toggle();updateSoundButton();};updateSoundButton();
for(const b of document.querySelectorAll('[data-skill]'))b.onclick=()=>command('skill',{skill:b.dataset.skill});
$('shapeButton').onclick=()=>{$('shapeMenu').hidden=!$('shapeMenu').hidden;};for(const b of document.querySelectorAll('[data-shape]'))b.onclick=()=>{$('shapeMenu').hidden=true;command('skill',{skill:'shape',shape:b.dataset.shape});};
$('skipSkill').onclick=()=>command('skill',{skill:'skip'});
function openBoard(){boardPage=0;renderBoardPage();$('boardOverlay').hidden=false;refreshBoard();$('closeBoard').focus();}
$('boardButton').onclick=openBoard;$('resultBoard').onclick=openBoard;$('closeBoard').onclick=()=>{$('boardOverlay').hidden=true;$('boardButton').focus();};
$('dismissError').onclick=()=>{$('errorBox').hidden=true;};
$('retry').onclick=async()=>{
 if(localSession&&!demo){localSession.flush();return;}
 if(busy||!state)return;busy=true;
 try{state=await api(pending||{action:'state',token:state.token});offset=state.serverNow-Date.now();pending=null;$('errorBox').hidden=true;landingVersion=-1;persist();if(state.phase==='ended')refreshBoard();}
 catch(e){showError(e.message,true);}finally{busy=false;render();}
};
function renderBoardPage(){
 const pages=Math.max(1,Math.ceil(boardLeaders.length/5));boardPage=Math.min(Math.max(0,boardPage),pages-1);
 $('boardRows').replaceChildren();
 if(!boardLeaders.length){const p=document.createElement('p');p.className='board-empty';p.textContent='还没有纪录，来建造第一座数学高塔吧！';$('boardRows').append(p);}
 for(const [index,p] of boardLeaders.slice(boardPage*5,boardPage*5+5).entries()){
  const i=boardPage*5+index,row=document.createElement('div');row.className='board-row';
  const rank=document.createElement('b'),name=document.createElement('span'),small=document.createElement('small'),height=document.createElement('strong');
  rank.textContent=i===0?'🥇':String(i+1).padStart(2,'0');name.textContent=p.name+' ';small.textContent=p.class;name.append(small);height.textContent=p.height+' cm';row.append(rank,name,height);$('boardRows').append(row);
 }
 $('boardPage').textContent='第 '+(boardPage+1)+' / '+pages+' 页';$('boardPrevious').disabled=boardPage===0;$('boardNext').disabled=boardPage>=pages-1;
}
$('boardPrevious').onclick=()=>{boardPage--;renderBoardPage();};
$('boardNext').onclick=()=>{boardPage++;renderBoardPage();};
async function refreshBoard(){
 if(!pack||boardBusy)return;const rev=++boardRevision;$('boardScope').textContent=pack.title+' · '+(mode==='timed'?duration+' 秒挑战':'无限挑战');
 if(!configured){$('boardRows').innerHTML='<p class="board-empty">班级成绩表尚未连接。<br>试玩不会进入排行榜。</p>';$('tickerText').textContent=pack.title+'挑战 · 等待第一位高塔冠军';return;}
 boardBusy=true;try{const data=await api({action:'leaderboard',unit:unit(),mode,duration});if(rev!==boardRevision)return;$('connection').textContent='● 班级成绩表已连接';boardLeaders=data.leaders;renderBoardPage();$('boardTime').textContent='每 15 秒更新 · '+new Date(data.updatedAt).toLocaleTimeString('zh-CN',{timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',minute:'2-digit',second:'2-digit'});$('tickerText').textContent=data.leaders.length?'★ 最高塔：'+data.leaders[0].name+' · '+data.leaders[0].height+' cm':'等待第一位高塔冠军 · 每 15 秒更新';}
 catch{$('boardTime').textContent='连接暂时中断 · 15 秒后重试';}finally{boardBusy=false;if(rev!==boardRevision)refreshBoard();}
}
function scaleFor(w){return Math.min(w/400,1.4);}
function moveTo(e){if(state?.phase!=='placing'||pending?.action==='place'||fastDrop)return;hasMoved=true;$('moveHint').hidden=true;const r=canvas.getBoundingClientRect();aimX=Math.max(20,Math.min(280,150+(e.clientX-r.left-r.width/2)/(cameraPose?.scale||scaleFor(r.width))));if(!demo)sessionStorage.setItem('tower-aim',String(aimX));}
let pressStart=null;
function quickDrop(){if(state?.phase!=='placing'||(busy&&!answerPreview)||(pending&&!answerPreview)||queuedCommand||fastDrop)return;hasMoved=true;$('moveHint').hidden=true;const now=Date.now()+offset;fastDrop={started:Date.now(),duration:140,from:moving(state,now).progress};music.drop();}
canvas.addEventListener('pointermove',moveTo);canvas.addEventListener('pointerdown',e=>{if(state?.phase==='placing'){moveTo(e);pressStart={x:e.clientX,y:e.clientY,time:Date.now()};canvas.setPointerCapture(e.pointerId);e.preventDefault();}});
canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(pressStart&&Date.now()-pressStart.time<350&&Math.hypot(e.clientX-pressStart.x,e.clientY-pressStart.y)<10)quickDrop();pressStart=null;});canvas.addEventListener('pointercancel',()=>{pressStart=null;});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&state?.phase==='placing'&&!['BUTTON','INPUT','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();quickDrop();}if(e.code==='Escape'){$('boardOverlay').hidden=true;$('shapeMenu').hidden=true;}if(state?.phase==='placing'&&['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();hasMoved=true;$('moveHint').hidden=true;if(!e.repeat)aimX=Math.max(20,Math.min(280,aimX+(e.code==='ArrowLeft'?-12:12)));held.add(e.code);}});window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>held.clear());
// Keep keyboard focus inside whichever overlay is active.
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const overlay=[$('boardOverlay'),$('resultOverlay'),$('powerupOverlay'),$('questionOverlay'),$('setupOverlay')].find(o=>!o.hidden);if(!overlay)return;const nodes=[...overlay.querySelectorAll('button:not(:disabled),input,select:not(:disabled),summary')].filter(n=>n.offsetParent);if(!nodes.length)return;const i=nodes.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&(i===nodes.length-1||i<0)){e.preventDefault();nodes[0].focus();}});
function burst(x){for(let i=0;i<25;i++)particles.push({x,vx:(Math.random()-.5)*140,y:0,vy:-70-Math.random()*100,color:colors[i%6],life:1});}
function cloud(x,y,size,paint=ctx){const g=paint.createRadialGradient(x,y,0,x,y,size);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#eaffff15');paint.fillStyle=g;paint.beginPath();paint.ellipse(x,y,size,size*.35,0,0,Math.PI*2);paint.fill();for(const [dx,dy,r]of[[-.45,0,.36],[-.15,-.18,.42],[.2,-.11,.38],[.52,.03,.27]]){paint.fillStyle='#ffffffd9';paint.beginPath();paint.ellipse(x+dx*size,y+dy*size,r*size,r*size*.67,0,0,Math.PI*2);paint.fill();}}
function block(x,y,w,h,color,rotation=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const theme=pack?.theme||'gummy',index=colors.indexOf(color),palettes={gummy:['#ffb83b','#ff6ba4','#60d8ac','#ab7df5','#ffb48b','#6ccdf0'],crystal:['#8de8ec','#be95ee','#7bb9f3','#94dfc7','#f0b5db','#f5d48a']},base=index>=0&&palettes[theme]?palettes[theme][index]:color,r=theme==='gummy'?Math.min(10,h/3,w/4):3;
 ctx.shadowColor=theme==='gummy'?'#bf5c9e44':'#17476144';ctx.shadowBlur=8;ctx.shadowOffsetY=4;const g=ctx.createLinearGradient(0,0,w*.4,h);g.addColorStop(0,base);g.addColorStop(1,base);ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-w/2,0,w,h,r);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 if(theme==='gummy'){ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.roundRect(-w/2+3,3,Math.max(2,w-6),Math.max(3,h*.24),r*.7);ctx.fill();ctx.strokeStyle='#ffffff88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w/2+5,6);ctx.lineTo(-w/2+5,h-6);ctx.stroke();ctx.fillStyle='#ffffff24';ctx.fillRect(w*.22,4,Math.min(5,w*.1),Math.max(2,h-8));}
 else if(theme==='bricks'){ctx.fillStyle='#0000001f';ctx.fillRect(w/2-5,3,5,Math.max(1,h-3));ctx.fillStyle='#ffffff50';ctx.fillRect(-w/2+2,2,w-4,3);const n=Math.max(1,Math.floor(w/21));for(let i=0;i<n;i++){const sx=-w/2+(i+.5)*w/n;ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(sx,-2,Math.min(7,w/n*.32),4,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff99';ctx.lineWidth=1.2;ctx.stroke();}}
 else{ctx.fillStyle='#ffffff48';ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w*.08,h*.38);ctx.lineTo(w/2,0);ctx.closePath();ctx.fill();ctx.fillStyle='#294d9d26';ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w*.08,h*.38);ctx.lineTo(w/2,h);ctx.closePath();ctx.fill();ctx.strokeStyle='#e7ffffb0';ctx.lineWidth=1.3;ctx.strokeRect(-w/2+1,1,w-2,h-2);ctx.beginPath();ctx.moveTo(-w*.25,h*.2);ctx.lineTo(-w*.25,h*.55);ctx.moveTo(-w*.25-h*.12,h*.37);ctx.lineTo(-w*.25+h*.12,h*.37);ctx.stroke();}
 ctx.restore();
}
function pixelBlock(x,y,w,h,color,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const palette=['#89b940','#897566','#8c9ba8','#b08657','#c59d42','#6abec5'],base=palette[colors.indexOf(color)]||'#8aa958';ctx.fillStyle=base;ctx.fillRect(-w/2,0,w,h);const size=Math.max(3,Math.min(9,w/7));ctx.save();ctx.beginPath();ctx.rect(-w/2,0,w,h);ctx.clip();for(let row=0;row<h/size;row++)for(let col=0;col<w/size;col++){const value=(row*17+col*13)%7;ctx.fillStyle=value<2?'#ffffff2e':value>4?'#00000022':base;ctx.fillRect(-w/2+col*size,row*size,size,size);}if(base==='#89b940'){ctx.fillStyle='#b4ef60';ctx.fillRect(-w/2,0,w,Math.min(8,h*.25));}ctx.restore();ctx.strokeStyle='#253b4d';ctx.lineWidth=2;ctx.strokeRect(-w/2,0,w,h);ctx.fillStyle='#ffffff55';ctx.fillRect(-w/2,0,w,2);ctx.restore();}
function drawPiece(b,x,y,scale,rotation=0){
 const cells=cellsOf(b);ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
 for(const cell of cells)(pack?.id==='mixtures'?pixelBlock:block)(cell.dx*scale,(b.height-cell.dy-cell.height)*scale,cell.width*scale,cell.height*scale,colors[b.color??0]);
 ctx.restore();
}
function draw(frame){
 if(mathPaused){lastFrame=frame;requestAnimationFrame(draw);return;}const dt=Math.min(.04,(frame-lastFrame)/1000);lastFrame=frame;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(w<2||h<2){requestAnimationFrame(draw);return;}
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(!skyCache||skyCache.width!==canvas.width||skyCache.height!==canvas.height){
  skyCache=document.createElement('canvas');skyCache.width=canvas.width;skyCache.height=canvas.height;const paint=skyCache.getContext('2d');paint.setTransform(dpr,0,0,dpr,0,0);
  const sky=paint.createLinearGradient(0,0,0,h);const palette=pack?.theme==='gummy'?['#b87acb','#e7b2dc','#a6e2c5']:pack?.theme==='crystal'?['#38417f','#7c93cd','#82d9d3']:['#187ee1','#57b8ed','#80d0b4'];sky.addColorStop(0,palette[0]);sky.addColorStop(.5,palette[1]);sky.addColorStop(1,palette[2]);paint.fillStyle=sky;paint.fillRect(0,0,w,h);
  // Cache the soft cloud artwork once; each frame only moves the small sprites.
  cloudSprites=[[.15,.28,Math.min(130,w*.24),48,.12],[.82,.38,Math.min(180,w*.3),36,-.1],[.43,.13,Math.min(95,w*.18),24,.08],[.09,.65,Math.min(90,w*.15),30,.09]].map(([x,y,size,drift,speed])=>{
   const sprite=document.createElement('canvas'),width=size*2.4,height=size*1.2;sprite.width=Math.ceil(width*dpr);sprite.height=Math.ceil(height*dpr);const brush=sprite.getContext('2d');brush.setTransform(dpr,0,0,dpr,0,0);cloud(width/2,height/2,size,brush);return {sprite,x,y,width,height,drift,speed};
  });
  paint.fillStyle='#75dabc88';paint.beginPath();paint.ellipse(w*.25,h+18,w*.75,105,0,0,Math.PI*2);paint.fill();paint.fillStyle='#91e6a999';paint.beginPath();paint.ellipse(w*.86,h+25,w*.5,90,0,0,Math.PI*2);paint.fill();
 }
 ctx.drawImage(skyCache,0,0,w,h);
 // Freeze the same cloud positions while answering or choosing a reward.
 if(state?.phase==='placing'&&!reduced)cloudClock+=dt;
 for(const c of cloudSprites){const drift=Math.sin(cloudClock*c.speed)*Math.min(c.drift,w*.12);ctx.drawImage(c.sprite,w*c.x+drift-c.width/2,h*c.y-c.height/2,c.width,c.height);}
 const normalScale=scaleFor(w),ground=h-140,total=state?.height||0,center=w/2,now=Date.now()+offset;
 const scene=state?state.layers:[{x:125,width:38,height:38,bottom:0,color:2},{x:170,width:38,height:38,bottom:0,color:5},{x:148,width:88,height:14,bottom:38,color:0},{x:133,width:26,height:58,bottom:52,color:4},{x:171,width:38,height:38,bottom:52,color:1},{x:148,width:64,height:22,bottom:110,color:3}];
 const age=collapseAt?(Date.now()-collapseAt)/1000:0,crashTime=collapseAt?Math.max(0,age-1.8):0;
 const target=towerCameraTargets(w,h,total,age);
 if(!cameraPose)cameraPose={scale:scaleFor(w),offset:target.offset};const blend=1-Math.exp(-dt*(collapseAt?12:7));cameraPose.scale+=(target.scale-cameraPose.scale)*blend;cameraPose.offset+=(target.offset-cameraPose.offset)*blend;
 const scale=cameraPose.scale,camera=cameraPose.offset;
 const motion=state?.phase==='placing'?moving(state,now):state?moving(state,(state.dropStarted||0)+frame):{sway:0,progress:0};
 ctx.font='700 12px system-ui';ctx.fillStyle='white';ctx.strokeStyle='#ffffffba';ctx.lineWidth=2;ctx.setLineDash([8,10]);for(let cm=Math.floor(camera/scale/100)*100;cm<(camera+h)/scale;cm+=100){const y=ground-cm*scale+camera;if(y<195||y>ground)continue;ctx.beginPath();ctx.moveTo(center+105*scale,y);ctx.lineTo(center+148*scale,y);ctx.stroke();ctx.fillText(cm+' cm',center+105*scale,y-8);}ctx.setLineDash([]);
 ctx.fillStyle='#2aa8a5';ctx.beginPath();ctx.ellipse(center,ground+camera+8,105*scale,12*scale,0,0,7);ctx.fill();block(center,ground+camera,160*scale,12*scale,'#fff0c0');
 if(collapseAt){ctx.save();ctx.font='900 19px system-ui';ctx.fillStyle='white';ctx.textAlign='center';ctx.shadowColor='#198cca';ctx.shadowOffsetY=2;ctx.fillText(crashTime?'哗啦！下次搭稳地基！':'你的高塔：'+state.best+' cm',center,183);ctx.restore();if(crashTime>0&&!crashSoundPlayed){music.collapse();crashSoundPlayed=true;}}
 scene.forEach((b,i)=>{
  const wobble=reduced||collapseAt?0:motion.sway*(b.bottom+b.height)/Math.max(total,1),fall=crashTime?Math.min(2.5,crashTime):0;
  const horizontal=fall*(i%2?1:-1)*(28+(i*13)%47),vertical=fall*fall*155;
  const y=ground-(b.bottom+b.height)*scale+camera+vertical;if(!collapseAt&&(y+b.height*scale<-80||y>h+80))return;
  drawPiece(b,center+(b.x-150+wobble+horizontal)*scale,y,scale,fall*(i%2?1:-1)*(.4+i*.04));
 });
 if(collapseAt&&state.failedBlock&&!state.failedBlock.placed){const b={...state.failedBlock,color:state.correct%6};drawPiece(b,center+(b.x-150+crashTime*60)*scale,ground-(b.bottom+b.height)*scale+camera+crashTime*crashTime*160,scale,crashTime*.9);}
 if(state?.phase==='placing'){
  if((!busy||answerPreview)&&!fastDrop){if(held.has('ArrowLeft'))aimX=Math.max(20,aimX-dt*100);if(held.has('ArrowRight'))aimX=Math.min(280,aimX+dt*100);}
  const shape=RULES.shapes[state.shape],contact=landingAt(state,aimX,now),targetY=ground-(contact.bottom+shape.height)*scale+camera,towerTop=ground-total*scale+camera;
  const spawn=Math.max(175,Math.min(h*.30,towerTop-Math.min(200,h*.3))),progress=fastDrop?Math.min(1,fastDrop.from+(1-fastDrop.from)*(Date.now()-fastDrop.started)/fastDrop.duration):motion.progress;
  const visibleProgress=answerPreview&&!fastDrop?Math.min(progress,.82):progress;
  const y=spawn+(targetY-spawn)*Math.pow(visibleProgress,1.35),x=center+(aimX-150)*scale;
  ctx.save();ctx.globalAlpha=.3;drawPiece({...shape,shape:state.shape,color:(state.correct-1)%6},x,targetY,scale);ctx.restore();
  drawPiece({...shape,shape:state.shape,color:(state.correct-1)%6},x,y,scale);
  const remain=state.mode==='timed'?Math.max(0,state.remaining-Math.max(0,now-state.dropStarted)):Infinity;
  if((progress>=1||remain===0)&&(!busy||answerPreview)&&(!pending||answerPreview)&&!queuedCommand&&landingVersion!==state.version&&Date.now()-lastAutoAttempt>150){landingVersion=state.version;lastAutoAttempt=Date.now();command('place',{x:aimX,quick:Boolean(fastDrop)});}
  $('playerName').classList.toggle('balance-warning',state.instability>.45);
 }
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*160;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(center+(p.x-150)*scale,ground-total*scale+camera+p.y,5,7);}ctx.globalAlpha=1;
 if(state){const rem=state.mode==='timed'?Math.max(0,state.remaining-(state.phase==='placing'?Math.max(0,now-state.dropStarted):0)):Infinity;const label=Number.isFinite(rem)?(rem/1000).toFixed(1)+'s':'高度挑战';if($('time').textContent!==label)$('time').textContent=label;}
 $('toast').classList.toggle('visible',Date.now()<toastUntil||Date.now()<Number($('toast').dataset.voiceUntil||0));if(questionDelay&&Date.now()>=questionDelay){questionDelay=0;render();}if(resultDelay&&Date.now()>=resultDelay){resultDelay=0;render();}
 requestAnimationFrame(draw);
}
async function boot(){try{mathIdentity=await mathBridge('init');mathFrames=await(await fetch('../../assets/unit6/lab-sprites-v2.frames.json')).json();configured=mathIdentity.logged;mathPractice=!mathIdentity.logged;catalog=(await(await fetch('content/catalog.json')).json()).packs;$('bankSelect').replaceChildren(...catalog.map(p=>new Option(p.title,p.id)));await selectBank(catalog[0].id);identity={guest:!mathIdentity.logged,name:mathIdentity.name};$('showLogin').onclick=()=>mathBridge('login');showWorld();requestAnimationFrame(draw);setInterval(refreshBoard,15000);}catch(e){showError(e.message);}}
boot();
