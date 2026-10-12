/** Signed post-defense damage. Callers decide whether a specific attack clamps it. */
export function postDefenseDamage(attack:number,defense:number){const denominator=defense+2*attack,blend=defense>0&&denominator>1?Math.sqrt(defense/denominator):0;return attack-Math.floor(defense+(attack-defense)*blend);}
