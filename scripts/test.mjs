import { build } from 'esbuild';import { spawnSync } from 'node:child_process';import {mkdirSync} from 'node:fs';
const suites=['combat','equipment-support','accessory-performance','item-rules','fashion-weapon','ai-import-stats','auth-refresh'];mkdirSync('work',{recursive:true});await build({entryPoints:suites.map(x=>'tests/'+x+'.test.ts'),outdir:'work/tests',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},target:'node22'});const r=spawnSync(process.execPath,['--test',...suites.map(x=>'work/tests/'+x+'.test.mjs')],{stdio:'inherit'});process.exit(r.status??1);


