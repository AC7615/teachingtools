const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('units/unit8-data.js','utf8');
const start=source.indexOf('const themes='),end=source.indexOf('function speak('),qstart=source.indexOf('function makeQuestion('),qend=source.indexOf('let level=');
const ctx={};vm.createContext(ctx);vm.runInContext(source.slice(start,end)+source.slice(qstart,qend)+';this.make=makeQuestion;this.themes=themes;',ctx);
const names={max:0,min:1,read:0,scaled:0};let checked=0;
for(const kind of ['sort','tally','read','max','min','same','total','difference','two','change','missing','legend','scaled'])for(let seed=0;seed<100;seed++){
 const q=ctx.make(kind,seed),t=ctx.themes[q.data.theme],v=Array.from(q.data.counts,n=>n*q.data.value);
 assert.equal(q.options.filter(x=>x===q.answer).length,1);assert.equal(new Set(q.options).size,q.options.length);
 if(kind==='total')assert.equal(+q.answer,v.reduce((a,b)=>a+b));
 if(kind==='difference'||kind==='missing')assert.equal(+q.answer,v[0]-v[1]);
 if(kind==='two')assert.equal(+q.answer,v[0]+v[2]);
 if(kind==='change')assert.equal(+q.answer,v[1]+2);
 if(kind==='read'||kind==='scaled')assert.equal(+q.answer,v[0]);
 if(kind==='max'||kind==='min')assert.equal(q.answer,t.names[names[kind]]);
 if(kind==='same')assert.equal(v[0],v[2]);
 if(kind==='tally')assert.equal(+q.answer,6+seed%4);
 if(kind==='legend')assert.equal(q.answer,'5'+t.unit);
 checked++;
}
console.log('PASS:',checked,'generated questions: unique correct options, extrema, ties, sums, differences, changed data and scaled legends.');
