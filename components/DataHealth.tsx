'use client';
import ElementDefenseHealth from './ElementDefenseHealth';
import SelfBuffHealth from './SelfBuffHealth';

import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from './AuthProvider';
import {authenticatedFetch} from '../lib/supabase/client';
import FashionBlessingHealth from './FashionBlessingHealth';
import SkillWeaponHealth from './SkillWeaponHealth';

type RequirementAudit=ReturnType<typeof import('../lib/skill-weapons').auditSkillWeaponRequirements>;
type WeaponAudit=ReturnType<typeof import('../lib/weapon-effects').auditWeaponEffects>;
type SyncState={
 character_element_defense_diagnostics?:ReturnType<typeof import('../lib/character-element-defense').auditCharacterElementDefense>;

self_buff_diagnostics?:ReturnType<typeof import('../lib/skill-usage').auditSelfBuffSkills>;
  weapon_effect_diagnostics?:WeaponAudit;
  fashion_blessing_diagnostics?:ReturnType<typeof import('../lib/fashion').auditFashionBlessingRules>;
  skill_weapon_requirements?:RequirementAudit;
  checked_version:number|null;
  cached_version:number|null;
  last_api_check:string|null;
  last_successful_sync:string|null;
  status:string;
  error?:string|null;
  record_counts?:Record<string,number>;
};

