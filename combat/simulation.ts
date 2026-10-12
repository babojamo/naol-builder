import type {Combat} from './attack';
export type Distribution={mean:number;median:number;min:number;max:number;p5:number;p25:number;p75:number;p95:number;counts:Record<string,number>;histogram:number[]};
/** Browser simulation runs off the UI thread; Node tests retain the same pure engine. */
export function simulateBackground(result:Combat,count:number,onProgress?:(progress:number)=>void):Promise<Distribution>{if(typeof Worker==='undefined')return simulate(result,count,onProgress);return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./simulation.worker.ts',import.meta.url),{type:'module'});worker.onmessage=(event:MessageEvent<{progress?:number;distribution?:Distribution;error?:string}>)=>{if(event.data.progress!==undefined)onProgress?.(event.data.progress);if(event.data.distribution){worker.terminate();resolve(event.data.distribution);}if(event.data.error){worker.terminate();reject(Error(event.data.error));}};worker.onerror=()=>{worker.terminate();reject(Error('Background simulation failed. Please try again.'));};const {dpsFor,...serializable}=result;void dpsFor;worker.postMessage({result:serializable,count});});}
export async function simulate(r:Combat,n:number,onProgress?:(p:number)=>void):Promise<Distribution>{
 if(!Number.isInteger(n)||n<1||n>100000)throw Error('Simulation size must be between 1 and 100,000.');
 const values:number[]=[],counts={normal:0,critical:0,miss:0,parry:0,blocked:0,blockedCritical:0};let seed=123456789;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<n;i++){const p=random();let sum=0,key:keyof typeof counts='miss';for(const [k,prob] of Object.entries(r.probabilities)){sum+=prob;if(p<sum){key=k as keyof typeof counts;break;}}counts[key]++;
 const range=r.cycleRanges[i%r.cycleRanges.length],critical=key==='critical'||key==='blockedCritical',min=critical?range.criticalMin:range.normalMin,max=critical?range.criticalMax:range.normalMax;let value=key==='miss'?0:min+random()*(max-min);
 if(key==='blocked'||key==='blockedCritical')value*=r.blockedMultiplier;values.push(value);
 if(i%2000===1999){onProgress?.((i+1)/n);await new Promise<void>(resolve=>setTimeout(resolve,0));}}
 values.sort((a,b)=>a-b);const max=values.at(-1)??0,histogram=Array(20).fill(0);for(const value of values)histogram[Math.min(19,Math.floor(value/(max||1)*20))]++;
 return {counts,mean:values.reduce((a,b)=>a+b,0)/n,median:values[Math.floor(n/2)],min:values[0],max,p5:values[Math.floor(n*.05)],p25:values[Math.floor(n*.25)],p75:values[Math.floor(n*.75)],p95:values[Math.floor(n*.95)],histogram};
}
