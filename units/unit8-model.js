/* Data, symbols and question generation are independent of the drawing engines. */
const U8=(()=>{'use strict';
 const themes={
  fruit:{title:'同学们喜欢的水果',unit:'人',names:['红毛丹','芒果','木瓜','香蕉'],symbol:'heart',label:'爱心',page:79},
  book:{title:'同学们借阅的图书',unit:'本',names:['科普读物','童话','漫画'],symbol:'book',label:'图书',page:78},
  vote:{title:'一红班班长的票选结果',unit:'票',names:['家仪','金恩','育德','文希'],symbol:'vote',label:'选票',page:81},
  food:{title:'同学们喜欢吃的食物',unit:'人',names:['炒面','炒饭','椰浆饭','汤米粉'],symbol:'person',label:'小人',page:83},
  basket:{title:'篮子里的水果',unit:'个',names:['苹果','香蕉','橙'],symbol:'apple',label:'水果图',page:76}
 };
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 function tally(n,style='zheng'){const paths=style==='strokes'?['M8 7V35','M16 7V35','M24 7V35','M32 7V35','M3 31L37 12']:['M7 7H33','M20 7V35','M20 20H31','M8 20V35','M5 35H35'];let out='';for(let left=n;left>0;left-=5){out+=`<svg viewBox="0 0 42 42" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${paths.slice(0,Math.min(left,5)).map(d=>`<path d="${d}"/>`).join('')}</g></svg>`}return `<span class="tally">${out||'<span class="zero">0</span>'}</span>`}
 function icon(kind,cls=''){const paths={
  heart:'<path d="M20 35C-8 18 4-1 20 11C36-1 48 18 20 35" fill="#f387a9" stroke="#d35482" stroke-width="2"/>',
  book:'<path d="M9 4H32V36H9Q4 35 4 31V9Q4 4 9 4" fill="#b5a0d9" stroke="#8065aa" stroke-width="2"/><path d="M9 5V29H32M9 30Q5 30 6 34H32" fill="none" stroke="#8065aa" stroke-width="2"/><rect x="12" y="9" width="16" height="8" rx="1" fill="white"/>',
  vote:'<rect x="3" y="7" width="34" height="27" rx="3" fill="white" stroke="#a4a9a9" stroke-width="2"/><path d="M20 9L23 17H31L25 22L27 30L20 25L13 30L15 22L9 17H17Z" fill="#ffc762" stroke="#da8a43" stroke-width="1.5"/>',
  person:'<circle cx="20" cy="8" r="6" fill="#cc6c94"/><path d="M6 15Q20 27 34 15M20 19V28M20 27L12 37M20 27L28 37" stroke="#cc6c94" stroke-width="6" fill="none" stroke-linecap="round"/>',
  apple:'<path d="M20 13C3 2-3 30 11 36Q20 32 29 36C43 30 37 2 20 13" fill="#ef806a" stroke="#c25c4c" stroke-width="2"/><path d="M20 12V4Q31 0 29 7Q25 11 20 8" fill="#7baf69" stroke="#659253" stroke-width="2"/>',
  fish:'<path d="M9 20L1 11V29Z" fill="#ea9b57"/><ellipse cx="24" cy="20" rx="15" ry="11" fill="#f6b96c"/><circle cx="31" cy="17" r="2.5" fill="#334a4e"/>'
 };return `<svg class="symbol ${cls}" viewBox="0 0 40 42" aria-hidden="true">${paths[kind]||paths.book}</svg>`}
 function chart(d){const t=themes[d.theme],symbol=d.symbol||t.symbol,vertical=d.orientation==='vertical';return `<figure class="chart ${vertical?'vchart':''}" aria-label="${esc(t.title)}，${vertical?'竖式':'横式'}象形统计图"><h3>${esc(d.title||t.title)}</h3><div class="chart-grid" style="--cats:${t.names.length}">${d.counts.map((n,i)=>`<div class="chart-category"><span class="chart-label">${esc(t.names[i])}</span><div class="symbols" role="img" aria-label="${esc(t.names[i])}：${n}个图，${n*d.value}${esc(t.unit)}">${Array.from({length:n},()=>icon(symbol)).join('')||'<span class="zero">0</span>'}</div></div>`).join('')}</div><figcaption>${icon(symbol)} 代表 <b>${d.value}</b> ${esc(t.unit)}</figcaption></figure>`}
 const crop=(page,box,alt)=>`<figure class="textbook"><svg viewBox="${box.join(' ')}" role="img" aria-label="${esc(alt)}"><image href="/assets/unit8/textbook-p${page}.webp" width="863" height="1153"/></svg><figcaption>课本第二册 · 第${page}页</figcaption></figure>`;
 const shelf=()=>crop(76,[25,228,812,335],'课本中的图书：科普读物、童话和漫画');
 const table=()=>crop(80,[144,185,444,336],'投篮记数表：汉文6次，友华8次，洁玲3次');
 const fruitChart=()=>crop(79,[150,64,560,597],'本地水果象形统计图：红毛丹4个爱心，芒果5个，木瓜2个，香蕉4个；每个爱心代表2人');
 const books=()=>crop(78,[145,278,564,400],'借阅图书象形统计图：科普读物5本，童话6本，漫画3本');
 const cards=[
  ['数据','shù jù','图书的种类和数量，都是我们收集到的数据。',shelf],
  ['收集','shōu jí','看一看同学借了哪些图书，把资料记录下来。',shelf],
  ['分类','fēn lèi','按种类，把图书分成科普读物、童话和漫画。',shelf],
  ['整理','zhěng lǐ','分好类，数好数量，再用统计表展示。',()=>crop(77,[350,80,462,301],'整理好的借阅图书统计表，使用四竖一斜记数')],
  ['记数符号','jì shù fú hào','两种方法都是一笔记1个，每5笔组成一组。',()=>`<div class="tally-pair"><div><h3>“正”字记数</h3>${tally(7)}<p>5＋2＝7</p></div><div><h3>四竖一斜</h3>${tally(7,'strokes')}<p>5＋2＝7</p></div></div>`],
  ['统计表','tǒng jì biǎo','用表格记录每个人投进篮的次数。',table],
  ['象形统计图','xiàng xíng tǒng jì tú','用图片或符号表示数量，这幅图用一本书的图片代表1本书。',books],
  ['代表','dài biǎo','这里一个爱心代表2人。4个爱心代表8人。',fruitChart],
  ['横式','héng shì','同一类的图片横着排，一行表示一类。',books],
  ['竖式','shù shì','同一类的图片竖着排，一列表示一类。',fruitChart],
  ['最多','zuì duō','芒果有5个爱心，代表10人，喜欢芒果的人最多。',fruitChart],
  ['最少','zuì shǎo','木瓜有2个爱心，代表4人，喜欢木瓜的人最少。',fruitChart],
  ['同样多／相同','tóng yàng duō / xiāng tóng','红毛丹和香蕉都是4个爱心，代表的人数同样多。',fruitChart],
  ['一共／共有／总数','yí gòng / gòng yǒu / zǒng shù','把三类图书加起来：5＋6＋3＝14，一共借出14本书。',books],
  ['相差／多多少／少多少','xiāng chà / duō duō shǎo / shǎo duō shǎo','友华投进8次，汉文投进6次。8－6＝2，两人相差2次。',table],
  ['增加','zēng jiā','增加就是数量变多。课本让我们想一想：多2人喜欢炒面后会怎样？',()=>crop(83,[138,158,586,529],'喜欢食物的统计图：炒面3人、炒饭5人、椰浆饭4人、汤米粉2人')],
  ['减少','jiǎn shǎo','减少就是数量变少。如果借出的6本童话归还2本，还借出4本。',books],
  ['各／每','gè / měi','“各有多少”要分别点算；“每个图代表多少”要先看图例。',books],
  ['受访','shòu fǎng','受访的同学，就是回答调查问题的同学。每人只选一种最喜欢的水果。',fruitChart]
 ];
 function makeQuestion(kind,seed=0){const keys=['book','fruit','food','vote'],theme=keys[seed%4],t=themes[theme],base=1+seed%3,counts=t.names.map((_,i)=>base+(i===0?2:i===1?0:1));if(counts.length===4)counts[3]=base+1;if(kind==='same'){counts[2]=counts[0];if(counts.length===4)counts[3]=base+1}const value=kind==='legend'?5:kind==='scaled'?2:1,d={theme,counts,value,orientation:seed%2?'vertical':'horizontal'},v=counts.map(n=>n*value),sum=v.reduce((a,b)=>a+b,0);let text,answer,options,explanation,art=chart(d);
  const numeric=n=>{answer=String(n);options=shuffle([...new Set([n,Math.max(0,n-1),n+1,n+2])]).map(String)};
  if(kind==='sort'){text='整理图书时，怎样分类才正确？';answer='同一种类放在一起';options=[answer,'随意混在一起','只记录喜欢的图书'];explanation='用同一个标准分类，再点算每一类。';art=shelf()}
  else if(kind==='tally'){const n=6+seed%5,style=seed%2?'strokes':'zheng';text='这些记数符号表示多少个？';numeric(n);explanation=`每5笔是一组，5＋${n-5}＝${n}。`;art=`<div class="question-tally"><h3>${style==='zheng'?'“正”字记数':'四竖一斜'}</h3>${tally(n,style)}</div>`}
  else if(kind==='max'||kind==='min'){const isMax=kind==='max',num=isMax?Math.max(...v):Math.min(...v);text=`哪一类的数量${isMax?'最多':'最少'}？`;answer=t.names[v.indexOf(num)];options=[...t.names];explanation=`${answer}有${num}${t.unit}，数量${isMax?'最多':'最少'}。`}
  else if(kind==='same'){text='哪两类的数量相同？';answer=t.names[0]+'和'+t.names[2];options=[answer,t.names[0]+'和'+t.names[1],t.names[1]+'和'+t.names[2]];explanation=`${t.names[0]}和${t.names[2]}都是${v[0]}${t.unit}。`}
  else if(kind==='total'){text=`一共有多少${t.unit}？`;numeric(sum);explanation=v.join('＋')+'＝'+sum+`（${t.unit}）。`}
  else if(kind==='difference'||kind==='missing'){text=kind==='difference'?`${t.names[0]}比${t.names[1]}多多少${t.unit}？`:`要让${t.names[1]}和${t.names[0]}同样多，还要增加多少${t.unit}？`;numeric(v[0]-v[1]);explanation=`${v[0]}－${v[1]}＝${v[0]-v[1]}（${t.unit}）。`}
  else if(kind==='two'){text=`${t.names[0]}和${t.names[2]}合起来有多少${t.unit}？`;numeric(v[0]+v[2]);explanation=`只加指定的两类：${v[0]}＋${v[2]}＝${v[0]+v[2]}。`}
  else if(kind==='change'||kind==='decrease'){const more=kind==='change',delta=more?2:1;text=`${t.names[1]}${more?'增加2':'减少1'}${t.unit}，现在有多少${t.unit}？`;numeric(v[1]+(more?delta:-delta));explanation=`${v[1]}${more?'＋':'－'}${delta}＝${answer}（${t.unit}）。`}
  else if(kind==='legend'){text='这幅图中，一个图标代表多少？';answer='5'+t.unit;options=['1'+t.unit,'2'+t.unit,answer];explanation=`先看图例，一个${t.label}代表5${t.unit}。`}
  else {text=`${t.names[0]}有多少${t.unit}？`;numeric(v[0]);explanation=`每个${t.label}代表${value}${t.unit}，${counts[0]}个图：${Array(counts[0]).fill(value).join('＋')}＝${v[0]}。`}
  return {kind,text,answer,options:shuffle(options),explanation,art,data:d};
 }
 const kinds={easy:['sort','tally','read','max','min','same','read','tally'],medium:['read','total','difference','two','same','total','difference','decrease'],hard:['legend','scaled','change','missing','total','difference','scaled','decrease']};
 function createSort(counts=[4,5,3]){let id=0;return {items:shuffle(counts.flatMap((n,type)=>Array.from({length:n},()=>({id:id++,type,done:false})))),counts:[0,0,0],marks:[0,0,0],mode:'auto',style:'zheng'}}
 function drop(s,id,type){const f=s.items.find(x=>x.id===id);if(!f||f.done)return false;if(f.type!==type)return false;f.done=true;s.counts[type]++;if(s.mode==='auto')s.marks[type]=s.counts[type];return true}
 function marksCorrect(s){return s.counts.every((n,i)=>n===s.marks[i])}
 function validateWorkshop(w){if(w.values.some(n=>n%w.value!==0))return {valid:false,correct:false,message:'这组数据不能全部用完整图表示，请换一个图例。'};const wrong=w.values.map((n,i)=>w.placed[i]*w.value!==n?i:-1).filter(i=>i>=0);return{valid:true,correct:wrong.length===0,wrong}}
 return {themes,esc,shuffle,tally,icon,chart,crop,cards,makeQuestion,kinds,createSort,drop,marksCorrect,validateWorkshop};
})();
if(typeof module!=='undefined')module.exports=U8;
