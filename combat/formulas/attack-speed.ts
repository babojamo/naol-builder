/** Independently implemented reference conversion; no Action Speed cadence assumption. */
export function calculateAttackSpeedInternal(input:{classSpeed:number;weaponSpeed:number;dex:number;level:number;bonus:number;rate:number}){
 const progression=[.08,.16,.24,.32,.40,.48,.56,.64,.72,.80,.88,.96,1.04,1.12,1.20,1.30,1.38,1.50];
 const rating=Math.floor(Math.min(187.5,input.classSpeed+input.weaponSpeed*(4*input.dex+input.level/8)));
 const index=Math.min(17,Math.max(0,Math.floor(rating/10)));
 const converted=25/(200-rating)+progression[index]+input.bonus*.02;
 return Math.min(2,Math.max(.1,converted*(1+input.rate/100)));
}
export const calculateDisplayedAttackSpeed=(internal:number)=>internal*50;
export const calculateAttackInterval=(internal:number)=>1/internal;
