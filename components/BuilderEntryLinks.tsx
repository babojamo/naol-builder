import Link from 'next/link';import {builderRoute,builderBuildRoute,newBuildRoute} from '../lib/routes';
export function BuilderHomeLinks(){return <><Link className="brand" href={builderRoute()}>NAOL <em>Build</em></Link><Link href={builderRoute()}>Back to Builder</Link></>;}
export function BuildOpenLink({id}:{id:string}){return <Link className="primary" href={builderBuildRoute(id)}>Open</Link>;}
export function NewBuildLink(){return <Link className="primary" href={newBuildRoute()}>+ New Build</Link>;}
