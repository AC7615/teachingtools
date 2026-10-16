const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const T=require('../units/unit6-tower/core.js');
for(const level of ['easy','medium','hard']){
 const pack=require('../units/unit6-tower/content/'+level+'.json');T.setPack(pack);assert.equal(pack.questions.length,{easy:16,medium:10,hard:10}[level]);assert(pack.questions.every(q=>q.scene));
 const s=T.newGame(T.packKey(),'endless',90,0);
 for(let i=0;i<3;i++) {T.act(s,{action:'answer',choice:s.question.key,version:s.version},i*10000+1);if(i===2){assert.equal(s.phase,'powerup');T.act(s,{action:'skill',skill:'stable',version:s.version},i*10000+2);}assert.equal(s.phase,'placing');T.act(s,{action:'place',x:150,quick:true,version:s.version},i*10000+1000);assert.equal(s.phase,'question');}
 assert.equal(s.correct,3);assert(s.stable>0);assert.equal(s.layers.length,3);T.act(s,{action:'answer',choice:s.question.key,version:s.version},40000);T.act(s,{action:'place',x:280,quick:true,version:s.version},41000);assert.equal(s.phase,'ended');assert(s.best>0);
}
const manifest=require('../assets/unit6/audio-teacher/manifest.json');for(const level of ['easy','medium','hard'])for(const q of require('../units/unit6-tower/content/'+level+'.json').questions)assert(manifest.clips[q.text]);
assert.equal(Object.keys(manifest.clips).length,55);
if(manifest.complete)assert.equal(manifest.available.length,55);
for(const filename of manifest.available){
 assert.match(filename,/^cv3-[a-f0-9]+\.wav$/);
 const b=fs.readFileSync(path.join(__dirname,'../assets/unit6/audio-teacher',filename));
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt32LE(4)+8,b.length);
 assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),24000);assert(b.length>7244,'Speech must contain more than 150 ms of audio');
}
assert.equal(Object.keys(T.RULES.shapes).length,7);
console.log('PASS: complete original tower uses all three math packs, three-answer skill reward, seven shapes, highest height, collapse, and matching AI speech manifest.');
