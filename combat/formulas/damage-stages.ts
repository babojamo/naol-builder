export interface HealthConditionalDamageContext {
  targetHealthPercent?: number;

  muransWrathRate?: number;
  ankousHarvestRate?: number;

  pvp?: boolean;
}

export function resolveHealthConditionalDamage(
  context: HealthConditionalDamageContext,
) {
  const targetHealthPercent = Math.min(
    100,
    Math.max(
      0,
      context.targetHealthPercent ?? 100,
    ),
  );

  const pvpScale = context.pvp ? 0.5 : 1;

  const muransWrathRate =
    Math.abs(targetHealthPercent - 100) < 1e-9
      ? (context.muransWrathRate ?? 0) * pvpScale
      : 0;

  const ankousHarvestRate =
    targetHealthPercent < 25
      ? (context.ankousHarvestRate ?? 0) * pvpScale
      : 0;

  return {
    targetHealthPercent,
    muransWrathRate,
    ankousHarvestRate,
  };
}

/**
 * Rates run on aggregate hand damage with floor behavior at each stage.
 *
 * Reference order:
 *
 * PvE/PvP
 * -> target-health conditional
 * -> incoming damage
 * -> boss damage
 * -> final reduction
 */
export function finalizeDamage(
  damage: number,
  modeRate: number,
  incomingRate: number,
  bossRate: number,
  reductionRate: number,
  conditional: HealthConditionalDamageContext = {},
) {
  const afterMode =
    damage +
    Math.floor(damage * modeRate / 100);

  const health =
    resolveHealthConditionalDamage(conditional);

  const healthConditionalRate =
    health.muransWrathRate +
    health.ankousHarvestRate;

  const afterHealthConditional =
    afterMode +
    Math.floor(
      afterMode *
        healthConditionalRate /
        100,
    );

  const afterIncoming =
    afterHealthConditional +
    Math.floor(
      afterHealthConditional *
        Math.max(-50, incomingRate) /
        100,
    );

  const afterBoss =
    afterIncoming +
    Math.floor(
      afterIncoming *
        bossRate /
        100,
    );

  const final = Math.max(
    0,
    afterBoss -
      Math.floor(
        afterBoss *
          Math.min(50, reductionRate) /
          100,
      ),
  );

  return {
    afterMode,

    targetHealthPercent:
      health.targetHealthPercent,

    muransWrathRate:
      health.muransWrathRate,

    ankousHarvestRate:
      health.ankousHarvestRate,

    afterHealthConditional,

    afterIncoming,
    afterBoss,
    final,
  };
}

