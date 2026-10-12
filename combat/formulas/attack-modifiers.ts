/** Combat Attack is rate-first, then flat. Normal primary stats use a different order. */
export function modifyAttack(power:number,attackRate:number,flatAttack:number,skillRate=0,thirdJobRate=0,pveFlat=0){
 const combinedRate=attackRate+skillRate+thirdJobRate;
 const rated=Math.floor(power*(1+combinedRate/100));
 return {power,attackRate,skillRate,thirdJobRate,combinedRate,rated,flatAttack,pveFlat,attack:Math.max(0,rated+flatAttack+pveFlat)};
}
