export const builderRoute=()=>'/';
export const builderBuildRoute=(id:string)=>'/?build='+encodeURIComponent(id);
export const newBuildRoute=()=> '/?new=1';
export const sharedBuildRoute=(id:string)=>'/build/'+encodeURIComponent(id);
export const accountBuildsRoute=()=>'/account/builds';
export type BuilderLaunch={mode:'resume'}|{mode:'new'}|{mode:'open';buildId:string};
export function resolveBuilderLaunch(params:Record<string,string|string[]|undefined>):BuilderLaunch{const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;if(first(params.new)==='1')return {mode:'new'};const id=first(params.build)?.trim();return id?{mode:'open',buildId:id}:{mode:'resume'};}
