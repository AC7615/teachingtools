(function(){
const unitGroups=[
  {key:"unit3",label:"单元3",units:["单元3：分数"]},
  {key:"unit4",label:"单元4",units:["单元4：纸币和硬币","单元4：经济来源和储蓄"]}
];
const cache=new Map();
async function post(apiUrl,payload){const response=await fetch(apiUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});if(!response.ok)throw new Error("network");const data=await response.json();if(data.error)throw new Error(data.error);return data}
function addNames(set,data){[...(data.gameLeaderboard||data.leaderboard||[]),...(data.ticketLeaderboard||[])].forEach(row=>{if(row.name)set.add(String(row.name))})}
function scoreFor(rows,name){const row=(rows||[]).find(item=>String(item.name)===name),score=Number(row?.score);return Number.isFinite(score)?score:0}
async function calculate(apiUrl,sessionToken,force=false){
  const cacheKey=`${apiUrl}|${sessionToken}`;
  if(!force&&cache.has(cacheKey))return cache.get(cacheKey);
  const promise=(async()=>{
    const flatUnits=unitGroups.flatMap(group=>group.units),dataList=await Promise.all(flatUnits.map(unit=>post(apiUrl,{action:"leaderboard",unit,sessionToken}))),byUnit=new Map(flatUnits.map((unit,index)=>[unit,dataList[index]])),names=new Set();
    dataList.forEach(data=>addNames(names,data));
    const rows=[...names].map(name=>{
      const unitScores={};
      unitGroups.forEach(group=>{const parts=[];group.units.forEach(unit=>{const data=byUnit.get(unit)||{};parts.push(scoreFor(data.gameLeaderboard||data.leaderboard,name),scoreFor(data.ticketLeaderboard,name))});unitScores[group.key]=Math.round(parts.reduce((sum,value)=>sum+value,0)/parts.length)});
      const average=Math.round(unitGroups.reduce((sum,group)=>sum+unitScores[group.key],0)/unitGroups.length);
      return{name,unitScores,average};
    }).sort((a,b)=>b.average-a.average||a.name.localeCompare(b.name,"zh"));
    let previousScore=null,previousRank=0;rows.forEach((row,index)=>{if(row.average!==previousScore){previousRank=index+1;previousScore=row.average}row.rank=previousRank});
    return{rows,rankByName:new Map(rows.map(row=>[row.name,row.rank])),unitGroups};
  })();
  cache.set(cacheKey,promise);try{return await promise}catch(error){cache.delete(cacheKey);throw error}
}
window.OverallRanking={calculate,unitGroups};
})();
