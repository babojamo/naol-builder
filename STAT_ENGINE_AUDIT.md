# Final character stat engine audit

| Mechanic | Canonical source | Confidence | Defect found | Final action |
| --- | --- | --- | --- | --- |
| Ability names | `data/ability-parameters.json` | Verified | Engine used legacy boss/attribute names | Central resolver accepts old saves and emits API keys |
| Modifier provenance | Items, sets, upgrades, awakenings, skills, buffs, pets, fashion | Verified inputs | Flat abilities erased their origin | Added source, operation, slot, identity, and confidence records |
| Flat/rate/set stacking | Embedded API ability fields | Estimated order | Helpers did not share canonical semantics | Centralized set, flat, then rate application |
| HP/MP/FP | Class API expressions | Verified inputs | Formula identity was hidden | Kept restricted parser and exposed class formula details |
| Movement/action/attack speed | API parameters and class attack speed | Mixed | Bonuses were shown as final values | Movement/action display from 100%; attack speed stays separate |
| Block | Class coefficient and API modifiers | Estimated | Melee block could be applied twice | One foundation; generic, melee, ranged, and PvP additions stay separate |
| Accessories | API upgrade snapshots | Verified inputs | Risk of duplicate application | Apply the selected snapshot once per legal slot |
| Ultimate accessories | Persisted user/import state | Unsupported | No authoritative roll table | Preserve and label; exclude from totals |
| Ultimate weapons | API item/socket rules | Mixed | Source attribution missing | Active validated sockets and bonuses are source-labeled |
| Equipment eligibility | API ancestry, level, sex, hand rules | Verified inputs | AI matching was name-only | Filter candidates through canonical legality before similarity |
| AI screenshot stats | Visible evidence | Observed | Totals could be confused with allocations | Keep observed values comparison-only |
| Calibration | Class-scoped fixtures | Experimental | Controls appeared in normal builder | Move controls to admin and isolate fixtures |

No global coefficient was tuned to force one screenshot to match. Differences remain visible with possible missing-source notes.
