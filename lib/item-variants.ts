import {catalogItem} from './catalog-index';
import type {GameData,Gear,Item} from './model';
type Catalog=Pick<GameData,'item'>;
const caches=new WeakMap<Item[],{base:Map<Item,Item|undefined>;ultimate:Map<Item,Item|undefined>}>();
function cache(d:Catalog){let value=caches.get(d.item);if(!value){value={base:new Map(),ultimate:new Map()};caches.set(d.item,value);}return value;}
function signature(item:Item){return JSON.stringify([item.category,item.subcategory??'',item.class??null,item.level,item.name.replace(/^Ultimate\s+|\s+\(Ultimate\)$/gi,'').trim().toLowerCase().replace(/\s+/g,' '),item.minAttack??null,item.maxAttack??null,!!item.twoHanded]);}
/** Dismantle is authoritative. Signature matching is a conservative fallback only. */
export function getBaseWeaponVariant(item:Item,d:Catalog):Item|undefined{
 if(item.category!=='weapon')return;
 if(item.rarity!=='ultimate')return item;
 const memo=cache(d).base;if(memo.has(item))return memo.get(item);
 const targets=[...new Set(item.dismantle?.map(x=>x.item)??[])].map(id=>catalogItem(d,id));
 const linked=targets.filter((x):x is Item=>!!x&&x.category==='weapon'&&x.rarity!=='ultimate'&&x.subcategory===item.subcategory);
 let result:Item|undefined;
 if(linked.length===1&&!targets.some(x=>!x))result=linked[0];
 else if(!linked.length&&!targets.some(x=>!x)){
  const candidates=d.item.filter(x=>x.id!==item.id&&x.category==='weapon'&&x.rarity!=='ultimate'&&x.ultimateConvertible===true&&signature(x)===signature(item));
  if(candidates.length===1)result=candidates[0];
 }
 memo.set(item,result);return result;
}
export function getUltimateWeaponVariant(item:Item,d:Catalog):Item|undefined{
 if(item.category!=='weapon')return;
 if(item.rarity==='ultimate')return item;
 const memo=cache(d).ultimate;if(memo.has(item))return memo.get(item);
 const related=d.item.filter(x=>x.category==='weapon'&&x.rarity==='ultimate'&&getBaseWeaponVariant(x,d)?.id===item.id);
 const authoritative=related.filter(x=>x.dismantle?.some(link=>link.item===item.id));
 const candidates=authoritative.length?authoritative:related;
 const result=candidates.length===1?candidates[0]:undefined;memo.set(item,result);return result;
}
export function getWeaponVariantGroup(item:Item,d:Catalog){return {base:getBaseWeaponVariant(item,d),ultimate:getUltimateWeaponVariant(item,d)};}
/** One-time conversion resets upgrade/config only; all other configured properties survive. */
export function configureUltimateWeapon(item:Item,gear:Gear,d:Catalog):Gear{
 if(item.category!=='weapon'||(item.rarity!=='ultimate'&&!item.ultimateConvertible))throw Error('This weapon cannot be configured as Ultimate.');
 const counterpart=getUltimateWeaponVariant(item,d);
 const next:Gear={...gear,itemId:counterpart?.id??item.id,ultimateWeapon:{ultimateUpgrade:0,jewels:[],bonuses:{base:[]}}};
 delete next.normalUpgrade;delete next.upgrade;return next;
}
/** Legacy normalization retains the complete existing Ultimate configuration. */
export function normalizeUltimateGear(item:Item,gear:Gear,d:Catalog):{gear:Gear;note?:string}{
 if(item.category!=='weapon'||item.rarity==='ultimate'||!item.ultimateConvertible||!gear.ultimateWeapon)return {gear};
 const counterpart=getUltimateWeaponVariant(item,d);
 if(!counterpart)return {gear,note:`${item.name}: no unambiguous Ultimate counterpart is available. The legacy item ID and Ultimate configuration were preserved.`};
 const next={...gear,itemId:counterpart.id};delete next.normalUpgrade;delete next.upgrade;
 return {gear:next,note:`${item.name}: normalized legacy Ultimate weapon ${item.id} to official Ultimate item ${counterpart.id}; configured weapon properties were preserved.`};
}
