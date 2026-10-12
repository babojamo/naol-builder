import {supabaseClient} from '../supabase/client';import type {Tables,Json} from '../supabase/database.types';
export type Profile=Tables<'profiles'>;
export const profileRepository={
 async get(id:string){const {data,error}=await supabaseClient().from('profiles').select('*').eq('id',id).single();if(error)throw error;return data;},
 async update(id:string,name:string,username:string){if(name.trim().length<2||name.trim().length>60||!/^[a-zA-Z0-9_]{3,24}$/.test(username))throw Error('Use a name of 2–60 characters and username of 3–24 letters, numbers or underscores.');const {error}=await supabaseClient().from('profiles').update({name:name.trim(),username:username.toLowerCase()}).eq('id',id);if(error)throw Error(error.code==='23505'?'That username is already taken.':error.message);},
 async sendVerification(){const {data,error}=await supabaseClient().functions.invoke('send-verification-email',{body:{}});if(error)throw Error(await functionError(error));return data;},
 async verify(token:string){const {data,error}=await supabaseClient().functions.invoke('verify-email',{body:{token}});if(error)throw Error(await functionError(error));return data;},
};
async function functionError(error:{message:string;context?:unknown}){if(error.context instanceof Response){try{const body=await error.context.json() as {error?:string};return body.error??error.message;}catch{}}return error.message;}
export const preferencesRepository={
 async get(){const {data,error}=await supabaseClient().from('user_preferences').select('preferences').maybeSingle();if(error)throw error;return data?.preferences??{};},
 async save(preferences:Json){const {data,error:authError}=await supabaseClient().auth.getUser();if(authError||!data.user)throw Error('Sign in to save account preferences.');const {error}=await supabaseClient().from('user_preferences').upsert({user_id:data.user.id,preferences});if(error)throw error;},
};
