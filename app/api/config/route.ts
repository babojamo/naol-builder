import {publicConfiguration} from '../../../lib/supabase/server';
export function GET(){try{return Response.json(publicConfiguration(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Account service configuration is unavailable.'},{status:503});}}
