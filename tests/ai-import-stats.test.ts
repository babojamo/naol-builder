import test from 'node:test';import assert from 'node:assert/strict';
import {importedBaseStats} from '../lib/imported-stats';

test('AI screenshot import uses assigned points instead of equipped displayed totals',()=>{
 const result=importedBaseStats({stats:{str:20,sta:20,dex:20,int:428},allocatedStats:{str:0,sta:0,dex:0,int:344}});
 assert.deepEqual(result,{stats:{str:15,sta:15,dex:15,int:359},known:true});
});

test('AI screenshot import recovers legacy allocation from the saved review warning',()=>{
 const result=importedBaseStats({stats:{str:20,sta:20,dex:20,int:428},warnings:['The stat panel displays INT 428 with an additional blue 344; only the primary displayed stat is recorded.']});
 assert.deepEqual(result,{stats:{str:15,sta:15,dex:15,int:359},known:true});
});

test('AI screenshot import defaults unreadable allocations to base stats without inventing points',()=>{
 const result=importedBaseStats({stats:{str:20,sta:20,dex:20,int:428},warnings:[]});
 assert.deepEqual(result,{stats:{str:15,sta:15,dex:15,int:15},known:false});
});
