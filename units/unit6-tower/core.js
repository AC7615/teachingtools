const RULES={version:5,streakTarget:3,shapes:{
 wide:{width:64,height:22},square:{width:38,height:38},tall:{width:26,height:58},plank:{width:88,height:14},
 step:{width:62,height:38,cells:[{dx:-16,dy:0,width:30,height:20},{dx:15,dy:0,width:32,height:38}]},
 tee:{width:62,height:40,cells:[{dx:0,dy:0,width:24,height:24},{dx:0,dy:24,width:62,height:16}]},
 ell:{width:58,height:44,cells:[{dx:-17,dy:0,width:24,height:44},{dx:12,dy:0,width:34,height:18}]}
}};
let BANK=[],PACK=null;
function validatePack(pack){
 if(!pack||pack.schemaVersion!==1||!/^[-a-z0-9]{1,40}$/.test(pack.id)||!/^[-a-zA-Z0-9.]{1,30}$/.test(pack.version)||typeof pack.title!=='string'||!Array.isArray(pack.questions)||pack.questions.length<1||pack.questions.length>200)throw Error('题库格式不正确，请检查编号、版本和题目列表。');
 const ids=new Set();
 if(pack.variants&&(!Array.isArray(pack.variants.families)||pack.variants.families.length>3||new Set(pack.variants.families).size!==pack.variants.families.length||pack.variants.families.some(f=>!['direction','size','material'].includes(f))))throw Error('变式题配置不正确。');
 const validImage=x=>!x||typeof x==='string'&&/^assets\/[\w./-]+\.(svg|png|jpg|jpeg|webp)$/.test(x)&&!x.includes('..');
 for(const q of pack.questions){if(!q.id||q.id.startsWith('variant-')||ids.has(q.id)||typeof q.text!=='string'||!Array.isArray(q.options)||q.options.length<2||q.options.length>4||!Number.isInteger(q.answer)||!q.options[q.answer]||typeof q.explanation!=='string'||!validImage(q.image))throw Error('题目 '+(q.id||'?')+' 的格式不正确。');ids.add(q.id);for(const o of q.options)if(typeof o!=='object'||typeof o.text!=='string'||!validImage(o.image))throw Error('题目选项必须包含 text，可选 image。');}
 return pack;
}
function setPack(pack){PACK=validatePack(pack);BANK=[...PACK.questions,...variantQuestions(PACK)];return PACK;}
function variantQuestions(pack){
 if(!pack.variants?.enabled)return [];
 const out=[],objects=['小球','积木','玩偶','纸板'],colors=['#ff4674','#ffaf23','#714eff'],sources=['手电筒','台灯','太阳'];
 for(const family of pack.variants.families||[]){
  if(!['direction','size','material'].includes(family))throw Error('不支持的变式题类型：'+family);
  for(let object=0;object<4;object++)for(let color=0;color<3;color++)for(let source=0;source<3;source++)for(let condition=0;condition<(family==='direction'?2:3);condition++){
   const id='variant-'+family+'-'+[object,color,source,condition].join('-'),visual={family,object,source,color:colors[color],condition};
   const options=(family==='direction'?['左边','右边','光源和物体之间']:family==='size'?['较大','较小','没有影子']:['清晰','模糊','没有明显影子']).map(text=>({text}));
   const text=family==='direction'?sources[source]+'在'+(condition?'右':'左')+'边，'+objects[object]+'的影子会在哪边？':family==='size'?'图中将'+objects[object]+(condition===0?'移近光源':condition===1?'移远光源':'保持原位')+'，屏幕上的影子会怎样？':sources[source]+'照向'+['圆形','方形','小熊形','星形'][object]+'的'+['不透光纸板','半透明描图纸','透明玻璃'][condition]+'，影子会怎样？';
   // The size family uses a fixed screen, a point-like torch/lamp, and two object positions.
   if(family==='size'&&(source===2||condition===2))continue;
   out.push({id,family,standard:family==='material'?'6.1.5':'6.1.4',source:'根据光和暗核心概念生成的图画变式',text,visual,imageAlt:text,options,answer:family==='direction'?(condition?0:1):family==='size'?(condition===0?0:1):condition,explanation:family==='direction'?'影子出现在物体背向光源的一边。':family==='size'?'光源和屏幕保持不动，物体移近光源时影子变大，移远光源时影子变小。':'不透光物体形成清晰影子；半透明材料形成模糊影子；透明材料没有明显影子。'});
  }
 }
 return out;
}
function randomFor(s){if(!Number.isInteger(s.randomState))s.randomState=Math.floor(Math.random()*4294967296);s.randomState=(s.randomState+0x6D2B79F5)>>>0;let t=s.randomState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
function shuffle(a,rng=Math.random){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function newGame(unit,mode,duration,now,seen=[]){
 if(!PACK||unit!==packKey()||!['timed','endless'].includes(mode)||![60,90,120].includes(duration))throw Error('题库已更新，请重新打开游戏。');
 const s={randomState:Math.floor(Math.random()*4294967296),rulesVersion:RULES.version,unit,packTitle:PACK.title,mode,duration,remaining:duration*1000,phase:'question',correct:0,attempts:0,streak:0,streakTarget:RULES.streakTarget,energy:0,layers:[],height:0,best:0,top:{x:150,width:160},instability:0,stable:0,skill:null,shape:'wide',created:now,history:[],recentIds:seen.slice(-128),version:0,deck:[],question:null};nextQuestion(s);return s;
}
function nextQuestion(s){
 if(!s.deck.length)s.deck=shuffle(BANK.map(q=>q.id),()=>randomFor(s));
 const recent=s.recentIds||[],last=s.history.slice(-2).map(q=>q.standard),wrong=s.history.slice(0,-6).filter(q=>!q.correct).at(-1);
 let candidates=s.deck.filter(id=>!recent.includes(id));if(!candidates.length){candidates=s.deck.filter(id=>!recent.slice(-Math.min(12,BANK.length-1)).includes(id));if(!candidates.length)candidates=s.deck.slice();}
 const spaced=candidates.filter(id=>!last.includes(BANK.find(q=>q.id===id).standard));if(spaced.length)candidates=spaced;
 if(wrong&&s.attempts%5===0){const review=candidates.filter(id=>BANK.find(q=>q.id===id).standard===wrong.standard);if(review.length)candidates=review;}
 const id=candidates[Math.floor(randomFor(s)*candidates.length)],q=BANK.find(q=>q.id===id);s.deck.splice(s.deck.indexOf(id),1);
 s.recentIds=[...recent,id].slice(-128);const order=shuffle(q.options.map((_,i)=>i),()=>randomFor(s));s.question={id:q.id,text:q.text,standard:q.standard||'',source:q.source||'',image:q.image||'',visual:q.visual||null,imageAlt:q.imageAlt||'题目配图',options:order.map(i=>q.options[i]),key:order.indexOf(q.answer),explanation:q.explanation};s.phase='question';
}
function view(s,now){const v=JSON.parse(JSON.stringify(s));delete v.deck;delete v.history;delete v.recentIds;if(v.question){delete v.question.key;delete v.question.explanation;}v.serverNow=now;return v;}
function packKey(){return PACK.id+'@'+PACK.version+'~r'+RULES.version;}
function fallDuration(s){return Math.max(950,2800-s.height*3.2-s.layers.length*18);}
function moving(s,now){const elapsed=Math.max(0,now-(s.dropStarted||0)),progress=Math.min(1,elapsed/fallDuration(s)),amplitude=s.stable>0?0:Math.min(23,1+s.height*.014+(s.instability||0)*18),sway=Math.sin(elapsed/1000*(1.6+(s.instability||0)))*amplitude;return{progress,sway,amplitude};}
// Seeded shuffled bags replay identically on client and server. Two starter cubes help build a base.
function nextBlockShape(s){
 if(s.rulesVersion<5)return ['square','square','wide','tall','plank','step','tee','ell'][(s.correct-1)%8];
 if(s.correct<=2)return 'square';
 if(!s.shapeDeck?.length){s.shapeDeck=shuffle(Object.keys(RULES.shapes),()=>randomFor(s));if(s.shapeDeck[0]===s.lastRandomShape)[s.shapeDeck[0],s.shapeDeck[1]]=[s.shapeDeck[1],s.shapeDeck[0]];}
 const shape=s.shapeDeck.shift();s.lastRandomShape=shape;return shape;
}
function cellsOf(b){const shape=RULES.shapes[b.shape];return b.cells||shape?.cells||[{dx:0,dy:0,width:b.width,height:b.height}];}
function merged(intervals){const out=[];for(const [left,right]of intervals.slice().sort((a,b)=>a[0]-b[0])){const prev=out.at(-1);if(prev&&left<=prev[1])prev[1]=Math.max(prev[1],right);else out.push([left,right]);}return out;}
function landingAt(s,x,now){
 const shape=RULES.shapes[s.shape],cells=shape.cells||[{dx:0,dy:0,width:shape.width,height:shape.height}],sway=moving(s,now).sway;
 const supports=[{left:70,right:230,top:0,risk:0,parent:-1}];
 s.layers.forEach((block,i)=>{const shift=sway*(block.bottom+block.height)/Math.max(s.height,1);for(const cell of cellsOf(block))supports.push({left:block.x+cell.dx-cell.width/2+shift,right:block.x+cell.dx+cell.width/2+shift,top:block.bottom+cell.dy+cell.height,risk:block.risk||0,parent:i});});
 const contacts=[];let bottom=-Infinity;
 for(const cell of cells)for(const support of supports){const left=Math.max(x+cell.dx-cell.width/2,support.left),right=Math.min(x+cell.dx+cell.width/2,support.right);if(right-left<.5)continue;const candidate=support.top-cell.dy;if(candidate<0)continue;if(candidate>bottom+.1){bottom=candidate;contacts.length=0;}if(Math.abs(candidate-bottom)<.1)contacts.push({...support,left,right});}
 if(!Number.isFinite(bottom))return {bottom:0,miss:true,risk:1,contacts:[]};
 const spans=merged(contacts.map(c=>[c.left,c.right])),length=spans.reduce((sum,[l,r])=>sum+r-l,0),left=spans[0][0],right=spans.at(-1)[1];
 const mass=cells.reduce((sum,c)=>sum+c.width*c.height,0),center=x+cells.reduce((sum,c)=>sum+c.dx*c.width*c.height,0)/mass;
 const feet=merged(cells.filter(c=>c.dy===0).map(c=>[c.dx-c.width/2,c.dx+c.width/2])),footWidth=feet.reduce((sum,[l,r])=>sum+r-l,0);
 const ratio=Math.min(1,length/Math.max(footWidth,1)),lean=Math.abs(center-(left+right)/2)/Math.max((right-left)/2,1),inherited=Math.max(...contacts.map(c=>c.risk));
 return {bottom,miss:ratio<.25||center<left-5||center>right+5,risk:Math.min(1,inherited*.6+(1-ratio)*.48+lean*.25),contacts,perfect:ratio>.85&&lean<.3};
}
function foundationRisk(s){
 if(!s.layers.length)return 0;
 let mass=0,weighted=0;const foundation=[];
 for(const b of s.layers)for(const c of cellsOf(b)){const m=c.width*c.height;mass+=m;weighted+=(b.x+c.dx)*m;if(b.bottom+c.dy===0)foundation.push([b.x+c.dx-c.width/2,b.x+c.dx+c.width/2]);}
 const spans=merged(foundation);if(!spans.length)return 1;
 const left=spans[0][0],right=spans.at(-1)[1],center=weighted/mass,lean=Math.abs(center-(left+right)/2)/Math.max((right-left)/2,1),local=s.layers.reduce((sum,b)=>sum+(b.risk||0),0)/s.layers.length;
 s.centerOfMass=center;s.foundation={left,right};return Math.min(1,local*.55+lean*.45);
}
function act(s,b,now){
 if(b.version!==s.version)throw Error('画面已更新，请重试。');
 if(s.phase==='ended'){if(b.action==='finish')return;throw Error('挑战已经结束。');}
 if(b.action==='finish'){s.phase='ended';s.reason='主动结束';s.ended=now;}
 else if(b.action==='answer'){
  if(s.phase!=='question'||!Number.isInteger(b.choice)||b.choice<0||b.choice>=s.question.options.length)throw Error('请选择答案。');
  const correct=b.choice===s.question.key;s.attempts++;s.streak=correct?s.streak+1:0;if(correct)s.correct++;
  s.feedback={correct,choice:b.choice,explanation:s.question.explanation,answer:s.question.options[s.question.key].text};s.history.push({id:s.question.id,standard:s.question.standard,text:s.question.text,visual:s.question.visual,image:s.question.image,choice:s.question.options[b.choice].text,answer:s.question.options[s.question.key].text,correct,at:now});s.history=s.history.slice(-80);
  if(correct){s.skill=null;s.shape=nextBlockShape(s);if(s.streak%RULES.streakTarget===0){s.phase='powerup';s.energy=1;delete s.dropStarted;}else{s.phase='placing';s.dropStarted=now+350;}}else s.phase='review';
 }else if(b.action==='continue'){
  if(s.phase!=='review')throw Error('答对后积木会自动落下。');nextQuestion(s);
 }else if(b.action==='skill'){
  if(s.phase!=='powerup'||s.skill||s.energy!==1||!['stable','double','shape','skip'].includes(b.skill))throw Error('目前无法使用这个技能。');
  if(b.skill==='shape'&&!RULES.shapes[b.shape])throw Error('请选择积木形状。');s.energy=0;s.skill=b.skill;if(b.skill==='stable')s.stable=3;if(b.skill==='shape')s.shape=b.shape;s.phase='placing';s.dropStarted=now+350;
 }else if(b.action==='place'){
  if(s.phase!=='placing'||!Number.isFinite(b.x)||b.x<20||b.x>280)throw Error('积木位置无效。');
  const automatic=fallDuration(s),elapsed=b.quick===true?Math.max(120,Math.min(automatic,now-s.dropStarted)):automatic,landing=s.dropStarted+elapsed;
  if(!b.quick&&now<landing-500&&!(s.mode==='timed'&&s.remaining<elapsed&&now>=s.dropStarted+s.remaining))throw Error('积木还没有落到塔顶。');
  if(s.mode==='timed'&&s.remaining<=elapsed){s.remaining=0;s.phase='ended';s.reason='建塔时间用完';s.ended=now;}
  else{
   if(s.mode==='timed')s.remaining-=elapsed;
   const shape=RULES.shapes[s.shape],support=landingAt(s,b.x,landing);
   if(support.miss){s.phase='ended';s.reason='积木没接稳，塔倒了！';s.ended=now;s.failedBlock={x:b.x,width:shape.width,height:shape.height,shape:s.shape,bottom:support.bottom};}
   else{
    const previousHeight=s.height;const count=s.skill==='double'?2:1;for(let i=0;i<count;i++)s.layers.push({x:b.x,width:shape.width,height:shape.height,shape:s.shape,bottom:support.bottom+i*shape.height,risk:support.risk,perfect:support.perfect,color:(s.correct+i-1)%6});
    s.height=Math.max(s.height,support.bottom+count*shape.height);s.top={x:b.x,width:shape.width};s.best=Math.max(s.best,s.height);s.instability=foundationRisk(s);
    s.lastPlacement={perfect:support.perfect,count,bottom:support.bottom,sideBySide:support.bottom+shape.height<=previousHeight,risk:support.risk};
    if(s.height>90&&s.stable===0&&s.centerOfMass&&(s.centerOfMass<s.foundation.left-4||s.centerOfMass>s.foundation.right+4)){s.phase='ended';s.reason='地基支撑不稳，塔失去平衡！';s.ended=now;s.failedBlock={placed:true,x:b.x,width:shape.width,height:shape.height,shape:s.shape,bottom:support.bottom};}
    else nextQuestion(s);if(s.stable>0)s.stable--;
   }
  }
 }else throw Error('未知操作。');
 s.version++;
}
// A visual preview only. The authenticated server still validates and saves the answer.
function previewAnswer(current,choice,now){
 const q=BANK.find(q=>q.id===current.question?.id);if(!q)return null;
 const s=JSON.parse(JSON.stringify(current));s.history=[];
 s.question.key=s.question.options.findIndex(o=>o.text===q.options[q.answer].text&&o.image===q.options[q.answer].image);
 if(s.question.key<0)return null;s.question.explanation=q.explanation;
 act(s,{action:'answer',choice,version:s.version},now);return view(s,now);
}
if(typeof module!=='undefined')module.exports={RULES,validatePack,setPack,packKey,newGame,view,moving,fallDuration,cellsOf,landingAt,foundationRisk,act,previewAnswer};
else Object.assign(globalThis,{RULES,validatePack,setPack,packKey,newGame,view,moving,fallDuration,cellsOf,landingAt,foundationRisk,act,previewAnswer});
