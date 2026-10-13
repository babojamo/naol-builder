import test from 'node:test';import assert from 'node:assert/strict';
import classes from '../data/class.json';import upgrades from '../data/upgradelevelbonus.json';
import {createBuild,gear,type GameData,type Item,type Skill,type Target} from '../lib/model';
import {calculate} from '../combat/attack';
// Controlled API-shaped weapons/skills isolate numeric stages; class/upgrade rows
// are actual API data. Constants were calculated independently from pinned
// 8911624 reference equations, not generated using NAOL helpers.
const target:Target={id:1,name:'Controlled giant',level:105,hp:20000,defense:100,magicDefense:100,dex:30,parry:120,block:20,criticalResist:20,element:'none',rank:'giant',resistFire:.7,resistWater:.2};
function fixture(family='sword',magic=false){
 const c=classes.find(x=>x.name===(family==='sword'?'Blade':'Arcanist'))!;
 const item:Item={id:1,name:'Controlled weapon',description:'',icon:'',category:'weapon',subcategory:family,level:60,rarity:'unique',minAttack:100,maxAttack:100,additionalSkillDamage:3,element:'none',attackSpeedValue:0};
 const skill:Skill={id:9001,name:'Controlled damage skill',description:'',icon:'',class:c.id,level:60,weapon:family,magic,element:magic?'fire':'none',elementType:magic?'fire':'none',target:'enemy',levels:[{level:1,minAttack:10,maxAttack:10,casting:1,scalingParameters:[{stat:magic?'int':'str',parameter:'attack',scale:.5,add:true}]}]};
 const d={class:classes,item:[item,{...item,id:2,minAttack:80,maxAttack:80}],monster:[target],skill:[skill],equipset:[],upgradelevelbonus:upgrades,statawake:[],skillawake:{},raisedpet:[],dungeon:[],version:1,syncedAt:''} as unknown as GameData;
 const b=createBuild(d);b.classId=c.id;b.level=family==='sword'?100:165;b.baseStats={str:100,sta:30,dex:100,int:100};b.equipment={rightHand:{...gear(1),normalUpgrade:4}};b.targetId=1;b.bonuses=[{parameter:'attack',add:10,rate:true},{parameter:'attack',add:7},{parameter:'damage',add:9},{parameter:family+'attack',add:11},{parameter:'minability',add:2},{parameter:'maxability',add:2},{parameter:'pvedamage',add:5},{parameter:'pvedamage',add:20,rate:true},{parameter:'pvpdamage',add:10,rate:true},{parameter:'bossmonsterdamage',add:10,rate:true},{parameter:'autoattackdamage',add:15,rate:true}];
 return {b,d,skill};
}
const close=(value:number,expected:number)=>assert.ok(Math.abs(value-expected)<1e-9,`${value} != ${expected}`);
test('physical monster auto: complete rate, flat, defense, level, crit and block pipeline',()=>{
 const {b,d}=fixture(),r=calculate(b,d),s=r.calculationStages;
 assert.equal(r.stats.rightAttack.rawMin,812);assert.equal(s.weaponMin,118);assert.equal(s.weaponMax,118);close(r.stats.internalAttackSpeed,.9412389380530973);
 assert.equal(s.basePowerMin,812);assert.equal(s.ratedAttackMin,893);assert.equal(s.attackBeforeDefense,905);assert.equal(s.defense,100);assert.equal(s.postDefenseMin,621);assert.equal(s.element,1);assert.equal(s.levelMultiplier,.87);
 assert.equal(r.normal,819);assert.equal(r.criticalMin,900);assert.equal(r.criticalMax,1146);assert.equal(r.hit,.63);assert.equal(r.crit,.08);assert.equal(r.block,.06);close(s.mode,1.1484);close(r.expected,500.9915232);
});
test('dual wield: main/off/main/both aggregate before mode rates, off-hand exactly once',()=>{
 const {b,d}=fixture();b.equipment.leftHand={...gear(2),normalUpgrade:4};b.bonuses.push({parameter:'lefthanddamage',add:10,rate:true});const r=calculate(b,d);
 assert.deepEqual(r.cycle,['main','off','main','both']);assert.equal(r.calculationStages.offhand,.85);
 assert.equal(r.stats.leftAttack?.rawMin,769);assert.equal(r.leftNormalMin,493);assert.deepEqual(r.cycleRanges.map(x=>x.normalMin),[819,650,819,1469]);assert.equal(r.normal,939.25);
 assert.equal(r.critical,1173.875);close(r.expected,574.5820752);
});
test('elemental physical auto applies power and defense relationship before post-defense resistance',()=>{
 const {b,d}=fixture();b.equipment.rightHand!.element='water';b.equipment.rightHand!.elementUpgrade=4;const r=calculate(b,d,{...target,element:'fire'});
 close(r.calculationStages.autoElementPower,1.1048);close(r.element,.88384);assert.equal(r.calculationStages.ratedAttackMin,986);assert.equal(r.calculationStages.attackBeforeDefense,998);assert.equal(r.calculationStages.effectiveDefenseMin,110);assert.equal(r.calculationStages.postDefenseMin,686);assert.equal(r.calculationStages.afterElement,548);assert.equal(r.normal,722);assert.equal(r.critical,903.5);close(r.expected,.63*(.92*722+.08*903.5)*.952);
});
test('wand MAGIC branch bypasses physical hit and block, retains wand criticals',()=>{
 const {b,d}=fixture('wand');const t={...target,level:165,parry:1000,block:100};const r=calculate(b,d,t);
 close(r.stats.internalAttackSpeed,.7479699248120302);assert.equal(r.calculationStages.weaponMin,118);close(r.calculationStages.basePowerMin,498.6);assert.equal(r.defense,15);assert.equal(r.calculationStages.postDefenseMin,483);assert.equal(r.normal,732);assert.equal(r.criticalRange.min,2.3);assert.equal(r.hit,1);assert.equal(r.block,0);assert.equal(r.effectiveRangedBlock,0);close(r.expected,808.24);
});
test('physical PvP auto separates defense, PvP factor, mode and reduction',()=>{
 const {b,d}=fixture();b.mode='pvp';b.opponent={...target,rank:'player',level:100,pvpReduction:15};const r=calculate(b,d);
 assert.equal(r.defense,60);assert.equal(r.calculationStages.attackBeforeDefense,900);assert.equal(r.calculationStages.postDefenseMin,690);assert.equal(r.calculationStages.levelMultiplier,1);assert.equal(r.normal,445);assert.equal(r.criticalMin,489);assert.equal(r.criticalMax,623);assert.equal(r.hit,.52);assert.equal(r.block,.2375);assert.equal(r.crit,.08);close(r.expected,196.779674);
});
function skillFixture(magic=false){const result=fixture(magic?'staff':'sword',magic),{b,skill}=result;b.attackType='skill';b.skills=[{id:skill.id,level:1}];b.equipment.rightHand!.weaponBonus={type:'skill',skillId:skill.id,value:25};b.bonuses.push({parameter:'skilldamage',add:20,rate:true});if(magic){b.equipment.rightHand!.element='water';b.buffs=[{id:12579,level:1}];b.bonuses.push({parameter:'thirdjobskilldamage',add:30,rate:true},{parameter:'magicattack',add:20,rate:true},{parameter:'watermastery',add:30,rate:true});}return result;}
test('physical skill: additional weapon damage, scaling, compatibility and awake after defense',()=>{
 const {b,d}=skillFixture(),r=calculate(b,d);assert.equal(r.calculationStages.basePowerMin,282);assert.equal(r.calculationStages.combinedAttackRate,30);assert.equal(r.calculationStages.attackBeforeDefense,378);assert.equal(r.defense,15);assert.equal(r.calculationStages.postDefenseMin,313);assert.equal(r.calculationStages.skillFactor,1.25);assert.equal(r.hit,1);assert.equal(r.crit,0);assert.equal(r.block,0);assert.equal(r.expected,448);
 const incompatible={...d,item:d.item.map(x=>({...x,subcategory:'wand'}))};assert.equal(calculate(b,incompatible).expected,0);
});
test('magic PvE: Infusion resolves water resistance and mastery before damage stages',()=>{
 const {b,d}=skillFixture(true),r=calculate(b,d);assert.equal(r.effectiveElement,'water');close(r.element,.88);assert.equal(r.calculationStages.basePowerMin,439);assert.equal(r.calculationStages.combinedAttackRate,60);assert.equal(r.calculationStages.attackBeforeDefense,714);assert.equal(r.defense,100);assert.equal(r.calculationStages.postDefenseMin,457);assert.equal(r.calculationStages.afterElement,401);assert.equal(r.expected,661);
 const original=calculate({...b,buffs:[]},d);assert.equal(original.effectiveElement,'fire');close(original.element,.27);assert.ok(original.expected<r.expected);
});
test('magic PvP: magicdefense rate reduces incoming attack, def rate scales class defense',()=>{
 const {b,d}=skillFixture(true),other=fixture().b;b.mode='pvp';b.opponentBuild={...other,equipment:{},bonuses:[{parameter:'waterdefense',add:20,rate:true},{parameter:'magicdefense',add:5},{parameter:'magicdefense',add:20,rate:true},{parameter:'def',add:10,rate:true},{parameter:'pvpdamagereduction',add:15,rate:true}]};b.opponent={...target,rank:'player',level:100};const r=calculate(b,d);
 assert.equal(r.defense,186);assert.equal(r.calculationStages.magicDefenseRate,20);close(r.calculationStages.incomingMagicAttack,567.2);close(r.calculationStages.postDefenseMin,238.2);assert.equal(r.calculationStages.afterElement,209);assert.equal(r.expected,146);
});
test('inherited master formula index and parent Weapon Bonus survive full magic pipeline',()=>{
 const {b,d,skill}=skillFixture(true);const parent={...skill,id:9000,masterVariations:[skill.id],levels:Array.from({length:10},(_,i)=>({...skill.levels[0],level:i+1}))};const inherited={...skill,inheritSkill:parent.id};const data={...d,skill:[parent,inherited]};b.equipment.rightHand!.weaponBonus={type:'skill',skillId:parent.id,value:25};const r=calculate(b,data);assert.equal(r.calculationStages.basePowerMin,663);assert.equal(r.calculationStages.attackBeforeDefense,1072);assert.equal(r.calculationStages.postDefenseMin,767);assert.equal(r.calculationStages.afterElement,674);assert.equal(r.expected,1111);
});
