export type AttackEvent='main'|'off'|'main'|'both';
export const dualWieldCycle:readonly AttackEvent[]=['main','off','main','both'];
export function attackCycle(dual:boolean){return dual?dualWieldCycle:['main'] as const;}
export function cycleDamage(event:AttackEvent,main:number,off:number){return event==='both'?main+off:event==='off'?off:main;}
export function offhandMultiplier(bonus:number){return Math.max(0,.75+bonus/100);}
