import {createBuild,type CharacterBuild,type GameData} from './model';import {parseBuild} from './persistence';
export const buildNotFound='Build could not be found or you no longer have access to it.';
export type WorkspaceDraft={build:CharacterBuild;baseRevision:number;synced:boolean;at?:string};
export function createFreshBuild(data:GameData):CharacterBuild{const build=createBuild(data),c=data.class.find(x=>x.id===build.classId)!;return {...build,name:'Untitled Build',level:Math.max(c.minLevel,Math.min(c.maxLevel,build.level)),baseStats:{str:15,sta:15,dex:15,int:15},equipment:{},skills:[],buffs:[],pet:null,observedStats:undefined,metadata:{...build.metadata,demo:false,recommendations:[]}};}
export function selectWorkspaceLaunch({startNew,requestedBuildId,requested,draft,sharedId}:{startNew?:boolean;requestedBuildId?:string;requested?:CharacterBuild|null;draft?:WorkspaceDraft|null;sharedId?:string}){
 if(sharedId)return {kind:'shared' as const};if(startNew)return {kind:'new' as const};if(requestedBuildId)return requested?.id===requestedBuildId?{kind:'cloud' as const,build:requested}:{kind:'not-found' as const};return draft?{kind:'draft' as const,draft}:{kind:'new' as const};
}
export async function restoreBuildWithCatalog(raw:unknown,core:Omit<GameData,'item'|'skill'>,loadCatalog:(id:number)=>Promise<Pick<GameData,'item'|'skill'>>){
 const value=raw as {classId?:unknown;opponentBuild?:{classId?:unknown}};if(!value||typeof value.classId!=='number'||!core.class.some(x=>x.id===value.classId))throw Error('This build references an unknown class. Original data has not been changed.');
 const ids=[value.classId];if(typeof value.opponentBuild?.classId==='number'&&value.opponentBuild.classId!==value.classId)ids.push(value.opponentBuild.classId);
 const catalogs=await Promise.all(ids.map(loadCatalog)),data={...core,item:[...new Map(catalogs.flatMap(x=>x.item).map(x=>[x.id,x])).values()],skill:[...new Map(catalogs.flatMap(x=>x.skill).map(x=>[x.id,x])).values()]} as GameData;
 return {build:parseBuild(raw,data),data};
}
