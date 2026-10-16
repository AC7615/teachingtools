// Gameplay never waits for the network. Only the server-verified event log is saved.
class LocalSession {
 constructor({initial,deviceId,request,storage,onUpdate=()=>{},onError=()=>{},clock=Date.now}){
  this.state=initial;this.deviceId=deviceId;this.request=request;this.storage=storage;this.onUpdate=onUpdate;this.onError=onError;this.clock=clock;
  this.offset=initial.serverNow-clock();this.events=[];this.inFlight=false;this.blocked=false;this.closed=false;this.timer=null;
  try{const old=JSON.parse(storage.getItem('tower-session-data')||'null');if(old?.state.token===initial.token&&old.state.unit===initial.unit&&old.state.version>=initial.version){this.state=old.state;this.events=old.events.filter(e=>e.version>=initial.version);}}catch{}
  this.persist();
 }
 persist(){try{this.storage.setItem('tower-session-data',JSON.stringify({state:this.state,events:this.events}));}catch{this.onError('设备存储空间不足，待同步记录无法保留。');}}
 perform(action,extra={}){
  if(this.blocked)throw Error('此账号已在另一台设备登录，请重新登录。');
  const at=Math.max(this.state.lastEventAt||this.state.created,this.clock()+this.offset),event={action,...extra,at,version:this.state.version,requestId:crypto.randomUUID()};
  act(this.state,event,at);this.state.lastEventAt=at;this.state.saved=false;this.events.push(event);this.persist();
  if(this.state.phase==='ended'||this.events.length>=40)this.flush();return this.state;
 }
 schedule(delay=24000+Math.random()*12000){clearTimeout(this.timer);if(!this.closed&&!this.blocked)this.timer=setTimeout(()=>this.flush(),delay);}
 async flush(){
  if(this.inFlight||this.blocked||this.closed)return;clearTimeout(this.timer);this.inFlight=true;
  const events=this.events.slice(0,40);let failed=false;
  try{
   const reply=await this.request({action:'sync',protocol:2,token:this.state.token,unit:this.state.unit,deviceId:this.deviceId,events});
   if(!Number.isInteger(reply.version)||reply.version>this.state.version)throw Error('同步记录不一致，请重新登录。');
   this.events=this.events.filter(e=>e.version>=reply.version);
   this.state.saved=Boolean(reply.saved&&reply.version===this.state.version);
   this.persist();this.onUpdate(this.state);
   if(!this.events.length&&this.state.phase==='ended'&&this.state.saved){this.closed=true;clearTimeout(this.timer);}
  }catch(e){
   failed=true;if(['DEVICE_IN_USE','SESSION_REPLACED','INVALID_LOG'].includes(e.code))this.blocked=true;
   this.onError(e.message,this.blocked);this.persist();
  }finally{
   this.inFlight=false;
   if(!this.closed&&!this.blocked)this.schedule(failed?2000+Math.random()*4000:this.events.length>=40||this.state.phase==='ended'?50:undefined);
  }
 }
 stop(){this.closed=true;clearTimeout(this.timer);}
}
if(typeof module!=='undefined')module.exports={LocalSession};
