export type NumericBounds={min?:number;max?:number;step?:number|'any';integer?:boolean};
export type NumericCommit={kind:'valid';value:number}|{kind:'incomplete'|'invalid'};
export function parseNumericDraft(text:string,{min=-Infinity,max=Infinity,step='any',integer=false}:NumericBounds={}):NumericCommit{
 const raw=text.trim();if(!raw||raw==='-'||raw==='+'||raw==='.'||raw==='-.'||raw==='+.')return {kind:'incomplete'};
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))return {kind:'invalid'};
 let value=Number(raw);if(!Number.isFinite(value)||integer&&!Number.isInteger(value))return {kind:'invalid'};
 value=Math.min(max,Math.max(min,value));
 if(step!=='any'&&step>0){const base=Number.isFinite(min)?min:0;value=Number((base+Math.round((value-base)/step)*step).toPrecision(14));value=Math.min(max,Math.max(min,value));}
 if(integer&&!Number.isInteger(value))return {kind:'invalid'};return {kind:'valid',value};
}
export function numericEditAction(text:string,previous:number|null,action:'commit'|'escape',bounds:NumericBounds={}){if(action==='escape')return {value:previous,committed:false};const parsed=parseNumericDraft(text,bounds);return parsed.kind==='valid'?{value:parsed.value,committed:true}:{value:previous,committed:false};}
export function stepNumericDraft(text:string,previous:number|null,direction:1|-1,bounds:NumericBounds={}){const parsed=parseNumericDraft(text,bounds),start=parsed.kind==='valid'?parsed.value:previous??bounds.min??0,step=bounds.step==='any'?1:bounds.step??1;return parseNumericDraft(String(start+direction*step),bounds);}
