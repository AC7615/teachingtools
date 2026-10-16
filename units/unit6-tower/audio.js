// Original procedural soundtrack. Starts only after a student interaction.
class TowerAudio {
 constructor(){this.ctx=null;this.master=null;this.enabled=localStorage.getItem('tower-sound')!=='off';this.step=0;this.next=0;this.bpm=120;this.falling=null;this.timer=null;this.playing=false;}
 async unlock(){
  if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=this.enabled ? 0.38 : 0;this.master.connect(this.ctx.destination);}
  if(this.ctx.state==='suspended')await this.ctx.resume();
  if(!this.timer)this.timer=setInterval(()=>this.schedule(),80);
 }
 toggle(){this.enabled=!this.enabled;localStorage.setItem('tower-sound',this.enabled?'on':'off');if(this.master)this.master.gain.setTargetAtTime(this.enabled ? 0.38 : 0,this.ctx.currentTime,.04);this.unlock().catch(()=>{});return this.enabled;}
 start(){this.playing=true;this.step=0;if(this.ctx)this.next=this.ctx.currentTime+.05;}
 stop(){this.playing=false;this.stopFall();}
 tempo(height){this.bpm=Math.min(156,120+height*.045);}
 tone(frequency,time,duration=.16,volume=.055,type='triangle'){if(!this.ctx)return;const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.009);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);oscillator.connect(gain);gain.connect(this.master);oscillator.start(time);oscillator.stop(time+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 noise(time,duration,volume=.06,cutoff=1300){if(!this.ctx)return;const buffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start(time);}
 schedule(){
  if(!this.ctx||!this.playing||this.ctx.state!=='running')return;
  if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.02;
  const melody=[72,76,79,76,74,77,81,77,76,79,84,79,74,77,79,71];
  while(this.next<this.ctx.currentTime+.17){const beat=this.step%16,f=n=>440*Math.pow(2,(n-69)/12);this.tone(f(melody[beat]),this.next,.13,.045,'sine');if(beat%4===0){this.tone(f(beat<8?48:53),this.next,.25,.065);this.noise(this.next,.045,.038,200);}if(beat%2===1)this.noise(this.next,.025,.018,5500);this.step++;this.next+=30/this.bpm;}
 }
 fall(duration){this.stopFall();if(!this.ctx)return;const now=this.ctx.currentTime,oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(520,now);oscillator.frequency.exponentialRampToValueAtTime(185,now+Math.max(.12,duration/1000));gain.gain.setValueAtTime(.009,now);oscillator.connect(gain);gain.connect(this.master);oscillator.start();this.falling={oscillator,gain};}
 stopFall(){if(this.falling){try{this.falling.oscillator.stop();}catch{}this.falling.oscillator.disconnect();this.falling.gain.disconnect();this.falling=null;}}
 drop(){this.stopFall();if(!this.ctx)return;const now=this.ctx.currentTime;this.noise(now,.13,.045,2700);this.tone(400,now,.12,.025,'sine');}
 land(perfect=false){this.stopFall();if(!this.ctx)return;const now=this.ctx.currentTime;this.tone(125,now,.09,.18);this.noise(now,.07,.12,950);this.tone(perfect?1046:784,now+.025,.18,.07,'sine');if(perfect)this.tone(1318,now+.10,.17,.04,'sine');}
 collapse(){this.playing=false;this.stopFall();if(!this.ctx)return;const now=this.ctx.currentTime;this.noise(now,.8,.28,700);for(let i=0;i<9;i++){this.noise(now+i*.105,.09,.11*(1-i/12),1200);this.tone(180-i*13,now+i*.08,.18,.09);}}
 finish(){this.stop();if(!this.ctx)return;const now=this.ctx.currentTime;[523,659,784,1046].forEach((note,i)=>this.tone(note,now+i*.10,.2,.065,'sine'));}
}
globalThis.TowerAudio=TowerAudio;
