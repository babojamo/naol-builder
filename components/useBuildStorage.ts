'use client';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Owner/launch hydration intentionally depends on intent/readiness, never editable build values; snapshots carry current callbacks. */
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {useAuth} from './AuthProvider';import type {CharacterBuild,GameData} from '../lib/model';import {localBuilds,parseBuild,removeLocalBuild} from '../lib/persistence';
import {buildRepository,type CloudBuild} from '../lib/repositories/builds';import {buildNotFound,createFreshBuild,selectWorkspaceLaunch,type WorkspaceDraft} from '../lib/builder-launch';
export function useBuildStorage({build,data,editSerial,setEditSerial,setBuild,setSaved,setToast,restore,sharedId,requestedBuildId,startNew}:{build:CharacterBuild|null;data:GameData|null;editSerial:number;setEditSerial:Dispatch<SetStateAction<number>>;setBuild:Dispatch<SetStateAction<CharacterBuild|null>>;setSaved:Dispatch<SetStateAction<CharacterBuild[]>>;setToast:Dispatch<SetStateAction<string>>;restore:(b:CharacterBuild,current?:()=>boolean)=>Promise<CharacterBuild>;sharedId?:string;requestedBuildId?:string;startNew?:boolean}){
 const auth=useAuth(),[ready,setReady]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Loading workspace…'),[conflict,setConflict]=useState(''),[lastSavedValue,setLastSavedValue]=useState(''),[savedIds,setSavedIds]=useState<string[]>([]);
 const records=useRef(new Map<string,CloudBuild>()),queue=useRef<Promise<unknown>>(Promise.resolve()),lastSaved=useRef(''),hydratedOwner=useRef<string|null|undefined>(undefined),scratchOwnedId=useRef<string|null>(null),snapshot=useRef({build,data,auth,restore,editSerial});
 useLayoutEffect(()=>{snapshot.current={build,data,auth,restore,editSerial};});
 const draftKey=auth.user?'naol-account-draft:'+auth.user.id:'naol-draft';
 const writeDraft=(next:CharacterBuild,synced:boolean,revision:number)=>localStorage.setItem(draftKey,auth.user?JSON.stringify({build:next,baseRevision:revision,synced,at:new Date().toISOString()}):JSON.stringify(next));
 const preserveDraft=()=>{const previous=localStorage.getItem(draftKey);if(previous)localStorage.setItem(draftKey+':backup:'+Date.now(),previous);};
 const prepare=useCallback((next:CharacterBuild)=>{if(auth.user&&!records.current.has(next.id)&&scratchOwnedId.current!==next.id){const id=crypto.randomUUID();scratchOwnedId.current=id;return {...next,id};}return next;},[auth.user?.id]);
 // Launch selection is an explicit route contract. Hydration never POSTs.
 useEffect(()=>{
  let active=true;setReady(false);setError('');setConflict('');setStatus('Loading workspace…');hydratedOwner.current=undefined;scratchOwnedId.current=null;records.current.clear();lastSaved.current='';setLastSavedValue('');setSavedIds([]);
  if(!build||!data||auth.loading)return;
  const uid=auth.user?.id??null,current=()=>active&&(snapshot.current.auth.user?.id??null)===uid;
  (async()=>{try{
   if(requestedBuildId&&!uid)throw Error('Sign in to open this saved build.');
   const rows=uid?await buildRepository.list():[];if(!current())return;
   records.current=new Map(rows.map(row=>[row.build.id,row]));setSavedIds(rows.map(row=>row.build.id));setSaved(uid?rows.map(row=>row.build):localBuilds());
   const requested=uid&&requestedBuildId&&!startNew&&!sharedId?await buildRepository.get(requestedBuildId):null;if(!current())return;if(requested){records.current.set(requested.build.id,requested);setSavedIds([...records.current.keys()]);}
   let draft:WorkspaceDraft|null=null;
   if(!startNew&&!requestedBuildId&&!sharedId){try{const raw=JSON.parse(localStorage.getItem(draftKey)??'null');draft=uid?raw:raw?{build:raw,baseRevision:0,synced:localBuilds().some(x=>x.id===raw.id&&JSON.stringify(x)===JSON.stringify(raw))}:null;}catch{setToast('The workspace draft could not be read. Its stored copy was retained.');}}
   const selection=selectWorkspaceLaunch({startNew,requestedBuildId,requested:requested?.build,draft,sharedId});
   if(selection.kind==='not-found')throw Error(buildNotFound);
   setEditSerial(0);
   if(selection.kind==='cloud'){
    const restored=await snapshot.current.restore(selection.build,current);if(!current())return;lastSaved.current=JSON.stringify(restored);setStatus('Saved');
   }else if(selection.kind==='draft'){
    const restored=await snapshot.current.restore(selection.draft.build,current);if(!current())return;const row=records.current.get(restored.id);if(selection.draft.baseRevision===0)scratchOwnedId.current=restored.id;
    if(selection.draft.synced){lastSaved.current=JSON.stringify(restored);setStatus(uid?'Saved':'Saved locally');}
    else{setEditSerial(1);setStatus('Draft saved locally · not synced');if(uid&&selection.draft.baseRevision>0&&(!row||row.revision!==selection.draft.baseRevision))setConflict('The cloud version changed or was removed. Your workspace draft was retained; reload cloud or save a copy.');}
   }else if(selection.kind==='new'){
    const restored=await snapshot.current.restore(createFreshBuild(snapshot.current.data!),current);if(!current())return;scratchOwnedId.current=restored.id;setStatus('Unsaved');if(startNew){preserveDraft();writeDraft(restored,false,0);}
   }else{lastSaved.current=JSON.stringify(snapshot.current.build);setStatus('Shared build · edits create a copy');}
   if(current()){setLastSavedValue(lastSaved.current);hydratedOwner.current=uid;setReady(true);}
  }catch(failure){if(current()){setError((failure as Error).message);setStatus('Workspace could not be loaded');}}})();
  return()=>{active=false;};
 },[auth.user?.id,auth.loading,!!build,sharedId,requestedBuildId,startNew]);
 const persist=async(next:CharacterBuild,visibility?:CloudBuild['visibility'])=>{
  const uid=snapshot.current.auth.user?.id;if(!uid)throw Error('Sign in to save across devices.');
  const operation=queue.current.catch(()=>{}).then(async()=>{if(snapshot.current.auth.user?.id!==uid)throw Error('Account changed. Save again in the current account.');const clean=parseBuild(next);const row=records.current.get(clean.id);writeDraft(clean,false,row?.revision??0);setStatus('Saving…');const saved=await buildRepository.save(clean,row?.revision??0,visibility);if(snapshot.current.auth.user?.id!==uid)return saved;records.current.set(clean.id,saved);setSavedIds([...records.current.keys()]);lastSaved.current=JSON.stringify(clean);setLastSavedValue(lastSaved.current);setSaved([...records.current.values()].map(x=>x.build));const current=snapshot.current.build;if(current?.id===clean.id)writeDraft(current,JSON.stringify(current)===JSON.stringify(clean),saved.revision);setStatus('Saved');return saved;});
  queue.current=operation;try{return await operation;}catch(failure){setStatus('Sync failed');const message=(failure as Error).message;if(/changed|another account|deleted/i.test(message))setConflict(message);throw failure;}
 };
 // Edits persist only locally. Neither focus nor hydration can POST a build.
 useEffect(()=>{if(!build||!ready||hydratedOwner.current!==(auth.user?.id??null)||conflict||sharedId&&editSerial===0)return;if(auth.user&&editSerial===0)return;try{writeDraft(build,false,records.current.get(build.id)?.revision??0);if(editSerial>0&&JSON.stringify(build)!==lastSaved.current)setStatus('Draft saved locally · not synced');}catch{setToast('Draft storage unavailable. Export your build to keep a backup.');}},[build,ready,auth.user?.id,editSerial,conflict]);
 const save=async(next:CharacterBuild,share=false)=>{if(auth.user){if(!ready)throw Error('Workspace is still loading.');if(conflict)throw Error('Resolve the cloud conflict or save a copy first.');next=prepare(next);const row=await persist(next,share?'unlisted':undefined);setBuild(next);return row;}const list=[next,...localBuilds().filter(x=>x.id!==next.id)].slice(0,100);localStorage.setItem('naol-offline-builds',JSON.stringify(list));writeDraft(next,false,0);lastSaved.current=JSON.stringify(next);setLastSavedValue(lastSaved.current);setSaved(list);setBuild(next);setStatus('Saved locally');if(share)throw Error('Sign in to share this build. Your offline copy is saved.');return null;};
 const remove=async(id:string)=>{if(auth.user){await buildRepository.remove(id);records.current.delete(id);setSavedIds([...records.current.keys()]);setSaved([...records.current.values()].map(x=>x.build));if(build?.id===id)setConflict('This cloud build was deleted. Save a copy to keep editing it.');}else{removeLocalBuild(id);setSaved(localBuilds());}};
 const duplicate=async(next:CharacterBuild)=>{const copy={...structuredClone(next),id:crypto.randomUUID(),name:(next.name+' copy').slice(0,80),metadata:{...next.metadata,demo:false}};if(auth.user)await persist(copy,'private');else await save(copy);};
 const saveCopy=async()=>{if(!build)return;const copy={...structuredClone(build),id:crypto.randomUUID(),name:(build.name+' offline copy').slice(0,80),metadata:{...build.metadata,demo:false}};await persist(copy,'private');setConflict('');await restore(copy);};
 const reloadCloud=async()=>{if(!build)return;const row=await buildRepository.get(build.id);if(!row)throw Error(buildNotFound);records.current.set(build.id,row);const restored=await restore(row.build);setConflict('');setEditSerial(0);lastSaved.current=JSON.stringify(restored);setLastSavedValue(lastSaved.current);writeDraft(restored,true,row.revision);setStatus('Saved');};
 const newWorkspace=async()=>{if(!data)return;preserveDraft();const fresh=await restore(createFreshBuild(data));scratchOwnedId.current=fresh.id;lastSaved.current='';setLastSavedValue('');setEditSerial(0);setConflict('');writeDraft(fresh,false,0);setStatus('Unsaved');};
 const dirty=Boolean(build&&ready&&editSerial>0&&JSON.stringify(build)!==lastSavedValue);
 return {ready,error,status,conflict,dirty,isSaved:!!build&&savedIds.includes(build.id),prepare,save,duplicate,remove,saveCopy,reloadCloud,newWorkspace};
}
