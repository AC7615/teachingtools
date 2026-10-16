const Unit6Voice=(()=>{
 const base=new URL('../assets/unit6/audio-teacher/',document.currentScript.src),manifest=fetch(new URL('manifest.json',base)).then(r=>{if(!r.ok)throw Error('语音目录未就绪');return r.json()});let playing=null,token=0;
 function stop(){token++;if(playing){playing.pause();playing=null;}}
 async function play(text){stop();const mine=token;try{const data=await manifest;const file=data.clips[text];if(mine!==token)return;if(!file||Array.isArray(data.available)&&!data.available.includes(file)){notify('这段语音正在准备中，可以先看图作答。');return;}playing=new Audio(new URL(file,base));playing.playbackRate=1;playing.onplaying=()=>notify('♫ 正在用AI语音朗读…');playing.onerror=()=>notify('这段AI语音暂时无法播放，请稍后再试。');await playing.play();}catch(e){if(mine!==token)return;notify(e.name==='NotAllowedError'?'请再点一次朗读按钮。':'这段AI语音暂时无法播放，请稍后再试。');}}
 function notify(t){const status=document.getElementById('toast');if(status){status.textContent=t;status.dataset.voiceUntil=Date.now()+3200;status.classList.add('visible');setTimeout(()=>status.classList.remove('visible'),3200)}}
 return{play,stop,provider:'电脑本地 CosyVoice 3'};
})();
