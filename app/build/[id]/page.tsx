import Laboratory from '../../../components/Laboratory';
export default async function BuildPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Laboratory sharedId={id}/>;}
