const groups=['全部','长短','高矮','厚薄','远近','轻重','满与空'];
const cards=[
{g:1,x:0,y:0,q:'上面的铅笔怎么样？',w:'长',s:'上面的铅笔长，下面的铅笔短。',alt:'两支左端对齐的铅笔，上面的长，下面的短。'},
{g:1,x:0,y:0,q:'下面的铅笔怎么样？',w:'短',s:'下面的铅笔比上面的铅笔短。'},
{g:2,x:1,y:0,q:'左边的长颈鹿怎么样？',w:'高',s:'左边的长颈鹿高，右边的长颈鹿矮。',alt:'站在同一地面上的两只长颈鹿，左边高，右边矮。'},
{g:2,x:1,y:0,q:'右边的长颈鹿怎么样？',w:'矮',s:'右边的长颈鹿比左边的长颈鹿矮。'},
{g:3,x:0,y:1,q:'左边的书怎么样？',w:'厚',s:'左边的书厚，右边的书薄。',alt:'两本并排的书，左边书页厚，右边书页薄。'},
{g:3,x:0,y:1,q:'右边的书怎么样？',w:'薄',s:'右边的书比左边的书薄。'},
{g:4,x:1,y:1,q:'上方的小兔离学校怎么样？',w:'近',s:'上方的小兔离学校近。',alt:'学校旁边有一只小兔，远处的路上还有一只小兔。'},
{g:4,x:1,y:1,q:'下方的小兔离学校怎么样？',w:'远',s:'下方的小兔离学校远。'},
{g:5,x:0,y:2,q:'石头和羽毛比，怎么样？',w:'重',s:'石头比羽毛重，天平的石头一边下降。',alt:'天平左边的石头较重，托盘下降；右边羽毛较轻，托盘上升。'},
{g:5,x:0,y:2,q:'羽毛和石头比，怎么样？',w:'轻',s:'羽毛比石头轻，天平的羽毛一边上升。'},
{g:6,x:1,y:2,q:'左边的杯子怎么样？',w:'满',s:'左边的杯子装满了果汁。',alt:'三个相同的透明杯子，左边满，中间半满，右边空。'},
{g:6,x:1,y:2,q:'中间的杯子怎么样？',w:'半满',s:'中间的杯子是半满的，果汁装了一半。'},
{g:6,x:1,y:2,q:'右边的杯子怎么样？',w:'空',s:'右边的杯子是空的，里面没有果汁。'}
];
const tips=['先看清题目指的是哪一个，再说：“……比……长 / 高 / 厚 / 近 / 重。”','比较长短时，先把铅笔的一端对齐。','比较高矮时，要站在同一个地面上。','看书页叠起来的厚度，分清“厚”和“薄”。','以学校为同一个参照：说清楚“小兔离学校近 / 远”。','看天平：较重的一边下降，较轻的一边上升。','这三个杯子大小相同：装满、装一半、没有果汁。'];
let active=0,list=cards.map((_,i)=>i),pos=0,flipped=false,known=new Set();
try{known=new Set(JSON.parse(localStorage.getItem('unit6-known')||'[]').filter(i=>Number.isInteger(i)&&i>=0&&i<cards.length))}catch{}
const $=id=>document.getElementById(id);
groups.forEach((g,i)=>{let b=document.createElement('button');b.textContent=g;b.onclick=()=>{active=i;list=cards.map((_,j)=>j).filter(j=>!i||cards[j].g===i);pos=0;flipped=false;render()};$('filters').append(b)});
function render(){let c=cards[list[pos]];[...$('filters').children].forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',i===active)});$('category').textContent=groups[c.g]+' · 看图说词';$('counter').textContent=`${pos+1} / ${list.length}`;$('art').style.backgroundPosition=`${c.x*100}% ${c.y*50}%`;$('art').setAttribute('aria-label',flipped?(c.alt||cards.find(a=>a.g===c.g).alt):['','两支长短不同的铅笔','两只高矮不同的长颈鹿','两本厚薄不同的书','学校与路上的两只小兔','放着石头和羽毛的天平','装有不同份量果汁的三个杯子'][c.g]);$('question').textContent=c.q;$('word').textContent=c.w;$('sentence').textContent=c.s;$('answer').hidden=!flipped;$('flashcard').classList.toggle('revealed',flipped);$('flashcard').setAttribute('aria-label',flipped?'收起答案':'翻卡查看答案');$('stage').textContent=flipped?'你说对了吗？':'看图说一说';$('hint').textContent=flipped?'再点一下，收起答案':'轻点卡片，揭晓答案 ↗';$('flip').textContent=flipped?'收起答案':'翻卡看答案';$('learned').textContent=`已会说 ${known.size} / ${cards.length} 个词`;$('know').textContent=known.has(list[pos])?'★ 已经会说':'☆ 我会说了';$('tip').textContent=tips[c.g];$('dots').replaceChildren();list.forEach((id,i)=>{let b=document.createElement('button');b.className=(i===pos?'current ':'')+(known.has(id)?'done':'');b.setAttribute('aria-label',`第${i+1}张`);b.onclick=()=>{pos=i;flipped=false;render()};$('dots').append(b)})}
function flip(){flipped=!flipped;render()}function move(n){pos=(pos+n+list.length)%list.length;flipped=false;if('speechSynthesis'in window)speechSynthesis.cancel();render()}
$('flashcard').onclick=flip;$('flip').onclick=flip;$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);
$('shuffle').onclick=()=>{for(let i=list.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}pos=0;flipped=false;render();toast('顺序打乱啦！来试试看。')};
$('know').onclick=()=>{let id=list[pos];known.has(id)?known.delete(id):known.add(id);try{localStorage.setItem('unit6-known',JSON.stringify([...known]))}catch{}render();if(known.size===cards.length)toast('太棒啦！13个词，你都会说了！')};
$('reset').onclick=()=>{known.clear();try{localStorage.removeItem('unit6-known')}catch{}pos=0;flipped=false;render();toast('开始新一轮练习吧！')};
let toastTimer;function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000)}
$('speak').onclick=()=>{if(!('speechSynthesis'in window)){toast('这个浏览器暂不支持朗读，请和老师一起读。');return}if(!flipped){flipped=true;render()}speechSynthesis.cancel();let c=cards[list[pos]],u=new SpeechSynthesisUtterance(c.w+'。'+c.s);u.lang='zh-CN';u.rate=.75;const voice=speechSynthesis.getVoices().find(v=>/^zh[-_](CN|SG)/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^zh/i.test(v.lang));if(voice)u.voice=voice;u.onerror=()=>toast('朗读暂不可用，请和老师一起读。');speechSynthesis.speak(u)};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('可以使用浏览器的全屏功能。')}};
document.addEventListener('keydown',e=>{if(['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();flip()}if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});render();
