// Restricted arithmetic parser: no eval, properties, calls or assignments.
export function expression(input:string,variables:Record<string,number>):number{
 if(input.length>1000)throw new Error('Formula too long');
 const tokens=input.match(/\d+(?:\.\d+)?|[a-zA-Z]+|[()+*/\-]/g)??[];
 if(tokens.join('')!==input.replace(/\s/g,''))throw new Error('Unsupported formula syntax');
 let i=0,depth=0;
 function atom():number{if(++depth>40)throw new Error('Formula nesting limit');const t=tokens[i++];let v:number;if(t==='('){v=sum();if(tokens[i++]!==')')throw new Error('Unclosed parenthesis');}else if(t==='-')v=-atom();else if(t==='+')v=atom();else if(/^\d/.test(t??''))v=Number(t);else if(Object.hasOwn(variables,t??''))v=variables[t];else throw new Error('Unknown variable: '+t);depth--;return v;}
 function product():number{let v=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=atom();v=op==='*'?v*b:v/b;}return v;}
 function sum():number{let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
 const v=sum();if(i!==tokens.length||!Number.isFinite(v))throw new Error('Invalid formula');return v;
}
