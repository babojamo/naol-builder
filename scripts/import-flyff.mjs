import { mkdirSync, writeFileSync } from 'node:fs';
const base='https://api.flyff.com';
const pause=()=>new Promise(r=>setTimeout(r,350));
async function get(path){await pause();const r=await fetch(base+'/'+path);if(!r.ok)throw new Error(path+': '+r.status);return r.json();}
function normalize(x){const o={...x,name:x.name?.en??x.title?.en??'',description:x.description?.en??''};if(Array.isArray(x.levels))o.levels=x.levels.map((l,i)=>({...l,level:l.level??i+1}));delete o.spawns;delete o.drops;delete o.experienceTable;delete o.location;delete o.treePosition;delete o.masterVariations;delete o.title;delete o.transy;return o;}
mkdirSync('data',{recursive:true});
const version=await get('version/data');
const data={version,syncedAt:new Date().toISOString(),source:base};
for(const resource of ['class','item','monster','skill','equipset']){
 const ids=await get(resource);const out=[];
 for(let i=0;i<ids.length;i+=400){const batch=await get(resource+'/'+ids.slice(i,i+400).join(','));for(const x of Array.isArray(batch)?batch:[batch]){if(resource==='item'&&!['weapon','armor','jewelry','fashion','raisedpet','material'].includes(x.category))continue;out.push(normalize(x));}if(i%4000===0)console.log(resource,i,'/',ids.length);}
 data[resource]=out;writeFileSync('data/'+resource+'.json',JSON.stringify(out));
}
for(const resource of ['upgradelevelbonus','statawake','skillawake','raisedpet','dungeon']){const raw=await get(resource);data[resource]=Array.isArray(raw)?raw.map(normalize):raw;writeFileSync('data/'+resource+'.json',JSON.stringify(data[resource]));}
writeFileSync('data/meta.json',JSON.stringify({version,syncedAt:data.syncedAt,source:base}));
writeFileSync('data/fixtures.json',JSON.stringify({class:data.class.find(x=>x.name==='Blade'),item:data.item.find(x=>x.category==='weapon'&&x.class===2246&&x.level===120),monster:data.monster.find(x=>x.name==='Giant Aibatt'),upgrade:data.upgradelevelbonus.find(x=>x.upgradeLevel===8)},null,2));
console.log('Imported',Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Array.isArray(v)?v.length:v])));
