/** Rates below run on aggregate hand damage, with a floor at each reference stage. */
export function finalizeDamage(damage:number,modeRate:number,incomingRate:number,bossRate:number,reductionRate:number){
 const afterMode=damage+Math.floor(damage*modeRate/100);
 const afterIncoming=afterMode+Math.floor(afterMode*Math.max(-50,incomingRate)/100);
 const afterBoss=afterIncoming+Math.floor(afterIncoming*bossRate/100);
 const final=Math.max(0,afterBoss-Math.floor(afterBoss*Math.min(50,reductionRate)/100));
 return {afterMode,afterIncoming,afterBoss,final};
}
