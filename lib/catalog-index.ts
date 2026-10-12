import type {GameData,Item,Skill} from './model';
const itemIndexes=new WeakMap<Item[],Map<number,Item>>(),skillIndexes=new WeakMap<Skill[],Map<number,Skill>>();
/** Index synchronized immutable catalog arrays once, including selective class catalogs. */
export function catalogItem(data:Pick<GameData,'item'>,id:number|undefined){if(id===undefined)return;let index=itemIndexes.get(data.item);if(!index){index=new Map(data.item.map(x=>[x.id,x]));itemIndexes.set(data.item,index);}return index.get(id);}
export function catalogSkill(data:Pick<GameData,'skill'>,id:number|undefined){if(id===undefined)return;let index=skillIndexes.get(data.skill);if(!index){index=new Map(data.skill.map(x=>[x.id,x]));skillIndexes.set(data.skill,index);}return index.get(id);}
