'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type Dispatch,type SetStateAction} from 'react';import {useAuth} from './AuthProvider';import {createBuild,type CharacterBuild,type GameData} from '../lib/model';import {localBuilds,parseBuild,removeLocalBuild} from '../lib/persistence';import {preferencesRepository} from '../lib/repositories/accounts';import {buildRepository,type CloudBuild} from '../lib/repositories/builds';
type Draft={build:CharacterBuild;baseRevision:number;synced:boolean;at:string};
export function useBuildStorage({build,data,editSerial,setEditSerial,setBuild,setSaved,setToast,restore,sharedId}:{build:CharacterBuild|null;data:GameData|null;editSerial:number;setEditSerial:Dispatch<SetStateAction<number>>;setBuild:Dispatch<SetStateAction<CharacterBuild|null>>;setSaved:Dispatch<SetStateAction<CharacterBuild[]>>;setToast:Dispatch<SetStateAction<string>>;restore:(b:CharacterBuild)=>Promise<void>;sharedId?:string}){
 const auth=useAuth(),[ready,setReady]=useState(false),[status,setStatus]=useState('Saved locally'),[conflict,setConflict]=useState(''),[lastSavedValue,setLastSavedValue]=useState('');
 const records=useRef(new Map<string,CloudBuild>()),queue=useRef<Promise<unknown>>(Promise.resolve()),lastSaved=useRef(''),replay=useRef(false),snapshot=useRef({build,data,auth,restore,editSerial});useLayoutEffect(()=>{snapshot.current={build,data,auth,restore,editSerial};});
 const previousOwner=useRef<string|null|undefined>(undefined),hydratedOwner=useRef<string|null|undefined>(undefined);
 const scratchOwnedId=useRef<string|null>(null);
 const prepare=useCallback((next:CharacterBuild)=>{if(auth.user&&!records.current.has(next.id)&&scratchOwnedId.current!==next.id){const id=crypto.randomUUID();scratchOwnedId.current=id;return {...next,id};}return next;},[auth.user?.id]);
 const draftKey=auth.user?'naol-account-draft:'+auth.user.id:'naol-draft';
 // Hydrate owner-scoped storage; this effect never starts a cloud write.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let active=true;setReady(false);hydratedOwner.current=undefined;scratchOwnedId.current=null;setConflict('');records.current.clear();lastSaved.current='';replay.current=false;if(!build||auth.loading)return;
 const owner=auth.user?.id??null,changed=previousOwner.current!==undefined&&previousOwner.current!==owner;previousOwner.current=owner;
 const reset=async()=>{if(!changed||!snapshot.current.data)return;setEditSerial(0);let replacement=createBuild(snapshot.current.data);try{const local=localStorage.getItem('naol-draft');if(local)replacement=parseBuild(JSON.parse(local),snapshot.current.data);}catch{}await snapshot.current.restore(replacement);};
 if(!auth.user){void reset().then(()=>{if(active){setSaved(localBuilds());setLastSavedValue(lastSaved.current);hydratedOwner.current=null;setReady(true);}}).catch(e=>setToast(e.message));return()=>{active=false;};}
 const uid=auth.user.id;
 (async()=>{try{await reset();const rows=await buildRepository.list();if(!active||snapshot.current.auth.user?.id!==uid)return;records.current=new Map(rows.map(x=>[x.build.id,x]));setSaved(rows.map(x=>x.build));let draft:Draft|null=null;try{draft=JSON.parse(localStorage.getItem('naol-account-draft:'+uid)??'null');if(draft)draft.build=parseBuild(draft.build);}catch{}
 if(draft?.baseRevision===0)scratchOwnedId.current=draft.build.id;
 const requested=new URL(location.href).searchParams.get('build');const chosen=rows.find(x=>x.build.id===(requested??draft?.build.id))??(!requested?rows[0]:undefined);
 if(snapshot.current.editSerial!==editSerial){if(records.current.has(snapshot.current.build?.id??''))setConflict('Cloud builds loaded while you were editing. Reload cloud or save your edits as a copy.');}
 else if(!sharedId&&chosen){if(draft?.build.id===chosen.build.id&&!draft.synced){if(draft.baseRevision===chosen.revision){await snapshot.current.restore(draft.build);replay.current=true;setEditSerial(1);}else{await snapshot.current.restore(chosen.build);setConflict('A newer cloud version exists. Your offline draft is retained. Reload cloud or save the offline draft as a copy.');}}else{await snapshot.current.restore(chosen.build);lastSaved.current=JSON.stringify(chosen.build);setStatus('Saved');}}
 else if(!sharedId&&draft&&!draft.synced&&!requested){if(draft.baseRevision===0){await snapshot.current.restore(draft.build);replay.current=true;setEditSerial(1);}else setConflict('The cloud build was removed. Your offline draft is retained; save it as a copy.');}
 if(!chosen&&!draft&&!sharedId&&snapshot.current.build?.metadata.demo){try{const preferences=await preferencesRepository.get();if(preferences&&typeof preferences==='object'&&!Array.isArray(preferences)&&preferences.performanceDefaults)await snapshot.current.restore(parseBuild({...snapshot.current.build,performance:preferences.performanceDefaults}));}catch{}}
 if(active){setLastSavedValue(lastSaved.current);hydratedOwner.current=uid;setReady(true);}
 }catch(e){if(active){setStatus('Sync failed');setToast((e as Error).message);}}})();return()=>{active=false;};
 },[auth.user?.id,auth.loading,!!build]);
 const writeDraft=(next:CharacterBuild,synced:boolean,revision:number)=>{localStorage.setItem(draftKey,auth.user?JSON.stringify({build:next,baseRevision:revision,synced,at:new Date().toISOString()}):JSON.stringify(next));};
 const persist=async(next:CharacterBuild,visibility?:CloudBuild['visibility'])=>{
 const uid=snapshot.current.auth.user?.id;if(!uid)throw Error('Sign in to save across devices.');
 const operation=queue.current.catch(()=>{}).then(async()=>{if(snapshot.current.auth.user?.id!==uid)throw Error('Account changed. Save again in the current account.');const clean=parseBuild(next);const row=records.current.get(clean.id);writeDraft(clean,false,row?.revision??0);setStatus('Saving…');const saved=await buildRepository.save(clean,row?.revision??0,visibility);if(snapshot.current.auth.user?.id!==uid)return saved;records.current.set(clean.id,saved);lastSaved.current=JSON.stringify(clean);setLastSavedValue(lastSaved.current);setSaved([...records.current.values()].map(x=>x.build));const current=snapshot.current.build;if(current?.id===clean.id&&JSON.stringify(current)===JSON.stringify(clean))writeDraft(clean,true,saved.revision);else if(current?.id===clean.id)writeDraft(current,false,saved.revision);replay.current=false;setStatus('Saved');return saved;});queue.current=operation;try{return await operation;}catch(e){setStatus('Sync failed');const message=(e as Error).message;if(/changed|another account|deleted/i.test(message))setConflict(message);throw e;}
 };
 // Persist the local draft and its sync status after an edit.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!build||!ready||hydratedOwner.current!==(auth.user?.id??null))return;if(!auth.user){try{writeDraft(build,false,0);setStatus('Saved locally');}catch{setStatus('Sync failed');}return;}
 if((editSerial===0&&!replay.current)||conflict||sharedId&&editSerial===0)return;
 try{writeDraft(build,false,records.current.get(build.id)?.revision??0);}catch{setToast('Draft storage unavailable. Export your build to keep a backup.');}
 if(JSON.stringify(build)===lastSaved.current)return;
 // Editing only updates the durable local draft. Cloud writes happen exclusively
 // through the explicit Save action, so focus changes can never trigger a POST.
 setStatus('Draft saved locally · not synced');
 },[build,ready,auth.user?.id,editSerial,conflict]);
 const save=async(next:CharacterBuild,share=false)=>{if(auth.user){if(!ready)throw Error('Cloud builds are still loading. Please try again shortly.');if(conflict)throw Error('Resolve the cloud conflict or save a copy first.');next=prepare(next);const row=await persist(next,share?'unlisted':undefined);setBuild(next);return row;}const list=[next,...localBuilds().filter(x=>x.id!==next.id)].slice(0,100);localStorage.setItem('naol-offline-builds',JSON.stringify(list));writeDraft(next,false,0);lastSaved.current=JSON.stringify(next);setLastSavedValue(lastSaved.current);setSaved(list);setBuild(next);setStatus('Saved locally');if(share)throw Error('Sign in to share this build. Your offline copy is saved.');return null;};
 const remove=async(id:string)=>{if(auth.user){await buildRepository.remove(id);records.current.delete(id);setSaved([...records.current.values()].map(x=>x.build));if(build?.id===id)setConflict('This cloud build was deleted. Save a copy to keep editing it.');}else{removeLocalBuild(id);setSaved(localBuilds());}};
 const duplicate=async(next:CharacterBuild)=>{const copy={...structuredClone(next),id:crypto.randomUUID(),name:(next.name+' copy').slice(0,80),metadata:{...next.metadata,demo:false}};if(auth.user)await persist(copy,'private');else await save(copy);};
 const saveCopy=async()=>{let source=build;try{const saved=JSON.parse(localStorage.getItem(draftKey)??'null') as Draft|null;if(saved?.build)source=parseBuild(saved.build);}catch{}if(!source)return;const copy={...structuredClone(source),id:crypto.randomUUID(),name:(source.name+' offline copy').slice(0,80),metadata:{...source.metadata,demo:false}};await persist(copy,'private');setConflict('');await restore(copy);};
 const reloadCloud=async()=>{if(!build)return;const row=await buildRepository.get(build.id);if(!row)throw Error('Cloud build no longer exists. Save a copy.');records.current.set(build.id,row);setConflict('');replay.current=false;lastSaved.current=JSON.stringify(row.build);setLastSavedValue(lastSaved.current);writeDraft(row.build,true,row.revision);await restore(row.build);setStatus('Saved');};
 const dirty=Boolean(build&&ready&&editSerial>0&&JSON.stringify(build)!==lastSavedValue);
 return {status,conflict,dirty,prepare,save,duplicate,remove,saveCopy,reloadCloud};
}
