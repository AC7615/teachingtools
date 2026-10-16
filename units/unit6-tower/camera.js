function towerCameraTargets(width,height,towerHeight,crashAge=0){
 const normalScale=Math.min(width/400,1.4),ground=height-140;
 const offset=towerHeight*normalScale*.38+Math.max(0,towerHeight*normalScale*.62-ground+Math.max(285,height*.61));
 const fitScale=Math.min(normalScale,Math.max(30,ground-210)/Math.max(towerHeight+75,1),(width-95)/330);
 const progress=Math.max(0,Math.min(1,crashAge/1.35)),ease=progress*progress*(3-2*progress);
 return {ground,scale:normalScale+(fitScale-normalScale)*ease,offset:offset*(1-ease)};
}
if(typeof module!=='undefined')module.exports={towerCameraTargets};
else globalThis.towerCameraTargets=towerCameraTargets;