export default function DataHealth(){
  const auth=useAuth(),[state,setState]=useState<SyncState|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),lastRefresh=useRef(0),inFlight=useRef(false);
  const refresh=useCallback(async(force=false)=>{if(inFlight.current||(!force&&Date.now()-lastRefresh.current<60_000))return;inFlight.current=true;lastRefresh.current=Date.now();try{const r=await authenticatedFetch('/api/sync');if(!r.ok)throw Error('Sync health unavailable');setState(await r.json() as SyncState);}finally{inFlight.current=false;}},[]);
  useEffect(()=>{void refresh(true).catch(e=>setMessage(e.message));const onFocus=()=>{if(document.visibilityState==='visible')void refresh().catch(()=>{});};const onVisibility=()=>{if(document.visibilityState==='visible')void refresh().catch(()=>{});};window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);return()=>{window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility);};},[refresh]);
  const weapon=state?.weapon_effect_diagnostics;
  return <section className="panel">
    <h2>Madrigal data health</h2>
    <p>Official Flyff data is cached in Supabase. A complete, validated generation replaces the previous cache atomically.</p>
    <dl>{[['Flyff API version',state?.checked_version],['Supabase cached version',state?.cached_version],['Last API check',state?.last_api_check&&new Date(state.last_api_check).toLocaleString()],['Last successful sync',state?.last_successful_sync&&new Date(state.last_successful_sync).toLocaleString()],['Sync status',state?.status]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??'Not available'}</dd></div>)}{state?.record_counts&&typeof state.record_counts==='object'&&!Array.isArray(state.record_counts)&&Object.entries(state.record_counts).map(([name,count])=><div key={name}><dt>{name}</dt><dd>{String(count)}</dd></div>)}</dl>

    {weapon&&<section className="health-subsection">
      <h3>Weapon effect coverage</h3>
      <dl>
        <div><dt>Total weapons</dt><dd>{weapon.totalWeapons}</dd></div>
        <div><dt>Unique weapon parameters</dt><dd>{weapon.uniqueParameters.length}</dd></div>
        <div><dt>Fully supported parameters</dt><dd>{weapon.fullySupported.length}</dd></div>
        <div><dt>Conditional parameters</dt><dd>{weapon.conditionalSupported.length}</dd></div>
        <div><dt>Trigger parameters</dt><dd>{weapon.triggerSupported.length}</dd></div>
        <div><dt>Recognized but unsupported parameters</dt><dd>{weapon.recognizedUnsupported.length}</dd></div>
        <div><dt><strong>Unknown weapon effects</strong></dt><dd><strong>{weapon.unknown.length}</strong></dd></div>
      </dl>
      <p className={weapon.unknown.length?'notice':'muted'}>{weapon.unknown.length?'Unknown weapon effects must be reviewed before claiming complete weapon coverage.':'Unknown weapon effects: 0 · every current weapon ability parameter has an explicit support classification.'}</p>

      {weapon.unknown.length>0&&<details open><summary>Unknown weapon effects · {weapon.unknown.length}</summary>{weapon.unknown.map((row,index)=><div className="notice" key={`${row.itemId}-${row.source}-${row.parameter}-${index}`}><strong>{row.itemName} · #{row.itemId}</strong><br/><span>{row.parameter} · {row.source}</span><br/><code>{JSON.stringify(row.ability)}</code></div>)}</details>}

      <details><summary>Parameter coverage · {weapon.uniqueParameters.length}</summary><dl>{weapon.uniqueParameters.map(row=><div key={row.parameter}><dt>{row.parameter}</dt><dd>{row.status} · {row.count} lines</dd></div>)}</dl></details>

      {weapon.recognizedUnsupported.length>0&&<details><summary>Recognized but unsupported · {weapon.recognizedUnsupported.length}</summary><dl>{weapon.recognizedUnsupported.map(row=><div key={row.parameter}><dt>{row.parameter}</dt><dd>{row.count} lines · {row.exampleItems.map(item=>item.name).join(', ')}</dd></div>)}</dl></details>}

      <details><summary>skillchance triggers · {weapon.skillChanceTriggers.length}</summary>{weapon.skillChanceTriggers.length?weapon.skillChanceTriggers.map((row,index)=><p key={`${row.itemId}-${row.skillId}-${index}`}><strong>{row.itemName}</strong> · {row.skillName}{row.probability!==null?` · ${row.probability}%`:''} · {row.targetScope} · {row.supported?'simulated':'recognized / not simulated'}</p>):<p>No skillchance weapon effects in this catalog.</p>}</details>

      <details><summary>item.triggerSkill audit · {weapon.itemTriggerSkills.length}</summary>{weapon.itemTriggerSkills.length?weapon.itemTriggerSkills.map((row,index)=><p key={`${row.itemId}-${row.skillId}-${index}`}><strong>{row.itemName} · #{row.itemId}</strong> · {row.skillName} · skill #{row.skillId}{row.probability!==null?` · ${row.probability}%`:''} · {row.supported?'simulated':'recognized / not simulated'}</p>):<p>No weapon item.triggerSkill entries in this catalog.</p>}</details>

      <p className="muted">Conditional hand policy: {weapon.conditionalHandPolicy.mode} · {weapon.conditionalHandPolicy.confidence}. Waterbomb and other recognized-but-unverified procs remain excluded from primary-target DPS.</p>
    </section>}

    {state?.character_element_defense_diagnostics&&<ElementDefenseHealth audit={state.character_element_defense_diagnostics}/>} {state?.self_buff_diagnostics&&<SelfBuffHealth audit={state.self_buff_diagnostics}/>}{state?.fashion_blessing_diagnostics&&<FashionBlessingHealth audit={state.fashion_blessing_diagnostics}/>} {state?.skill_weapon_requirements&&<SkillWeaponHealth rows={state.skill_weapon_requirements}/>} {state?.error&&<p className="notice">{state.error}</p>}
    <button className="secondary" disabled={busy||!auth.user} onClick={async()=>{setBusy(true);try{const r=await authenticatedFetch('/api/sync',{method:'POST'});const body=await r.json() as {error?:string;message?:string};if(!r.ok)throw Error(body.error??'Flyff synchronization unavailable.');setMessage(body.message??'Version check requested.');lastRefresh.current=0;await refresh(true);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>{busy?'Checking…':'Check for Data Update'}</button>
    <p className="muted">Hourly version checks trigger a full refresh only when the official version changes. Failed syncs retain the previous dataset. Sign in to request a manual check. Status refreshes when opened and at most once per minute on return.</p>{message&&<p role="status">{message}</p>}
  </section>;
}

