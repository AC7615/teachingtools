const assert=require('node:assert/strict'),M=require('../units/unit8-model.js');
let checked=0;
for(const kind of ['sort','tally','read','max','min','same','total','difference','two','change','decrease','missing','legend','scaled'])for(let seed=0;seed<120;seed++){
 const q=M.makeQuestion(kind,seed),t=M.themes[q.data.theme],v=q.data.counts.map(n=>n*q.data.value);
 assert.equal(q.options.filter(x=>x===q.answer).length,1);assert.equal(new Set(q.options).size,q.options.length);
 const expected={total:v.reduce((a,b)=>a+b,0),difference:v[0]-v[1],missing:v[0]-v[1],two:v[0]+v[2],change:v[1]+2,decrease:v[1]-1,read:v[0],scaled:v[0],tally:6+seed%5};
 if(kind in expected)assert.equal(+q.answer,expected[kind]);
 if(kind==='max'||kind==='min')assert.equal(q.answer,t.names[kind==='max'?0:1]);
 if(kind==='same')assert.equal(v[0],v[2]);if(kind==='legend')assert.equal(q.answer,'5'+t.unit);
 checked++;
}
for(const style of ['zheng','strokes'])for(let n=0;n<=15;n++){const html=M.tally(n,style);assert.equal((html.match(/<path /g)||[]).length,n);assert.equal((html.match(/<svg /g)||[]).length,Math.ceil(n/5))}
const s=M.createSort([2,1,1]),f=s.items.find(x=>x.type===0);assert(!M.drop(s,f.id,1));assert.equal(s.counts[0],0);assert(M.drop(s,f.id,0));assert.equal(s.marks[0],1);assert(!M.drop(s,f.id,0));s.mode='manual';const next=s.items.find(x=>x.type===0&&!x.done);assert(M.drop(s,next.id,0));assert.equal(s.marks[0],1);assert(!M.marksCorrect(s));s.marks[0]++;assert(M.marksCorrect(s));
assert(M.validateWorkshop({values:[5,6,3],placed:[5,6,3],value:1}).correct);assert(!M.validateWorkshop({values:[5,6,3],placed:[5,5,3],value:1}).correct);assert(!M.validateWorkshop({values:[5,6,3],placed:[0,0,0],value:2}).valid);assert(M.validateWorkshop({values:[8,10,4,8],placed:[4,5,2,4],value:2}).correct);
assert(!M.cards.some(c=>c[0]==='标题'||c[0]==='图例'));assert.equal(M.cards.length,19);assert(new Set(Object.values(M.themes).map(t=>t.symbol)).size>=4);
console.log('PASS:',checked,'questions; both tally methods; correct/wrong/repeated drops; manual marks; workshop validation; textbook vocabulary and varied pictograms.');
