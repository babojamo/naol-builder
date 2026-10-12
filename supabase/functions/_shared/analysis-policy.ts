type Schema={type?:string|string[];enum?:unknown[];properties?:Record<string,Schema>;required?:string[];additionalProperties?:boolean;items?:Schema};
/** Validate the entire strict model contract, not merely the equipment array. */
export function matchesSchema(value:unknown,schema:Schema):boolean{
 const types=Array.isArray(schema.type)?schema.type:[schema.type];
 const type=value===null?'null':Array.isArray(value)?'array':typeof value;
 if(!types.includes(type)||schema.enum&&!schema.enum.includes(value))return false;
 if(type==='number')return Number.isFinite(value);
 if(type==='array')return !!schema.items&&(value as unknown[]).every(x=>matchesSchema(x,schema.items!));
 if(type==='object'){
  const object=value as Record<string,unknown>,properties=schema.properties??{};
  return (schema.required??[]).every(key=>Object.hasOwn(object,key))&&Object.entries(object).every(([key,item])=>properties[key]?matchesSchema(item,properties[key]):schema.additionalProperties!==false);
 }
 return true;
}
export function shouldRefundAnalysis(hasValidResult:boolean){return !hasValidResult;}
/** Persistence can be retried without another provider call or quota reservation. */
export async function persistAnalysis(write:()=>Promise<{error:unknown}>,attempts=3){
 let error:unknown;
 for(let attempt=0;attempt<attempts;attempt++){try{const result=await write();if(!result.error)return {saved:true,error:null};error=result.error;}catch(failure){error=failure;}}
 return {saved:false,error};
}
