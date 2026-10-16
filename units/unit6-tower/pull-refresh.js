// A deliberate pull from the top edge; never steal a falling block's drag gesture.
(()=>{
 const indicator=document.createElement('div');indicator.className='pull-refresh';indicator.setAttribute('role','status');indicator.hidden=true;document.body.append(indicator);
 let gesture=null,refreshing=false;
 document.addEventListener('touchstart',e=>{
  if(refreshing||e.touches.length!==1)return;const t=e.touches[0];
  const panel=e.target.closest('.panel');
  if((t.clientY>115&&!panel)||e.target.closest('input,select,button,a')||(e.target.closest('canvas')&&state?.phase==='placing'))return;
  if(panel&&panel.scrollTop>0)return;
  gesture={x:t.clientX,y:t.clientY,distance:0};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!gesture||e.touches.length!==1)return;const t=e.touches[0],dy=t.clientY-gesture.y,dx=Math.abs(t.clientX-gesture.x);
  if(dx>35||dy<0){gesture=null;indicator.hidden=true;return;}if(dy<12)return;
  e.preventDefault();gesture.distance=Math.min(150,dy*.65);indicator.hidden=false;indicator.textContent=gesture.distance>=80?'松开刷新 ↻':'↓ 下拉刷新';indicator.style.transform=`translate(-50%, ${Math.min(gesture.distance,95)}px)`;
 },{passive:false});
 document.addEventListener('touchend',async()=>{
  const ready=gesture?.distance>=80;gesture=null;if(!ready){indicator.hidden=true;return;}
  refreshing=true;indicator.textContent='正在刷新…';localSession?.persist();
  if(!demo&&state)sessionStorage.setItem('tower-session',state.token);
  // Queued moves already live on the device; don't hold the refresh on a slow sheet.
  await Promise.race([localSession?.flush()||Promise.resolve(),new Promise(r=>setTimeout(r,1200))]);location.reload();
 },{passive:true});
 document.addEventListener('touchcancel',()=>{gesture=null;indicator.hidden=true;},{passive:true});
})();
