export type ImportedStatKey='str'|'sta'|'dex'|'int';
export type ImportedBaseStats=Record<ImportedStatKey,number>;
export function importedBaseStats(character:{stats?:Partial<Record<ImportedStatKey,number|null>>;allocatedStats?:Partial<Record<ImportedStatKey,number|null>>;warnings?:string[]}):{stats:ImportedBaseStats;known:boolean}{
 const stats:ImportedBaseStats={str:15,sta:15,dex:15,int:15};let known=false;
 for(const key of ['str','sta','dex','int'] as const){const value=character.allocatedStats?.[key];if(typeof value==='number'&&Number.isFinite(value)&&value>=0){stats[key]=15+Math.floor(value);known=true;}}
 for(const warning of character.warnings??[]){for(const match of warning.matchAll(/\b(STR|STA|DEX|INT)\s+\d+\s+with an additional blue\s+(\d+)/gi)){const key=match[1].toLowerCase() as ImportedStatKey;if(stats[key]===15){stats[key]=15+Number(match[2]);known=true;}}}
 return {stats,known};
}
