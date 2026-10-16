// Visuals use only bounded template parameters, never raw SVG from a question pack.
function questionVisual(v){
 if(!v||!['direction','size','material'].includes(v.family))return '';
 const c=['#ff4674','#ffaf23','#714eff'].includes(v.color)?v.color:'#ff4674';
 const object=(x,y,kind)=>kind===0?`<circle cx="${x}" cy="${y}" r="22" fill="${c}"/>`:kind===2?`<circle cx="${x}" cy="${y-14}" r="13" fill="${c}"/><rect x="${x-13}" y="${y}" width="26" height="28" rx="8" fill="${c}"/>`:`<rect x="${x-20}" y="${y-25}" width="40" height="50" rx="5" fill="${c}"/>`;
 const lamp=(x,y)=>`<circle cx="${x}" cy="${y}" r="20" fill="#ffde3e" stroke="#ffad23" stroke-width="5"/><path d="M${x-28} ${y}h-8 M${x+28} ${y}h8 M${x} ${y-28}v-8 M${x} ${y+28}v8" stroke="#ffad23" stroke-width="4"/>`;
 const label=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#25415f" font-size="17" font-family="sans-serif" font-weight="700">${t}</text>`;
 const screen=(x,y)=>`<rect x="${x}" y="${y-42}" width="12" height="85" rx="3" fill="#5bb9e8"/>${label(x+6,y+65,'屏幕 ?')}`;
 let body='';
 if(v.family==='direction'){
  const x=v.condition===1?340:60;
  body=lamp(x,58)+label(x,105,['手电筒','台灯','太阳'][v.source]||'光源')+`<path d="M${x} 80 L200 155" stroke="#ffcd43" stroke-width="9" stroke-dasharray="10 8"/>`+object(200,150,v.object)+label(70,218,'左边 ?')+label(330,218,'右边 ?')+`<path d="M105 205H165 M235 205H295" stroke="#8cc3ec" stroke-width="4"/>`;
 }else if(v.family==='size'){
  const nearer=v.condition===0;
  body=label(200,25,'光源和屏幕不动')+lamp(45,88)+object(nearer?170:115,88,v.object)+screen(340,88)+label(240,95,'移动前')+lamp(45,190)+object(nearer?115:170,190,v.object)+screen(340,190)+label(240,197,'移动后');
 }else{
  const material=['不透光纸板','半透明描图纸','透明玻璃'][v.condition]||'材料';
  const shape=v.object===0?'<circle cx="200" cy="110" r="35"/>':v.object===2?'<circle cx="182" cy="78" r="14"/><circle cx="218" cy="78" r="14"/><circle cx="200" cy="105" r="30"/><ellipse cx="200" cy="139" rx="27" ry="25"/>':v.object===3?'<path d="M200 65L212 96L245 97L220 119L229 152L200 133L171 152L180 119L155 97L188 96Z"/>':'<rect x="170" y="68" width="60" height="85" rx="5"/>';
  body=lamp(45,110)+label(45,169,['手电筒','台灯','太阳'][v.source]||'光源')+`<path d="M70 110H325" stroke="#ffde3e" stroke-width="12" stroke-dasharray="12 9"/><g fill="${c}" fill-opacity="${[1,.55,.15][v.condition]}" stroke="#6c99b7" stroke-width="3">${shape}</g>`+screen(340,110)+label(200,220,material);
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270"><rect width="400" height="270" rx="24" fill="#eefaff"/>${body}</svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
if(typeof module!=='undefined')module.exports={questionVisual};
