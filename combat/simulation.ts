import type {Combat} from './attack';
import simulationWorkerUrl from './simulation.worker.ts?worker&url';
import {simulate,type Distribution} from './simulation-engine';
export {simulate,type Distribution} from './simulation-engine';
/** Browser simulation runs off the UI thread; Node tests retain the same pure engine. */
export function simulateBackground(result:Combat,count:number,onProgress?:(progress:number)=>void):Promise<Distribution>{if(typeof Worker==='undefined')return simulate(result,count,onProgress);return new Promise((resolve,reject)=>{const worker=new Worker(new URL(simulationWorkerUrl,window.location.origin),{type:'module'});worker.onmessage=(event:MessageEvent<{progress?:number;distribution?:Distribution;error?:string}>)=>{if(event.data.progress!==undefined)onProgress?.(event.data.progress);if(event.data.distribution){worker.terminate();resolve(event.data.distribution);}if(event.data.error){worker.terminate();reject(Error(event.data.error));}};worker.onerror=()=>{worker.terminate();reject(Error('Background simulation failed. Please try again.'));};const {dpsFor,...serializable}=result;void dpsFor;worker.postMessage({result:serializable,count});});}
