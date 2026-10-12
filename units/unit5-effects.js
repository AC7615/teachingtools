'use strict';
const TimeFX=(()=>{
 let audio=null,enabled=true;
 function sound(kind='click'){
  if(!enabled)return;
  try{
   audio??=new (window.AudioContext||window.webkitAudioContext)();
   audio.resume().catch(()=>{});
   const notes={click:[660],correct:[659,880,1047],wrong:[196,147],clue:[1047,1319,1568,2093],clear:[784,988,1319],bonus:[988,1319,1760],win:[523,659,784,1047]}[kind]||[660];
   notes.forEach((frequency,i)=>{const o=audio.createOscillator(),g=audio.createGain(),step=kind==='wrong'?.16:.09,t=audio.currentTime+i*step;o.type=kind==='wrong'?'triangle':'sine';o.frequency.setValueAtTime(frequency,t);if(kind==='wrong')o.frequency.exponentialRampToValueAtTime(frequency*.7,t+.2);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+(kind==='wrong'?.25:.16));o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+(kind==='wrong'?.28:.18));});
  }catch{}
 }
 function feedback(ok){sound(ok?'correct':'wrong');const host=document.getElementById('quizArea');host.classList.remove('answer-good','answer-bad');void host.offsetWidth;host.classList.add(ok?'answer-good':'answer-bad');const text=document.getElementById('feedback');if(text){text.classList.remove('fx-good','fx-bad');text.classList.add(ok?'fx-good':'fx-bad');}}
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('[data-clue],[data-answer],#quizNext,#checkDrawing,#soundToggle'))sound();},true);
 document.getElementById('soundToggle').onclick=e=>{enabled=!enabled;e.currentTarget.textContent=enabled?'🔊 音效开':'🔇 音效关';e.currentTarget.setAttribute('aria-pressed',String(enabled));if(enabled)sound();};
 return {sound,feedback};
})();
