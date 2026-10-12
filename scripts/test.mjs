import { build } from 'esbuild';import { spawnSync } from 'node:child_process';import {mkdirSync} from 'node:fs';
mkdirSync('work',{recursive:true});await build({entryPoints:['tests/combat.test.ts','tests/equipment-support.test.ts','tests/accessory-performance.test.ts'],outdir:'work/tests',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},target:'node22'});const r=spawnSync(process.execPath,['--test','work/tests/combat.test.mjs','work/tests/equipment-support.test.mjs','work/tests/accessory-performance.test.mjs'],{stdio:'inherit'});process.exit(r.status??1);

