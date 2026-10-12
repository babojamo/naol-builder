import {admin,reply,user,cors} from '../_shared/runtime.ts';

const MODEL='gpt-6-luna';
const slots=['rightHand','leftHand','helmet','suit','gauntlets','boots','shield','ring1','ring2','earring1','earring2','necklace','fashionHead','fashionSuit','fashionGloves','fashionShoes','mask','cloak','raisedPet'] as const;
const confidence={type:'string',enum:['high','medium','low']};
const nullableNumber={type:['number','null']};
const nullableString={type:['string','null']};
const fieldConfidence={type:'array',items:{type:'object',properties:{field:{type:'string'},confidence},required:['field','confidence'],additionalProperties:false}};
const equipment={type:'array',items:{type:'object',properties:{slot:{type:'string',enum:[...slots]},itemName:nullableString,itemIdCandidate:nullableNumber,normalUpgrade:nullableNumber,ultimateUpgrade:nullableNumber,element:{type:'string',enum:['none','fire','water','wind','electricity','earth','unknown']},elementUpgrade:nullableNumber,piercing:nullableNumber,ultimateJewels:{type:'array',items:{type:'string'}},runes:{type:'array',items:{type:'string'}},baseAbilities:{type:'array',items:{type:'string'}},randomStats:{type:'array',items:{type:'string'}},statScrollStat:nullableString,weaponBonus:{type:'object',properties:{skillName:nullableString,parameter:nullableString,value:nullableNumber},required:['skillName','parameter','value'],additionalProperties:false},fashionBlessings:{type:'array',items:{type:'object',properties:{source:{type:'string',enum:['goddess','demon','unknown']},parameter:{type:'string'},value:{type:'number'},confidence},required:['source','parameter','value','confidence'],additionalProperties:false}},confidence,fieldConfidences:fieldConfidence},required:['slot','itemName','itemIdCandidate','normalUpgrade','ultimateUpgrade','element','elementUpgrade','piercing','ultimateJewels','runes','baseAbilities','randomStats','statScrollStat','weaponBonus','fashionBlessings','confidence','fieldConfidences'],additionalProperties:false}};
const schema={type:'object',properties:{character:{type:'object',properties:{name:nullableString,className:nullableString,classId:nullableNumber,level:nullableNumber,stats:{type:'object',properties:{str:nullableNumber,sta:nullableNumber,dex:nullableNumber,int:nullableNumber},required:['str','sta','dex','int'],additionalProperties:false},allocatedStats:{type:'object',properties:{str:nullableNumber,sta:nullableNumber,dex:nullableNumber,int:nullableNumber},required:['str','sta','dex','int'],additionalProperties:false},displayedStats:{type:'array',items:{type:'object',properties:{parameter:{type:'string'},value:{type:'number'},confidence},required:['parameter','value','confidence'],additionalProperties:false}}},required:['name','className','classId','level','stats','allocatedStats','displayedStats'],additionalProperties:false},equipment,skills:{type:'array',items:{type:'object',properties:{name:{type:'string'},level:nullableNumber,confidence},required:['name','level','confidence'],additionalProperties:false}},buffs:{type:'array',items:{type:'object',properties:{name:{type:'string'},level:nullableNumber,confidence},required:['name','level','confidence'],additionalProperties:false}},unresolved:{type:'array',items:{type:'object',properties:{description:{type:'string'},possibleMatches:{type:'array',items:{type:'string'}},confidence},required:['description','possibleMatches','confidence'],additionalProperties:false}},warnings:{type:'array',items:{type:'string'}}},required:['character','equipment','skills','buffs','unresolved','warnings'],additionalProperties:false};
const instructions=`Extract only information visibly present in the Flyff Universe screenshots. For character.stats, copy the primary values beside STR/STA/DEX/INT exactly as displayed; these are observed totals, not build allocations. For character.allocatedStats, copy the adjacent blue assigned-point values for each stat (0 is valid); return null when unreadable or no allocation panel is visible. Never put a displayed total such as INT 428 into allocatedStats. The builder uses base 15 plus allocated points and keeps displayed totals for comparison. Never infer missing levels, equipment, blessings, awake sources, or build recommendations. Return null or empty arrays when unseen. Treat each screenshot together as evidence from one character. Distinguish base item abilities, random item stats, stat scroll stats, weapon bonus/skill awake, ultimate bonuses/jewels/runes, elements, and fashion blessings. Electric Shock Damage +23% belongs in weaponBonus.skillName/value, never randomStats or jewels. Blessing source must be unknown unless the screenshot explicitly identifies Goddess or Demon. Preserve text as read and mark uncertain readings low confidence. Do not fabricate item IDs; set itemIdCandidate null unless an authoritative ID is directly visible. Mask blessings must not be invented.`;
type ImageInput={mimeType:string;data:string};
function readImages(value:unknown):ImageInput[]{if(!Array.isArray(value)||value.length<1||value.length>8)throw Error('Submit between 1 and 8 screenshots.');let total=0;return value.map(x=>{if(!x||typeof x!=='object')throw Error('Invalid image input.');const i=x as Record<string,unknown>;if(!['image/png','image/jpeg','image/webp'].includes(String(i.mimeType))||typeof i.data!=='string'||i.data.length>7_000_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(i.data))throw Error('Use PNG, JPEG, or WebP screenshots, each under 5 MB.');total+=i.data.length;if(total>28_000_000)throw Error('Combined screenshot size is too large.');return {mimeType:i.mimeType as string,data:i.data};});}
function outputText(payload:Record<string,unknown>):string{if(typeof payload.output_text==='string')return payload.output_text;const output=payload.output;if(Array.isArray(output))for(const item of output as Record<string,unknown>[]){if(item.type==='message'&&Array.isArray(item.content)){for(const part of item.content as Record<string,unknown>[])if(part.type==='output_text'&&typeof part.text==='string')return part.text;}}throw Error('Vision model returned no structured result.');}
async function quota(userId:string){const db=admin();const {data,error}=await db.from('ai_user_quotas').select('usage_used,usage_limit,ai_enabled').eq('user_id',userId).maybeSingle();if(error)throw error;return data??{usage_used:0,usage_limit:2,ai_enabled:true};}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  const signed = await user(request);
  if (!signed) return reply({ error: 'Sign in to use AI Character Import.' }, 401);
  if (request.method === 'GET') {
    try {
      const q = await quota(signed.id);
      return reply({ used: q.usage_used, limit: q.usage_limit, remaining: Math.max(0, q.usage_limit - q.usage_used), enabled: q.ai_enabled });
    } catch {
      return reply({ error: 'AI usage status is temporarily unavailable.' }, 503);
    }
  }
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey?.trim()) return reply({ error: 'AI Character Import is not configured yet.' }, 503);
  let reservation: string | undefined;
  let stage = 'request';
  let providerStatus = 0;
  const db = admin();
  try {
    const text = await request.text();
    if (text.length > 30_000_000) throw Error('Combined screenshot size is too large.');
    const input = JSON.parse(text) as { images?: unknown };
    const images = readImages(input.images);
    stage = 'quota_reservation';
    const { data: reserved, error: reserveError } = await db.rpc('reserve_ai_build_usage', { p_user_id: signed.id, p_image_count: images.length, p_model: MODEL });
    if (reserveError) throw Object.assign(new Error(reserveError.message), { code: reserveError.code });
    reservation = reserved?.[0]?.import_id;
    if (!reservation) throw Error('Unable to reserve AI usage.');
    stage = 'openai_request';
    const content = [
      { type: 'input_text', text: instructions },
      ...images.map((image) => ({ type: 'input_image', image_url: `data:${image.mimeType};base64,${image.data}`, detail: 'high' })),
    ];
    const requestBody = {
      model: MODEL,
      store: false,
      reasoning: { effort: 'none' },
      max_output_tokens: 10000,
      input: [{ role: 'user', content }],
      text: { format: { type: 'json_schema', name: 'flyff_character_import', strict: true, schema } },
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) {
      providerStatus = response.status;
      const errorPayload = await response.json().catch(() => ({})) as { error?: { code?: string; type?: string } };
      console.error('AI import provider request failed', JSON.stringify({ status: response.status, code: errorPayload.error?.code ?? null, type: errorPayload.error?.type ?? null }));
      throw Object.assign(new Error('The AI provider rejected the analysis request.'), { code: 'openai_request_failed' });
    }
    const payload = await response.json() as Record<string, unknown>;
    const draft = JSON.parse(outputText(payload));
    if (!draft || typeof draft !== 'object' || !Array.isArray((draft as Record<string, unknown>).equipment)) throw Error('Vision model returned an invalid character draft.');
    stage = 'save_result';
    const completed = await db.rpc('complete_ai_build_import', { p_import_id: reservation, p_result: draft, p_normalized: null });
    if (completed.error) throw completed.error;
    const q = await quota(signed.id);
    return reply({ importId: reservation, model: MODEL, draft, usage: { used: q.usage_used, limit: q.usage_limit, remaining: Math.max(0, q.usage_limit - q.usage_used) } });
  } catch (error) {
    const code = (error as { code?: string }).code ?? 'analysis_failed';
    if (reservation) {
      const refunded = await db.rpc('refund_ai_build_import', { p_import_id: reservation, p_error_code: code, p_error_message: `${stage}: ${(error as Error).message}` });
      if (refunded.error) console.error('AI import refund failed', JSON.stringify({ stage, code: refunded.error.code }));
    }
    const message = (error as Error).message;
    console.error('AI import failed', JSON.stringify({ stage, code, providerStatus: providerStatus || null }));
    if (message.includes('No AI imports') || message.includes('disabled') || message === 'Submit between 1 and 8 screenshots.') return reply({ error: message }, message.includes('No AI imports') ? 429 : 403);
    if (message.includes('screenshot') || message.includes('PNG')) return reply({ error: message }, 400);
    if (code === 'openai_request_failed') return reply({ error: providerStatus === 401 || providerStatus === 403 ? 'OpenAI rejected the configured API key or project access.' : providerStatus === 429 ? 'OpenAI is rate limited or the API project has no available balance.' : `OpenAI rejected the request (HTTP ${providerStatus}). No AI usage was consumed.` }, 502);
    return reply({ error: `AI import failed during ${stage.replaceAll('_', ' ')}. No AI usage was consumed.`, code }, 503);
  }
});
