import type {CharacterBuild,GameData} from './model';
export interface CalibrationFixture{id:string;name:string;classId:number;level:number;build:CharacterBuild;observedStats:Record<string,number>;notes?:string;source?:string;}
export function createClassCalibrationFixture(input:Omit<CalibrationFixture,'classId'> & {className:string},data:Pick<GameData,'class'>):CalibrationFixture{const found=data.class.find(x=>x.name===input.className);if(!found)throw Error('Unknown calibration class: '+input.className);const {className,...fixture}=input;void className;return {...fixture,classId:found.id,build:{...structuredClone(fixture.build),classId:found.id,level:fixture.level}};}

