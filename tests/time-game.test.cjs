const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();function element(){return{dataset:{},textContent:'',innerHTML:'',onclick:null,classList:{toggle(){},add(){}},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),querySelector:()=>element()};}
const document={getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll:()=>[]};let timerId=0;const timers=new Map();const context={document,console,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};vm.createContext(context);
const source=fs.readFileSync('units/unit5-detective.js','utf8').replace('return {start,reward,bonusForCount,stats:()=>({bonusStars})};','return {start,reward,bonusForCount,stats:()=>({bonusStars,removed}),moves,snapshot:()=>cells.map(c=>({...c}))};');vm.runInContext(source,context);
let opened=0,completed=0;context.callbacks={theme:'jungle',required:9,goal:24,onComplete:()=>completed++};context.ask=()=>opened++;
function tap(i){elements.get('clueBoard').onclick({detail:0,target:{closest:()=>({dataset:{clue:String(i)}})}});}function snapshot(){return vm.runInContext('DetectiveGame.snapshot()',context);}function flush(){const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn());}
const layouts=new Set();let usedSwaps=0,sawBonus=false;
for(let round=0;round<200;round++){
 vm.runInContext('DetectiveGame.start(ask,callbacks)',context);let board=snapshot();layouts.add(JSON.stringify(board));assert.equal(board.filter(c=>c.locked).length,9);
 for(let t=0;t<6;t++)assert.equal(board.filter(c=>c.type===t).length,4);
 const initial=vm.runInContext('DetectiveGame.moves()',context);assert(initial.swaps.length>=3);assert(initial.pairs.length<=3);
 const before=completed;for(let i=0;i<24;i++)if(board[i].locked){tap(i);vm.runInContext('DetectiveGame.reward()',context);assert.equal(completed,before)}
 for(let step=0;step<30&&completed===before;step++){board=snapshot();const free=board.map((c,i)=>c.empty?-1:i).filter(i=>i>=0),m=vm.runInContext('DetectiveGame.moves()',context),pair=m.swaps[0]||m.pairs[0];if(free.length===1)tap(free[0]);else{assert(pair,'remaining board is solvable');if(m.swaps.length)usedSwaps++;tap(pair[0]);tap(pair[1]);}assert(timers.size,'clear has an animation delay');assert.equal(completed,before);flush();const stats=vm.runInContext('DetectiveGame.stats()',context);if(stats.bonusStars)sawBonus=true;assert.equal(stats.removed,snapshot().filter(c=>c.empty).length,'cleared tiles never respawn');if(stats.removed<24)assert.equal(completed,before);}
 assert.equal(completed,before+1);assert(snapshot().every(c=>c.empty));assert.equal(vm.runInContext('DetectiveGame.stats().removed',context),24);
}
assert(layouts.size>190);assert(usedSwaps>200);assert(sawBonus);assert.equal(opened,1800);
vm.runInContext('DetectiveGame.start(ask,callbacks)',context);let pair=vm.runInContext('DetectiveGame.moves()',context).swaps[0];tap(pair[0]);tap(pair[1]);assert(timers.size);vm.runInContext('DetectiveGame.start(ask,callbacks)',context);assert.equal(timers.size,0);flush();assert(snapshot().every(c=>!c.empty));
assert.equal(vm.runInContext('DetectiveGame.bonusForCount(2)',context),0);assert.equal(vm.runInContext('DetectiveGame.bonusForCount(6)',context),20);
vm.runInContext('DetectiveGame.start(ask,callbacks)',context);const locked=snapshot().findIndex(c=>c.locked),boardElement=elements.get('clueBoard');boardElement.setPointerCapture=()=>{};const down={pointerId:1,target:{closest:()=>({dataset:{clue:String(locked)}})},preventDefault(){}};const beforeOpen=opened;boardElement.onpointerdown(down);assert.equal(opened,beforeOpen,'question must wait until the finger is lifted');boardElement.onpointerup(down);assert.equal(opened,beforeOpen+1);
console.log('PASS: 200 random boards clear all 24 tiles without respawning; distributed clues, swaps, bonuses, animations and reset cancellation.');
