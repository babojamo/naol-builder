import test from 'node:test';
import assert from 'node:assert/strict';

import {
  finalizeDamage,
} from '../combat/formulas/damage-stages';

import {
  resolveWeaponEffects,
} from '../lib/weapon-effects';

import type {
  CharacterBuild,
  GameData,
} from '../lib/model';

test(
  "Muran's Wrath applies at exactly full HP",
  () => {
    const result = finalizeDamage(
      1000,
      0,
      0,
      0,
      0,
      {
        targetHealthPercent: 100,
        muransWrathRate: 11,
      },
    );

    assert.equal(
      result.afterHealthConditional,
      1110,
    );

    assert.equal(
      result.muransWrathRate,
      11,
    );
  },
);

test(
  "Muran's Wrath does not apply below full HP",
  () => {
    const result = finalizeDamage(
      1000,
      0,
      0,
      0,
      0,
      {
        targetHealthPercent: 99.99,
        muransWrathRate: 11,
      },
    );

    assert.equal(
      result.afterHealthConditional,
      1000,
    );
  },
);

test(
  "Muran's Wrath is halved in PvP",
  () => {
    const result = finalizeDamage(
      1000,
      0,
      0,
      0,
      0,
      {
        targetHealthPercent: 100,
        muransWrathRate: 10,
        pvp: true,
      },
    );

    assert.equal(
      result.muransWrathRate,
      5,
    );

    assert.equal(
      result.afterHealthConditional,
      1050,
    );
  },
);

test(
  "Ankou's Harvest activates below 25%",
  () => {
    const result = finalizeDamage(
      1000,
      0,
      0,
      0,
      0,
      {
        targetHealthPercent: 24.99,
        ankousHarvestRate: 10,
      },
    );

    assert.equal(
      result.afterHealthConditional,
      1100,
    );
  },
);

test(
  "Ankou's Harvest does not activate at exactly 25%",
  () => {
    const result = finalizeDamage(
      1000,
      0,
      0,
      0,
      0,
      {
        targetHealthPercent: 25,
        ankousHarvestRate: 10,
      },
    );

    assert.equal(
      result.afterHealthConditional,
      1000,
    );
  },
);

test(
  'Conch-style Waterbomb skillchance is recognized as an AoE proc',
  () => {
    const data = {
      item: [
        {
          id: 1,
          name: 'Test Staff',
          description: '',
          category: 'weapon',
          subcategory: 'staff',
          rarity: 'ultimate',
          level: 150,
          element: 'none',

          abilities: [
            {
              parameter:
                'skillchance',
              add: 9,
              addMax: 13,
              rate: true,
              skill: 11389,
            },
          ],
        },
      ],

      skill: [
        {
          id: 11389,
          name: 'Waterbomb',
          description: '',
          icon: '',
          level: 1,
          target: 'target',
          levels: [],
        },
      ],
    } as unknown as GameData;

    const build = {
      equipment: {
        rightHand: {
          itemId: 1,
          element: 'none',
          elementUpgrade: 0,
          awake: null,
          piercings: [],

          baseStatRolls: [
            {
              abilityIndex: 0,
              value: 11,
            },
          ],
        },
      },
    } as unknown as CharacterBuild;

    const effects =
      resolveWeaponEffects(
        build,
        data,
      );

    const waterbomb =
      effects.find(
        effect =>
          effect.skillId ===
          11389,
      );

    assert.ok(waterbomb);

    assert.equal(
      waterbomb.type,
      'trigger-skill',
    );

    assert.equal(
      waterbomb.probability,
      11,
    );

    assert.equal(
      waterbomb.targetScope,
      'surrounding-targets',
    );

    /*
     * Important:
     * it is recognized but deliberately
     * NOT folded into single-target DPS.
     */
    assert.equal(
      waterbomb.supported,
      false,
    );
  },
);
