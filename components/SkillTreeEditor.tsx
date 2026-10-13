'use client';

import {useId,useState} from 'react';
import {
  classProgression,
  getSkillTree,
  canSelectSimulationSkill,
  selectSimulationSkill,
  skillPrerequisiteReview,
} from '../lib/skill-tree';
import {maxSkillLevel} from '../lib/ringmaster-buffs';
import {formatSkillWeaponRequirement,canUseSkillWithEquipment} from '../lib/skill-weapons';
import {abilitySummary,durationLabel} from '../lib/active-items';
import {
  getActiveSelfBuffForFamily,
  getConfiguredSkillLevel,
  getSimulationSkillSelection,
  isPlayerFacingSelfBuffSkill,
  removeSelfBuffFamily,
  setSelfBuff,
  skillFamilyRootId,
} from '../lib/skill-usage';
import {Icon,NumericInput} from './Controls';
import type {CharacterBuild,GameData,Skill} from '../lib/model';

export default function SkillTreeEditor({
  build:b,
  data:d,
  update,
}:{
  build:CharacterBuild;
  data:GameData;
  update:(b:CharacterBuild,label:string)=>void;
}){
  const simulation=getSimulationSkillSelection(b,d);
  const [classId,setClassId]=useState(b.classId);
  const [detailId,setDetailId]=useState<number|null>(simulation?.id??null);
  const [previewLevels,setPreviewLevels]=useState<Record<number,number>>({});
  const arrowId=useId().replace(/:/g,'');

  const progression=classProgression(b.classId,d);
  const tree=getSkillTree(classId,d);
  const selected=d.skill.find(skill=>skill.id===(detailId??tree.normal[0]?.id??tree.skills[0]?.id));
  const positioned=tree.normal.filter(skill=>skill.treePosition);
  const unpositioned=tree.normal.filter(skill=>!skill.treePosition);
  const coords=new Map(positioned.map(skill=>[
    skill.id,
    {x:skill.treePosition!.x*2.6+40,y:skill.treePosition!.y*7+40},
  ]));
  const width=Math.max(420,...[...coords.values()].map(value=>value.x+140));
  const height=Math.max(170,...[...coords.values()].map(value=>value.y+100));

  const selectedConfigured=selected?getConfiguredSkillLevel(selected.id,b,d):null;
  const level=selected?selectedConfigured??previewLevels[selected.id]??1:1;
  const max=selected?maxSkillLevel(selected):1;
  const levelData=selected?.levels.find(row=>row.level===level);
  const prerequisites=selected?skillPrerequisiteReview(selected,b,d):[];

  const selfBuffRoot=selected&&isPlayerFacingSelfBuffSkill(selected)?skillFamilyRootId(selected,d):null;
  const activeSelf=selfBuffRoot!==null?getActiveSelfBuffForFamily(b,d,selfBuffRoot):null;

  const setLevel=(value:number)=>{
    if(!selected)return;
    setPreviewLevels(previous=>({...previous,[selected.id]:value}));

    if(simulation?.id===selected.id&&canSelectSimulationSkill(selected,b,d)){
      update(selectSimulationSkill(b,selected,value,d),'Simulation skill level');
      return;
    }

    if(selected.passive&&b.skills.some(row=>row.id===selected.id)){
      update({...b,skills:b.skills.map(row=>row.id===selected.id?{...row,level:value}:row)},'Passive skill level');
      return;
    }

    if(activeSelf?.id===selected.id){
      update(setSelfBuff(b,selected,value,d),'Self buff level');
    }
  };

  const card=(skill:Skill,position?:{x:number;y:number})=>{
    const configured=getConfiguredSkillLevel(skill.id,b,d)??0;
    const locked=skill.level>b.level;
    const weaponUnavailable=!canUseSkillWithEquipment(skill,b,d);
    const simulating=simulation?.id===skill.id;
    const family=isPlayerFacingSelfBuffSkill(skill)?skillFamilyRootId(skill,d):null;
    const activeBuff=family!==null?getActiveSelfBuffForFamily(b,d,family):null;
    const active=activeBuff?.id===skill.id;

    return <button
      type="button"
      className={
        'tree-skill '
        +(simulating?'simulation-selected ':'')
        +(active?'selected ':'')
        +(selected?.id===skill.id?'inspected ':'')
        +(locked||weaponUnavailable?'locked':'')
      }
      key={skill.id}
      style={position?{position:'absolute',left:position.x,top:position.y}:undefined}
      onClick={()=>setDetailId(skill.id)}
      aria-pressed={selected?.id===skill.id}
      aria-label={skill.name+` · configured ${configured}/${maxSkillLevel(skill)}`}
      title={`${skill.name}\nRequired character level ${skill.level}\nWeapon: ${formatSkillWeaponRequirement(skill.weapon)}\n${skill.description}`}
    >
      <Icon kind="skill" file={skill.icon} name={skill.name}/>
      <strong>{skill.name}</strong>
      <small>
        {configured} / {maxSkillLevel(skill)}
        {locked?' · Lv'+skill.level:weaponUnavailable?' · weapon unavailable':simulating?' · simulating':active?' · active buff':''}
      </small>
    </button>;
  };

  return <section className="skill-tree-editor">
    <div className="section-heading">
      <h3>Official class tree</h3>
      <span className="tiny-tag">Advanced</span>
    </div>

    <div className="class-progression" role="tablist" aria-label="Class progression">
      {progression.map(classRow=><button
        role="tab"
        aria-selected={classId===classRow.id}
        className={(classId===classRow.id?'selected ':'')+(classRow.id===b.classId?'current-class':'')}
        key={classRow.id}
        onKeyDown={event=>{
          if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
          event.preventDefault();
          const index=progression.findIndex(row=>row.id===classRow.id);
          const next=event.key==='Home'?0:event.key==='End'?progression.length-1:(index+(event.key==='ArrowRight'?1:-1)+progression.length)%progression.length;
          setClassId(progression[next].id);
          setDetailId(null);
          (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next])?.focus();
        }}
        onClick={()=>{setClassId(classRow.id);setDetailId(null);}}
      >
        <Icon kind="class" file={classRow.icon} name={classRow.name}/>
        {classRow.name}
        {classRow.id===b.classId&&<small>Current</small>}
      </button>)}
    </div>

    <div className="skill-tree-layout">
      <div>
        <h3>{d.class.find(row=>row.id===classId)?.name}</h3>

        {positioned.length>0&&<div className="skill-tree-scroll">
          <div className="skill-tree-canvas" style={{width,height}}>
            <svg width={width} height={height} aria-hidden="true">
              <defs>
                <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z"/>
                </marker>
              </defs>
              {tree.connections.map((edge,index)=>{
                const from=coords.get(edge.from)!;
                const to=coords.get(edge.to)!;
                return <path
                  key={index}
                  d={`M ${from.x+50} ${from.y+80} L ${to.x+50} ${to.y}`}
                  markerEnd={`url(#${arrowId})`}
                />;
              })}
            </svg>
            {positioned.map(skill=>card(skill,coords.get(skill.id)))}
          </div>
        </div>}

        {unpositioned.length>0&&<>
          <p className="muted">These skills have no API tree position; no connection is invented.</p>
          <div className="skill-card-grid">{unpositioned.map(skill=>card(skill))}</div>
        </>}

        {tree.variations.length>0&&<>
          <h3>Master Variations</h3>
          <div className="skill-card-grid">{tree.variations.map(skill=>card(skill))}</div>
        </>}

        {tree.passives.length>0&&<>
          <h3>Passive Skills</h3>
          <div className="skill-card-grid">{tree.passives.map(skill=>card(skill))}</div>
        </>}
      </div>

      <aside className="skill-detail-panel" aria-live="polite">
        {!selected&&<p>Select a skill to inspect its official requirements and effects.</p>}
        {selected&&<>
          <h3>{selected.name}</h3>
          <Icon kind="skill" file={selected.icon} name={selected.name}/>
          <p>{selected.description}</p>
          <p>
            Configured Level {selectedConfigured??0} / {max}
            {simulation?.id===selected.id?' · Selected for simulation':''}
            {activeSelf?.id===selected.id?' · Active self buff':''}
          </p>

          <div className="skill-level-controls">
            <button className="secondary" aria-label="Decrease skill level" disabled={level<=1} onClick={()=>setLevel(level-1)}>−</button>
            <NumericInput aria-label="Skill detail level" integer min={1} max={max} value={level} onChange={setLevel}/>
            <button className="secondary" aria-label="Increase skill level" disabled={level>=max} onClick={()=>setLevel(level+1)}>+</button>
            <button className="secondary" onClick={()=>setLevel(max)}>MAX</button>
          </div>

          <dl>
            <div><dt>Required job</dt><dd>{d.class.find(row=>row.id===selected.class)?.name??'Any'}</dd></div>
            <div><dt>Required character level</dt><dd>{selected.level}</dd></div>
            <div><dt>Required weapon</dt><dd>{formatSkillWeaponRequirement(selected.weapon)}</dd></div>
            <div><dt>Target</dt><dd>{selected.target}</dd></div>
            <div><dt>Element</dt><dd>{selected.element??selected.elementType??'None'}</dd></div>
            <div><dt>Skill points per level</dt><dd>{selected.skillPoints??'Not specified'}</dd></div>
            <div><dt>MP / FP</dt><dd>{String(levelData?.consumedMP??'—')} / {String(levelData?.consumedFP??'—')}</dd></div>
            <div><dt>Casting / cooldown</dt><dd>{levelData?.casting??'—'} / {String(b.mode==='pvp'?levelData?.cooldownPVP??levelData?.cooldown??'—':levelData?.cooldown??'—')} sec</dd></div>
            <div><dt>Duration</dt><dd>{durationLabel(typeof (b.mode==='pvp'?levelData?.durationPVP??levelData?.duration:levelData?.duration)==='number'?(b.mode==='pvp'?levelData?.durationPVP??levelData?.duration:levelData?.duration) as number:undefined)}</dd></div>
          </dl>

          <h4>Prerequisites</h4>
          {prerequisites.length?<ul>{prerequisites.map(req=><li key={req.skill}>
            {req.name} Lv{req.level} · {req.configuredLevel!==null&&req.configuredLevel>=req.level?'Configured':'Not recorded · verify in game'}
          </li>)}</ul>:<p>None reported by API.</p>}

          <h4>Abilities at reviewed level</h4>
          <p>{abilitySummary([...(selected.abilities??[]),...(levelData?.abilities??[])])||'No direct stat abilities. The skill may use a dedicated combat mechanic.'}</p>

          {!canUseSkillWithEquipment(selected,b,d)&&<p className="notice" role="alert">
            This skill needs {formatSkillWeaponRequirement(selected.weapon)}. Equip compatible gear to use it.
          </p>}
          {selected.level>b.level&&<p className="notice">Requires character Lv{selected.level}.</p>}

          {selected.passive&&<button
            className="secondary"
            disabled={selected.level>b.level||!canUseSkillWithEquipment(selected,b,d)}
            onClick={()=>update(
              {...b,skills:b.skills.some(row=>row.id===selected.id)
                ?b.skills.filter(row=>row.id!==selected.id)
                :[...b.skills.filter(row=>d.skill.find(skill=>skill.id===row.id)?.passive),{id:selected.id,level}]},
              'Configured passive skill',
            )}
          >
            {b.skills.some(row=>row.id===selected.id)?'Remove Passive':'Configure Passive'}
          </button>}

          {!selected.passive&&isPlayerFacingSelfBuffSkill(selected)&&selfBuffRoot!==null&&<button
            className={activeSelf?.id===selected.id?'secondary':'primary'}
            disabled={selected.level>b.level||!canUseSkillWithEquipment(selected,b,d)}
            onClick={()=>update(
              activeSelf?.id===selected.id
                ?removeSelfBuffFamily(b,d,selfBuffRoot)
                :setSelfBuff(b,selected,level,d),
              activeSelf?.id===selected.id?'Removed self buff':'Activated self buff',
            )}
          >
            {activeSelf?.id===selected.id?'Deactivate Self Buff':activeSelf?'Use This Variation':'Activate Self Buff'}
          </button>}

          {!selected.passive&&!isPlayerFacingSelfBuffSkill(selected)&&<button
            className="primary"
            disabled={!canSelectSimulationSkill(selected,b,d)}
            onClick={()=>update(selectSimulationSkill(b,selected,level,d),'Selected simulation skill')}
          >
            Use for Simulation
          </button>}
        </>}
      </aside>
    </div>
  </section>;
}


