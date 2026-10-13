/** A damage event is one cycle step; a simultaneous off-hand strike is already in its damage. */
export function combatCadence(interval:number,hitProbability:number,measuredEventsPerSecond?:number|null,extraAttackChance=0){
 if(!Number.isFinite(interval)||interval<=0)throw Error('Attack interval must be positive and finite.');
 if(!Number.isFinite(hitProbability)||hitProbability<0||hitProbability>1)throw Error('Hit probability must be between zero and one.');
 if(measuredEventsPerSecond!=null&&(!Number.isFinite(measuredEventsPerSecond)||measuredEventsPerSecond<=0))throw Error('Measured attack events per second must be positive and finite.');
 if(!Number.isFinite(extraAttackChance)||extraAttackChance<0||extraAttackChance>1)throw Error('Extra attack chance must be between zero and one.');
 const cycleStepsPerSecond=measuredEventsPerSecond??1/interval,eventsPerCycleStep=1+extraAttackChance,attemptedEventsPerSecond=cycleStepsPerSecond*eventsPerCycleStep;
 return {cycleStepsPerSecond,eventsPerCycleStep,extraAttackChance,attemptedEventsPerSecond,effectiveHitsPerSecond:attemptedEventsPerSecond*hitProbability,interval:1/cycleStepsPerSecond,source:measuredEventsPerSecond==null?'uncalibrated-model' as const:'measured' as const};
}

/** Connected damage already includes crit, block, defense and applicable damage modifiers. */
export function sustainedThroughput(connectedDamage:number,cadence:ReturnType<typeof combatCadence>){
 const dps=connectedDamage*cadence.effectiveHitsPerSecond;
 return {...cadence,connectedDamage,dps,dpsFor:(seconds:number)=>seconds>0?Math.floor(seconds/cadence.interval)*cadence.eventsPerCycleStep*connectedDamage*(cadence.effectiveHitsPerSecond/cadence.attemptedEventsPerSecond)/seconds:0};
}
