import type {Ability,CharacterBuild,FashionBlessing,FashionBlessingRule,FashionSlot,Item,Slot} from './model';

const eligible:Record<Exclude<FashionSlot,'mask'>,string[]>={
 fashionHead:['hat'],fashionSuit:['cloth'],fashionGloves:['glove'],fashionShoes:['shoes'],cloak:['cloak','visualcloak'],
};
export function canReceiveFashionBlessing(item:Item|undefined,slot:Slot):boolean{
 if(!item||item.category!=='fashion'||slot==='mask')return false;
 return slot in eligible&&eligible[slot as Exclude<FashionSlot,'mask'>].includes(item.subcategory??'');
}
export function getFashionBlessingOptions(rules:FashionBlessingRule[],source:FashionBlessing['source'],parameter:string){
 return [...new Set(rules.filter(r=>(source==='unknown'||r.blessing_type===source)&&r.parameter===parameter).map(r=>Number(r.value)))].sort((a,b)=>a-b);
}
export function isValidFashionBlessing(blessing:FashionBlessing,rules:FashionBlessingRule[]){return getFashionBlessingOptions(rules,blessing.source,blessing.parameter).includes(blessing.value);}
export function blessingAbilities(build:CharacterBuild,items:Item[],rules:FashionBlessingRule[]=[]):Ability[]{
 const out:Ability[]=[];
 for(const [slot,gear] of Object.entries(build.equipment) as [Slot,{itemId:number;fashionBlessings?:FashionBlessing[]} ][]){
  const item=items.find(x=>x.id===gear?.itemId);if(!gear||!canReceiveFashionBlessing(item,slot))continue;
  for(const line of (gear.fashionBlessings??[]).slice(0,2))if(line&&Number.isFinite(line.value)&&isValidFashionBlessing(line,rules))out.push({parameter:line.parameter,add:line.value});
 }
 return out;
}
