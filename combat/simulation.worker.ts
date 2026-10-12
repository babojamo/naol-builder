import {simulate} from './simulation-engine';
import type {Combat} from './attack';
self.onmessage=async(event:MessageEvent<{result:Combat;count:number}>)=>{try{const distribution=await simulate(event.data.result,event.data.count,progress=>self.postMessage({progress}));self.postMessage({distribution});}catch(error){self.postMessage({error:(error as Error).message});}};
