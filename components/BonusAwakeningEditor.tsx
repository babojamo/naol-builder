'use client';
import {useId} from 'react';
import {Info} from 'lucide-react';
import {Field} from './Controls';
import {skillAwakeOptions,parameterAwakeOptions,validWeaponBonus,isParameterAwakeRate} from '../lib/skill-awake';
import type {CharacterBuild,GameData,Gear,Item,WeaponBonus} from '../lib/model';

const help='Bonus Awakening is the special bonus found naturally on Weapons/Shields or rolled using Scroll of Weapon Bonus, Scroll of Shield Bonus, or Scroll of Bonus. Available skills and values depend on the item type, level and rarity.';
const parameterNames:Record<string,string>={healing:'Healing',block:'Block',reflectdamage:'Reflect Damage',magicdefense:'Magic Defense',criticalresist:'Critical Resist',firedefense:'Fire Resistance',waterdefense:'Water Resistance',winddefense:'Wind Resistance',electricitydefense:'Electricity Resistance',earthdefense:'Earth Resistance',bleedandpoisonresist:'Bleed and Poison Resist'};
export default function BonusAwakeningEditor({item,gear,character,gameData,onChange}:{item:Item;gear:Gear;character:CharacterBuild;gameData:GameData;onChange:(bonus:WeaponBonus|undefined)=>void}){
 const helpId=useId(),skills=skillAwakeOptions(item,gameData,character),parameters=parameterAwakeOptions(item,gameData);
 if(item.category!=='weapon'&&!(item.category==='armor'&&item.subcategory==='shield'))return null;
 const bonus=gear.weaponBonus??(gear.skillAwake?{type:'skill' as const,skillId:gear.skillAwake.skillId,value:gear.skillAwake.value}:undefined);
 const valid=!bonus||validWeaponBonus(item,gameData,character,bonus),empty=!skills.length&&!parameters.length;
 const skillName=(id:number)=>gameData.skill.find(x=>x.id===id)?.name??'Unknown skill';
 const parameterName=(key:string)=>parameterNames[key]??key;
 const name=bonus?.type==='skill'?skillName(bonus.skillId)+' Damage':bonus?.type==='parameter'?parameterName(bonus.parameter):'';
 const values=bonus?.type==='skill'?skills.find(x=>x.id===bonus.skillId)?.values??[]:bonus?.type==='parameter'?parameters.find(x=>x.parameter===bonus.parameter)?.values??[]:[];
 const unit=bonus?.type==='skill'||(bonus?.type==='parameter'&&isParameterAwakeRate(bonus.parameter))?'%':'';
 const choose=(next:WeaponBonus|undefined)=>{if(!next||validWeaponBonus(item,gameData,character,next))onChange(next);};
 return <section className="bonus-awakening-editor" aria-label="Bonus Awakening">
  <div className="bonus-awakening-heading"><h4>BONUS AWAKENING</h4><span className="bonus-awakening-help"><button type="button" className="quiet" aria-label="About Bonus Awakening" aria-describedby={helpId}><Info size={16}/></button><span id={helpId} role="tooltip">{help}</span></span></div>
  <p>Special Weapon/Shield bonus from drops or Bonus Scrolls.</p>
  <div className="bonus-awakening-current"><span>Current Bonus</span><strong>{bonus?`${name} +${bonus.value}${unit}`:'None'}</strong>{bonus&&<button type="button" className="quiet" onClick={()=>choose(undefined)}>Clear Bonus</button>}</div>
  {!valid&&<p className="notice">This saved bonus is unavailable for the selected item or character. Choose a valid result or clear it.</p>}
  {empty?<p className="notice">No valid Bonus Awakening values were found for this item in the current Flyff data.</p>:<>
   <Field label="Bonus Type"><select value={bonus?.type??'none'} onChange={e=>{const type=e.target.value;if(type==='skill'&&skills[0])choose({type:'skill',skillId:skills[0].id,value:skills[0].values[0]});else if(type==='parameter'&&parameters[0])choose({type:'parameter',parameter:parameters[0].parameter,value:parameters[0].values[0]});else if(type==='none')choose(undefined);}}>
    <option value="none">No Bonus Awakening</option>{(skills.length>0||bonus?.type==='skill')&&<option value="skill" disabled={!skills.length}>Skill Bonus</option>}{(parameters.length>0||bonus?.type==='parameter')&&<option value="parameter" disabled={!parameters.length}>Parameter Bonus</option>}
   </select></Field>
   {bonus?.type==='skill'&&<Field label="Skill"><select value={bonus.skillId} onChange={e=>{const option=skills.find(x=>x.id===Number(e.target.value));if(option)choose({type:'skill',skillId:option.id,value:option.values.includes(bonus.value)?bonus.value:option.values[0]});}}>
    {!skills.some(x=>x.id===bonus.skillId)&&<option value={bonus.skillId} disabled>{skillName(bonus.skillId)} · unavailable</option>}{skills.map(x=><option key={x.id} value={x.id}>{skillName(x.id)}</option>)}
   </select></Field>}
   {bonus?.type==='parameter'&&<Field label="Parameter"><select value={bonus.parameter} onChange={e=>{const option=parameters.find(x=>x.parameter===e.target.value);if(option)choose({type:'parameter',parameter:option.parameter,value:option.values.includes(bonus.value)?bonus.value:option.values[0]});}}>
    {!parameters.some(x=>x.parameter===bonus.parameter)&&<option value={bonus.parameter} disabled>{parameterName(bonus.parameter)} · unavailable</option>}{parameters.map(x=><option key={x.parameter} value={x.parameter}>{parameterName(x.parameter)}</option>)}
   </select></Field>}
   {bonus&&<Field label="Value"><select value={bonus.value} onChange={e=>choose({...bonus,value:Number(e.target.value)})}>{!values.includes(bonus.value)&&<option value={bonus.value} disabled>+{bonus.value}{unit} · unavailable</option>}{values.map(value=><option key={value} value={value}>+{value}{unit}</option>)}</select></Field>}
  </>}
  <small>Also known as Weapon Bonus / Skill Awake. Selecting a result replaces the previous bonus; this simulator does not consume scrolls.</small>
 </section>;
}
