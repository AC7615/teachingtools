const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();function element(){return{dataset:{},textContent:'',innerHTML:'',onclick:null,classList:{toggle(){},add(){}},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),querySelector:()=>element()};}
const document={getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll:()=>[]};let timerId=0;const timers=new Map();const context={document,console,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};vm.createContext(context);
const source=fs.readFileSync('units/unit5-detective.js','utf8').replace('return {start,reward,bonusForCount,stats:()=>({bonusStars})};','return {start,reward,bonusForCount,stats:()=>({bonusStars}),snapshot:()=>cells.map(c=>({...c}))};');vm.runInContext(source,context);
let opened=0,completed=0,reset=0;context.callbacks={theme:'jungle',required:9,goal:24,onComplete:()=>completed++,onReset:()=>reset++};context.ask=()=>opened++;
function tap(i){elements.get('clueBoard').onclick({detail:0,target:{closest:()=>({dataset:{clue:String(i)}})}});}function snapshot(){return vm.runInContext('DetectiveGame.snapshot()',context);}function flush(){const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn());}
const layouts=new Set();let sawVertical=false;
for(let round=0;round<100;round++){
 vm.runInContext('DetectiveGame.start(ask,callbacks)',context);const board=snapshot();layouts.add(JSON.stringify(board));assert.equal(board.filter(c=>c.locked).length,9);
 for(let i=0;i<24;i++){const c=board[i],p=board[c.partner];assert.equal(p.partner,i);assert.equal(c.type,p.type);assert.equal(Math.abs(Math.floor(i/6)-Math.floor(c.partner/6))+Math.abs(i%6-c.partner%6),1);if(Math.abs(i-c.partner)===6)sawVertical=true;}
 const before=completed;
 for(let i=0;i<24;i++){if(i>board[i].partner)continue;const p=board[i].partner,locked=board[i].locked?i:board[p].locked?p:-1;if(locked>=0){tap(locked);vm.runInContext('DetectiveGame.reward()',context);assert.equal(completed,before);}tap(i);tap(p);assert(timers.size>0,'clear effect delays removal');assert.equal(completed,before);flush();}
 assert.equal(completed,before+1);assert(elements.get('detectiveGame').innerHTML.includes('任务完成！'));
}
assert(layouts.size>95);assert(sawVertical);assert.equal(opened,900);elements.get('caseReset').onclick();assert.equal(reset,1);
vm.runInContext('DetectiveGame.start(ask,callbacks)',context);let board=snapshot();const free=board.findIndex(c=>!c.locked&&!board[c.partner].locked);tap(free);tap(board[free].partner);assert(timers.size);vm.runInContext('DetectiveGame.start(ask,callbacks)',context);assert.equal(timers.size,0);flush();assert(snapshot().every(c=>!c.empty));
assert.equal(vm.runInContext('DetectiveGame.bonusForCount(2)',context),0);assert.equal(vm.runInContext('DetectiveGame.bonusForCount(3)',context),5);assert.equal(vm.runInContext('DetectiveGame.bonusForCount(6)',context),20);assert.equal(vm.runInContext('DetectiveGame.stats().bonusStars',context),0);
console.log('PASS: 100 solvable random boards; clue unlocks, animated clears, completion, reset cancellation and multi-tile bonus rules.');
