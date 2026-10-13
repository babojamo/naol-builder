'use client';
import RaisedPetEditor from './RaisedPetEditor';
import BuffsEditor from './BuffsEditor';
import SkillsQuickSetup from './SkillsQuickSetup';
import type {CharacterBuild,GameData} from '../lib/model';

export default function SkillsEditor({
  build,
  data,
  update,
  tab,
}:{
  build:CharacterBuild;
  data:GameData;
  update:(b:CharacterBuild,label:string)=>void;
  tab:string;
}){
  if(tab==='Pets')return <RaisedPetEditor build={build} data={data} update={update}/>;
  if(tab==='Buffs')return <BuffsEditor build={build} data={data} update={update}/>;
  return <SkillsQuickSetup key={build.id+':'+build.classId} build={build} data={data} update={update}/>;
}

