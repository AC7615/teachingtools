/* Pointer and keyboard circle drawing for mouse, pen and touch. */
const U8Circle=(()=>{
'use strict';const NS='http://www.w3.org/2000/svg';
function mount(svg,{mode,onCircle,onInvalid}){let drawing=null,keyCircle=null,clearTimer=null;const ink=svg.querySelector('.spot-ink');
function clear(){clearTimeout(clearTimer);ink.replaceChildren()}
function shape(tag,attrs){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));ink.replaceChildren(el);return el}
function circle(c,bad=false){shape('circle',{cx:c.cx,cy:c.cy,r:c.r,fill:'none',stroke:bad?'#d96061':'#2674ce','stroke-width':4,'vector-effect':'non-scaling-stroke'})}
function line(points){shape('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#2674ce','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'})}
function point(e){const matrix=svg.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return{x:Math.max(0,Math.min(800,p.x)),y:Math.max(0,Math.min(500,p.y))}}
function submit(c){if(!c){onInvalid('请画一个围住物品的圈；轻点或短线不会算作圈选。');clearTimer=setTimeout(clear,1100);return}circle(c);if(onCircle(c)===false){circle(c,true);clearTimer=setTimeout(clear,1400)}}
svg.onpointerdown=e=>{if(drawing||e.button!==0)return;e.preventDefault();const p=point(e);if(!p)return;clear();keyCircle=null;drawing={id:e.pointerId,points:[p]};svg.setPointerCapture(e.pointerId)};
svg.onpointermove=e=>{if(!drawing||drawing.id!==e.pointerId)return;e.preventDefault();for(const ev of (e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e])){const p=point(ev);if(p)drawing.points.push(p)}if(mode==='freehand')line(drawing.points);else{const c=U8Spot.dragCircle(drawing.points[0],drawing.points[drawing.points.length-1]);if(c)circle(c);else line(drawing.points)}};
svg.onpointerup=e=>{if(!drawing||drawing.id!==e.pointerId)return;e.preventDefault();const p=point(e);if(p)drawing.points.push(p);const data=drawing;drawing=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);submit(mode==='freehand'?U8Spot.fitStroke(data.points):U8Spot.dragCircle(data.points[0],data.points[data.points.length-1]))};
svg.onpointercancel=e=>{if(drawing?.id===e.pointerId){drawing=null;clear()}};svg.onlostpointercapture=()=>{if(drawing){drawing=null;clear()}};
svg.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter','Escape'].includes(e.key))return;e.preventDefault();if(e.key==='Escape'){keyCircle=null;clear();return}if(!keyCircle){keyCircle={cx:400,cy:250,r:55};circle(keyCircle);if(e.key==='Enter')return}const step=e.shiftKey?25:10;if(e.key==='ArrowLeft')keyCircle.cx-=step;if(e.key==='ArrowRight')keyCircle.cx+=step;if(e.key==='ArrowUp')keyCircle.cy-=step;if(e.key==='ArrowDown')keyCircle.cy+=step;if(e.key==='+'||e.key==='=')keyCircle.r=Math.min(140,keyCircle.r+5);if(e.key==='-')keyCircle.r=Math.max(20,keyCircle.r-5);keyCircle.cx=Math.max(0,Math.min(800,keyCircle.cx));keyCircle.cy=Math.max(0,Math.min(500,keyCircle.cy));circle(keyCircle);if(e.key==='Enter')submit({...keyCircle})};
return()=>{clear();drawing=null;svg.onpointerdown=svg.onpointermove=svg.onpointerup=svg.onpointercancel=svg.onlostpointercapture=svg.onkeydown=null}
}
return{mount};
})();
