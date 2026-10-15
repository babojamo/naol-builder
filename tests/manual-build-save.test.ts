import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
import {localBuilds} from '../lib/persistence';import fixture from './fixtures/pve-dps-reference.json';

const source=ts.createSourceFile('useBuildStorage.ts',readFileSync('components/useBuildStorage.ts','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
function calls(root:ts.Node,name:string){const found:ts.CallExpression[]=[];const visit=(node:ts.Node)=>{if(ts.isCallExpression(node)&&node.expression.getText(source)===name)found.push(node);ts.forEachChild(node,visit);};visit(root);return found;}
function variable(name:string){let found:ts.VariableDeclaration|undefined;const visit=(node:ts.Node)=>{if(ts.isVariableDeclaration(node)&&node.name.getText(source)===name)found=node;ts.forEachChild(node,visit);};visit(source);assert.ok(found,'Missing '+name);return found;}
function enclosingAction(node:ts.Node){for(let parent=node.parent;parent;parent=parent.parent)if(ts.isVariableDeclaration(parent))return parent.name.getText(source);return '';}

test('hydration, edits, focus rerenders and new workspace setup have no automatic build writes',()=>{
 for(const effect of [...calls(source,'useEffect'),...calls(source,'useLayoutEffect')]){assert.equal(calls(effect,'writeDraft').length,0);assert.equal(calls(effect,'localStorage.setItem').length,0);assert.equal(calls(effect,'persist').length,0);}
 for(const name of ['prepare','newWorkspace','reloadCloud']){assert.equal(calls(variable(name),'writeDraft').length,0);assert.equal(calls(variable(name),'localStorage.setItem').length,0);}
});
test('draft snapshots are written only through explicit Save handlers',()=>{
 const writes=calls(source,'writeDraft');assert.ok(writes.length>0);
 for(const write of writes){let node:ts.Node=write;const owners:string[]=[];while(node.parent){node=node.parent;if(ts.isVariableDeclaration(node))owners.push(node.name.getText(source));}assert.ok(owners.includes('persist')||owners.includes('save'),owners.join(' → '));}
 for(const write of calls(source,'localStorage.setItem'))assert.ok(['writeDraft','save'].includes(enclosingAction(write)));
});
test('pending cloud Save persists the requested snapshot, never newer unsaved edits',()=>{
 const persist=variable('persist'),writes=calls(persist,'writeDraft');assert.equal(writes.length,2);for(const write of writes)assert.equal(write.arguments[0].getText(source),'clean');
 const save=variable('save').getText(source);assert.match(save,/snapshot\.current\.editSerial===requestedSerial/);assert.match(save,/snapshot\.current\.auth\.user\?\.id===owner/);
});
test('reading legacy/offline saved builds is read-only and does not create migration backups',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),storage=new Map<string,string>([['naol-builds',JSON.stringify([fixture.build])],['naol-offline-builds','[]']]),writes:string[]=[];
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>{writes.push(key);storage.set(key,value);}}});
 try{const original=storage.get('naol-builds');assert.equal(localBuilds().length,1);assert.equal(localBuilds()[0].id,fixture.build.id);assert.deepEqual(writes,[]);assert.equal(storage.get('naol-builds'),original);}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
test('leave-page warning does not promise that uncommitted edits were stored',()=>{const text=readFileSync('components/Laboratory.tsx','utf8');assert.ok(text.includes('Your changes have not been saved.'));assert.ok(text.includes('Continue without saving'));assert.ok(!text.includes('Leave with local draft'));assert.ok(text.includes("window.addEventListener('beforeunload'"));});
