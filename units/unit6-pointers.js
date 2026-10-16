function Unit6Pointers(c){
 let side='left',p=50;
 if(c.g===1)p=c.w==='长'?40:60;
 if(c.g===2){side=c.w==='高'?'left':'right';p=c.w==='高'?38:65;}
 if(c.g===3){side=c.w==='厚'?'left':'right';p=c.w==='厚'?55:66;}
 if(c.g===4){side=c.w==='近'?'right':'left';p=c.w==='近'?39:70;}
 if(c.g===5){side=c.w==='重'?'left':'right';p=c.w==='重'?65:47;}
 if(c.g===6){side='top';p=10+80*({满:.18,半满:.51,空:.83}[c.w]);}
 if(c.g===7){side=c.diagram==='volume'?'top':'left';p=c.diagram==='volume'?56:55;}
 const path=side==='left'?`M2 ${p}H8`:side==='right'?`M98 ${p}H92`:`M${p} 2V8`;
 const triangle=side==='left'?`7,${p-2} 7,${p+2} 9,${p}`:side==='right'?`93,${p-2} 93,${p+2} 91,${p}`:`${p-2},7 ${p+2},7 ${p},9`;
 return `<svg class="flash-pointers" viewBox="0 0 100 100" aria-hidden="true"><g class="target-pointer"><path d="${path}"/><polygon points="${triangle}"/></g></svg>`;
}
