'use client';
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
import {numericEditAction,stepNumericDraft,type NumericBounds} from '../lib/numeric-input';
export type NumericInputProps=Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'value'|'onChange'|'min'|'max'|'step'> & NumericBounds & {value:number|null;onChange:(value:number)=>void;onEmpty?:()=>void};
export default function NumericInput({value,onChange,onEmpty,min,max,step='any',integer=false,...props}:NumericInputProps){
 const format=(n:number|null)=>n===null?'':String(n),[draft,setDraft]=useState(format(value)),editing=useRef(false),original=useRef(value),skipBlur=useRef(false);
 // Synchronize external values only when the user is not constructing a number.
 useEffect(()=>{if(!editing.current)setDraft(format(value));},[value]);
 const commit=()=>{if(!draft.trim()&&onEmpty){onEmpty();setDraft('');return;}const result=numericEditAction(draft,value,'commit',{min,max,step,integer});setDraft(format(result.value));if(result.committed&&result.value!==null&&result.value!==value)onChange(result.value);};
 return <input {...props} type="text" role="spinbutton" inputMode={integer?'numeric':'decimal'} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value??undefined} value={draft}
  onFocus={e=>{editing.current=true;original.current=value;skipBlur.current=false;props.onFocus?.(e);}}
  onChange={e=>setDraft(e.target.value)}
  onBlur={e=>{editing.current=false;if(skipBlur.current)skipBlur.current=false;else commit();props.onBlur?.(e);}}
  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();skipBlur.current=true;e.currentTarget.blur();}else if(e.key==='Escape'){e.preventDefault();setDraft(format(original.current));skipBlur.current=true;e.currentTarget.blur();}else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const result=stepNumericDraft(draft,value,e.key==='ArrowUp'?1:-1,{min,max,step,integer});if(result.kind==='valid'){setDraft(String(result.value));if(result.value!==value)onChange(result.value);}}props.onKeyDown?.(e);}}/>;
}
