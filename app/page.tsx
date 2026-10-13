import Laboratory from '../components/Laboratory';
import {resolveBuilderLaunch} from '../lib/routes';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const launch=resolveBuilderLaunch(await searchParams);return <Laboratory key={launch.mode==='open'?launch.buildId:launch.mode} requestedBuildId={launch.mode==='open'?launch.buildId:undefined} startNew={launch.mode==='new'}/>;}
