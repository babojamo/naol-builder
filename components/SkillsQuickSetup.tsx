'use client';

import {useState} from 'react';
import SkillTreeEditor from './SkillTreeEditor';
import {Field,Icon,NumberField} from './Controls';
import {abilitySummary,durationLabel} from '../lib/active-items';
import {catalogSkill} from '../lib/catalog-index';
import {maxSkillLevel} from '../lib/ringmaster-buffs';
import {formatSkillWeaponRequirement} from '../lib/skill-weapons';
import {
  analyzeSelfBuffSkill,
  clearPassives,
  getActiveSelfBuffForFamily,
  getEligibleDamageSkills,
  getEligiblePassiveSkills,
  getSelfBuffFamilies,
  getSimulationSkillSelection,
  removeSelfBuffFamily,
  setMaxPassives,
  setSelfBuff,
  setSimulationSkill,
  skillLevelAbilities,
} from '../lib/skill-usage';
import type {CharacterBuild,GameData} from '../lib/model';

export default function SkillsQuickSetup({
  build:b,
  data:d,
  update,
}:{
  build:CharacterBuild;
  data:GameData;
  update:(b:CharacterBuild,label:string)=>void;
}){
  const simulation=getSimulationSkillSelection(b,d);
  const simulationSkill=catalogSkill(d,simulation?.id);
  const damageSkills=getEligibleDamageSkills(b,d);
  const families=getSelfBuffFamilies(b,d);
  const passives=getEligiblePassiveSkills(b,d);
  const configuredPassiveIds=new Set(b.skills.filter(row=>catalogSkill(d,row.id)?.passive).map(row=>row.id));
  const [variantChoice,setVariantChoice]=useState<Record<number,number>>({});

  const chooseDamage=(id:number)=>{
    const skill=catalogSkill(d,id);
    if(!skill)return;
    update(setSimulationSkill(b,skill,maxSkillLevel(skill),d),'Selected simulation skill');
  };

  return <section className="panel skills-quick-setup">
    <div className="section-heading">
      <div>
        <span className="eyebrow">SKILL SETUP</span>
        <h2>Skills</h2>
      </div>
      <span className="tiny-tag">Simple setup</span>
    </div>

    <p className="muted">
      Pick one attack to simulate, then switch on the self buffs you actually use.
      Passive skills are configured separately. The full official tree is still available below.
    </p>

    <section className="skill-setup-section">
      <div className="section-heading">
        <h3>1. Damage simulation</h3>
        <span className="tiny-tag">{b.attackType==='auto'?'Auto attack':'Single skill'}</span>
      </div>

      <div className="buff-preset-actions">
        <button
          type="button"
          className={b.attackType==='auto'?'primary':'secondary'}
          aria-pressed={b.attackType==='auto'}
          onClick={()=>update({...b,attackType:'auto'},'Auto attack simulation')}
        >
          Auto Attack
        </button>
        <button
          type="button"
          className={b.attackType==='skill'?'primary':'secondary'}
          aria-pressed={b.attackType==='skill'}
          onClick={()=>update({...b,attackType:'skill'},'Skill simulation')}
        >
          Skill
        </button>
      </div>

      {b.attackType==='skill'&&<>
        <Field label="Skill to simulate">
          <select
            value={simulation?.id??''}
            onChange={event=>chooseDamage(Number(event.target.value))}
          >
            <option value="">Choose a compatible damage skill…</option>
            {damageSkills.map(skill=><option key={skill.id} value={skill.id}>
              {d.class.find(row=>row.id===skill.class)?.name??'Any'} · {skill.name}
            </option>)}
          </select>
        </Field>

        {simulationSkill&&simulation&&<div className="skill-row">
          <Icon kind="skill" file={simulationSkill.icon} name={simulationSkill.name}/>
          <div>
            <strong>{simulationSkill.name}</strong>
            <small>{simulationSkill.description}</small>
            <small>
              Weapon: {formatSkillWeaponRequirement(simulationSkill.weapon)}
              {' · '}
              {simulationSkill.elementType??simulationSkill.element??'No element'}
            </small>
          </div>
          <NumberField
            integer
            step={1}
            label="Skill level"
            min={1}
            max={maxSkillLevel(simulationSkill)}
            value={simulation.level}
            onChange={level=>update(setSimulationSkill(b,simulationSkill,level,d),'Simulation skill level')}
          />
        </div>}

        {!damageSkills.length&&<p className="notice">
          No compatible damage skills are available with the current class, level and equipped weapon.
        </p>}
      </>}
    </section>

    <section className="skill-setup-section">
      <div className="section-heading">
        <h3>2. Active self buffs</h3>
        <span className="tiny-tag">{(b.selfBuffs??[]).length} active</span>
      </div>
      <p className="muted">
        These are skills cast on your own character. They are separate from external RM/support buffs.
        Enabling a buff uses MAX level by default; you can lower it afterward.
      </p>

      {!families.length&&<p className="muted">No compatible self buffs were found for the current class and weapon.</p>}

      <div className="self-buff-list">
        {families.map(family=>{
          const active=getActiveSelfBuffForFamily(b,d,family.rootId);
          const chosenId=variantChoice[family.rootId]??active?.id??family.skills[0].id;
          const chosen=catalogSkill(d,chosenId)??family.skills[0];
          const max=maxSkillLevel(chosen);
          const level=active?.id===chosen.id?active.level:max;
          const coverage=analyzeSelfBuffSkill(chosen,d,level);
          const effects=skillLevelAbilities(chosen,level);
          const levelData=chosen.levels.find(row=>row.level===level);
          const enabled=active?.id===chosen.id;

          return <article className={'self-buff-card '+(enabled?'selected':'')} key={family.rootId}>
            <div className="skill-row">
              <Icon kind="skill" file={chosen.icon} name={chosen.name}/>
              <div>
                <strong>{family.rootName}</strong>
                {chosen.name!==family.rootName&&<small>Variation: {chosen.name}</small>}
                <small>{abilitySummary(effects)||'Special effect; see coverage note.'}</small>
                <small>
                  Duration: {durationLabel(typeof levelData?.duration==='number'?levelData.duration:undefined)}
                  {' · '}
                  Weapon: {formatSkillWeaponRequirement(chosen.weapon)}
                </small>
                <small className={coverage.status==='supported'?'muted':'notice'}>
                  Coverage: {coverage.status}
                  {coverage.notes.length?' · '+coverage.notes.join(' '):''}
                </small>
              </div>
              <button
                type="button"
                className={enabled?'primary':'secondary'}
                aria-pressed={enabled}
                onClick={()=>{
                  if(enabled)update(removeSelfBuffFamily(b,d,family.rootId),'Removed self buff');
                  else update(setSelfBuff(b,chosen,max,d),'Activated self buff');
                }}
              >
                {enabled?'Active':'Activate'}
              </button>
            </div>

            {family.skills.length>1&&<Field label="Variation">
              <select
                value={chosen.id}
                onChange={event=>{
                  const id=Number(event.target.value);
                  setVariantChoice(previous=>({...previous,[family.rootId]:id}));
                  const next=catalogSkill(d,id);
                  if(active&&next)update(setSelfBuff(b,next,maxSkillLevel(next),d),'Changed self buff variation');
                }}
              >
                {family.skills.map(skill=><option key={skill.id} value={skill.id}>{skill.name}</option>)}
              </select>
            </Field>}

            {enabled&&<NumberField
              integer
              step={1}
              label="Active level"
              min={1}
              max={max}
              value={level}
              onChange={nextLevel=>update(setSelfBuff(b,chosen,nextLevel,d),'Self buff level')}
            />}
          </article>;
        })}
      </div>
    </section>

    <section className="skill-setup-section">
      <div className="section-heading">
        <h3>3. Passive skills</h3>
        <span className="tiny-tag">{configuredPassiveIds.size}/{passives.length} configured</span>
      </div>
      <div className="buff-preset-actions">
        <button
          type="button"
          className="primary"
          disabled={!passives.length}
          onClick={()=>update(setMaxPassives(b,d),'Applied max passives')}
        >
          Max Passives
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!configuredPassiveIds.size}
          onClick={()=>update(clearPassives(b,d),'Cleared passives')}
        >
          Clear Passives
        </button>
      </div>
      {configuredPassiveIds.size>0&&<p className="muted">
        {[...configuredPassiveIds].map(id=>catalogSkill(d,id)?.name??`Skill #${id}`).join(' · ')}
      </p>}
      <p className="muted">
        Conditional/passive mechanics that need HP, stacks or other combat state remain visible in the advanced tree and should not be assumed to be fully simulated unless Data Health marks their effects supported.
      </p>
    </section>

    <details className="formula-details">
      <summary>Advanced official skill tree</summary>
      <SkillTreeEditor build={b} data={d} update={update}/>
    </details>
  </section>;
}
