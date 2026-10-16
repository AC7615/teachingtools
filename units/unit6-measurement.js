const groups=['全部','长短','高矮','厚薄','远近','轻重','满与空','测量方法'];
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
{g:6,x:1,y:2,q:'右边的杯子怎么样？',w:'空',s:'右边的杯子是空的，里面没有果汁。'},
{g:7,diagram:'length',q:'用回形针量长度，要怎样摆？',w:'首尾相接',s:'用相同大小的单位，一个接一个，不留空隙、不重叠。',alt:'四枚回形针首尾相接，排列在铅笔下方。'},
{g:7,diagram:'mass',q:'什么时候可以读出物品的质量？',w:'天平平衡',s:'天平平衡时，两边一样重，数出测量单位的数量。',alt:'平衡的天平，左边一块橡皮，右边四块相同积木。'},
{g:7,diagram:'volume',q:'量一壶水，每次倒的杯子要怎样？',w:'大小相同',s:'用同样的杯子，每次装满，数出一共有多少杯。',alt:'一壶水和四个装满的相同杯子。'},
{g:7,diagram:'units',q:'小杯换成大杯，同一壶水的杯数怎样？',w:'杯数较少',s:'同一壶水，每个单位越大，所需的个数越少。',alt:'相同一壶水等于四小杯，或两大杯。'},
{g:7,diagram:'length',q:'比较测量结果时，要使用什么单位？',w:'相同单位',s:'用同样大小的回形针，才可以直接比较数量。',alt:'相同大小的回形针排列在铅笔下方。'},
{g:7,diagram:'mass',q:'测量后，应该怎样说出结果？',w:'数量和单位',s:'例如：橡皮大约有4块相同积木重。',alt:'一块橡皮与四块相同积木平衡。'}
];
const tips=['先看清题目指的是哪一个，再说：“……比……长 / 高 / 厚 / 近 / 重。”','比较长短时，先把铅笔的一端对齐。','比较高矮时，要站在同一个地面上。','看书页叠起来的厚度，分清“厚”和“薄”。','以学校为同一个参照：说清楚“小兔离学校近 / 远”。','看天平：较重的一边下降，较轻的一边上升。','这三个杯子大小相同：装满、装一半、没有果汁。'];
let active=0,list=cards.map((_,i)=>i),pos=0,flipped=false,known=new Set();
try{known=new Set(JSON.parse(localStorage.getItem('unit6-known')||'[]').filter(i=>Number.isInteger(i)&&i>=0&&i<cards.length))}catch{}
const $=id=>document.getElementById(id);
groups.forEach((g,i)=>{let b=document.createElement('button');b.textContent=g;b.onclick=()=>{active=i;list=cards.map((_,j)=>j).filter(j=>!i||cards[j].g===i);pos=0;flipped=false;render()};$('filters').append(b)});
function render(){let c=cards[list[pos]];[...$('filters').children].forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',i===active)});$('category').textContent=groups[c.g]+' · 看图说词';$('counter').textContent=`${pos+1} / ${list.length}`;$('art').innerHTML='';$('art').style.backgroundImage=c.diagram?'url("../assets/unit6/methods-atlas.png")':'';$('art').style.backgroundSize=c.diagram?'200% 200%':'200% 300%';$('art').style.backgroundPosition=c.diagram?({length:'0% 0%',mass:'100% 0%',volume:'0% 100%',units:'100% 100%'}[c.diagram]):`${c.x*100}% ${c.y*50}%`;$('art').setAttribute('aria-label',flipped?(c.alt||cards.find(a=>a.g===c.g).alt):['','两支长短不同的铅笔','两只高矮不同的长颈鹿','两本厚薄不同的书','学校与路上的两只小兔','放着石头和羽毛的天平','装有不同份量果汁的三个杯子','测量方法示意图'][c.g]);$('question').textContent=c.q;$('word').textContent=c.w;$('sentence').textContent=c.s;$('answer').hidden=!flipped;$('flashcard').classList.toggle('revealed',flipped);$('flashcard').setAttribute('aria-label',flipped?'收起答案':'翻卡查看答案');$('stage').textContent=flipped?'你说对了吗？':'看图说一说';$('hint').textContent=flipped?'再点一下，收起答案':'轻点卡片，揭晓答案 ↗';$('flip').textContent=flipped?'收起答案':'翻卡看答案';$('learned').textContent=`已会说 ${known.size} / ${cards.length} 个词`;$('know').textContent=known.has(list[pos])?'★ 已经会说':'☆ 我会说了';$('tip').textContent=tips[c.g]||'先用相同的单位实际量一量，再说出数量和单位。';$('dots').replaceChildren();list.forEach((id,i)=>{let b=document.createElement('button');b.className=(i===pos?'current ':'')+(known.has(id)?'done':'');b.setAttribute('aria-label',`第${i+1}张`);b.onclick=()=>{pos=i;flipped=false;render()};$('dots').append(b)})}
function flip(){flipped=!flipped;render()}function move(n){pos=(pos+n+list.length)%list.length;flipped=false;if('speechSynthesis'in window)speechSynthesis.cancel();render()}
$('flashcard').onclick=flip;$('flip').onclick=flip;$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);
$('shuffle').onclick=()=>{for(let i=list.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}pos=0;flipped=false;render();toast('顺序打乱啦！来试试看。')};
$('know').onclick=()=>{let id=list[pos];known.has(id)?known.delete(id):known.add(id);try{localStorage.setItem('unit6-known',JSON.stringify([...known]))}catch{}render();if(known.size===cards.length)toast('太棒啦！这些词语和测量方法，你都会说了！')};
$('reset').onclick=()=>{known.clear();try{localStorage.removeItem('unit6-known')}catch{}pos=0;flipped=false;render();toast('开始新一轮练习吧！')};
let toastTimer;function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000)}
$('speak').onclick=()=>{if(!('speechSynthesis'in window)){toast('这个浏览器暂不支持朗读，请和老师一起读。');return}if(!flipped){flipped=true;render()}speechSynthesis.cancel();let c=cards[list[pos]],u=new SpeechSynthesisUtterance(c.w+'。'+c.s);u.lang='zh-CN';u.rate=.75;const voice=speechSynthesis.getVoices().find(v=>/^zh[-_](CN|SG)/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^zh/i.test(v.lang));if(voice)u.voice=voice;u.onerror=()=>toast('朗读暂不可用，请和老师一起读。');speechSynthesis.speak(u)};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('可以使用浏览器的全屏功能。')}};
document.addEventListener('keydown',e=>{if(!document.getElementById('flash').classList.contains('active'))return;if(['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();flip()}if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});render();
