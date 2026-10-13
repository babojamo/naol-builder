import type {Element} from './model';
export type ElementRelation='none'|'same'|'weak'|'strong';
const strong:Record<Element,Element>={none:'none',fire:'wind',wind:'earth',earth:'electricity',electricity:'water',water:'fire'};
export function getStrongElement(element:Element):Element{return strong[element];}
export function getWeakElement(element:Element):Element{return (Object.keys(strong) as Element[]).find(key=>strong[key]===element)??'none';}
export function elementRelation(attack:Element,defense:Element):ElementRelation{if(attack==='none'||defense==='none')return 'none';if(attack===defense)return 'same';if(getStrongElement(attack)===defense)return 'strong';if(getStrongElement(defense)===attack)return 'weak';return 'none';}
