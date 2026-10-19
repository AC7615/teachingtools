/* Soft answer cues; audio starts only from a user gesture. */
const U8Audio=(()=>{
'use strict';
let muted=false,context=null;const voices=new Set();
try{muted=localStorage.getItem('year1Unit8Muted')==='true'}catch(_){}
function stop(){for(const voice of voices){try{voice.stop()}catch(_){}}voices.clear()}
async function unlock(){if(muted)return null;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;if(!context||context.state==='closed')context=new Audio();if(context.state==='suspended')await context.resume();return context}catch(_){return null}}
async function play(correct){const audio=await unlock();if(!audio||muted||audio.state!=='running')return;stop();const start=audio.currentTime+.01,notes=correct?[[523.25,0,.12],[659.25,.12,.12],[783.99,.24,.22]]:[[392,0,.15],[329.63,.17,.23]];
try{for(const [frequency,offset,duration] of notes){const tone=audio.createOscillator(),gain=audio.createGain(),at=start+offset;tone.type=correct?'sine':'triangle';tone.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(correct?.13:.08,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+duration);tone.connect(gain);gain.connect(audio.destination);voices.add(tone);tone.onended=()=>{voices.delete(tone);tone.disconnect();gain.disconnect()};tone.start(at);tone.stop(at+duration+.02)}}catch(_){stop()}}
function toggle(){muted=!muted;try{localStorage.setItem('year1Unit8Muted',String(muted))}catch(_){}if(muted)stop();else unlock();return muted}
return{play,stop,unlock,toggle,get muted(){return muted}};
})();
