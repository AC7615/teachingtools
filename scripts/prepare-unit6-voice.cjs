const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),C=require('../units/unit6-content.js');
const source=fs.readFileSync(path.join(__dirname,'../units/unit6-measurement.js'),'utf8'),cards=vm.runInNewContext(source.match(/const cards=(\[[\s\S]*?\n\]);/)[1]);
const instruction='You are a helpful assistant. 请用温柔、清晰的小学数学老师语气朗读，普通话标准，语速稍慢，保持自然连贯。数字、数量单位和运算符号要读清楚。题目中的不同条件之间适当停顿，提问前稍作停顿，重点突出问题。避免拖音、夸张表演和过度幼儿化。<|endofprompt|>';
const texts=[...new Set([...cards.map(c=>c.w+'。'+c.s),...C.questions.map(q=>q.text)])];
const cn=n=>{const d='零一二三四五六七八九';return n<10?d[n]:n<20?'十'+(n%10?d[n%10]:''):d[Math.floor(n/10)]+'十'+(n%10?d[n%10]:'')};
const plan=texts.map(text=>{const filename='cv3-'+crypto.createHash('sha256').update(text+instruction).digest('hex').slice(0,14)+'.wav';return {text,instruction,spokenText:text.replace(/\d+/g,n=>cn(Number(n))),filename,output:path.resolve(__dirname,'../assets/unit6/audio-teacher',filename)}});
fs.mkdirSync(path.join(__dirname,'../assets/unit6/audio-teacher'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../assets/unit6/audio-teacher/manifest.json'),JSON.stringify({provider:'local-cosyvoice3',voice:'installed-teacher-instruct',instruction,complete:plan.every(p=>fs.existsSync(p.output)),available:plan.filter(p=>fs.existsSync(p.output)).map(p=>p.filename),clips:Object.fromEntries(plan.map(p=>[p.text,p.filename]))},null,2));
fs.writeFileSync(path.join(__dirname,'unit6-voice-plan.json'),JSON.stringify(plan,null,2));console.log('Prepared '+plan.length+' CosyVoice 3 clips.');
