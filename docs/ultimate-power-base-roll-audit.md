# Ultimate Power and Ultimate weapon calculation audit

2026-10-13 · Current main · direct production update, no preview.

## A. Existing Ultimate attack calculation

Ultimate attack scaling was already implemented. Both auto attacks and skill weapon power select API upgrade row 10 + Ultimate level and apply its weaponAttack percentage once. The shared getWeaponAttackUpgrade helper now owns that mapping. No additional multiplier was introduced; existing additive upgrade attack and combat pipeline order are unchanged.

## B. Current mapping

| Ultimate | API row | weaponAttack | Coefficient |
|---|---|---|---|
| +0 | 10 | 24 | 1.24 |
| +1 | 11 | 27 | 1.27 |
| +2 | 12 | 30 | 1.30 |
| +3 | 13 | 33 | 1.33 |
| +4 | 14 | 36 | 1.36 |
| +5 | 15 | 39 | 1.39 |
| +6 | 16 | 41 | 1.41 |
| +7 | 17 | 43 | 1.43 |
| +8 | 18 | 45 | 1.45 |
| +9 | 19 | 47 | 1.47 |
| +10 | 20 | 50 | 1.50 |

Source: current data/upgradelevelbonus.json, with percentage semantics documented by the [official API](https://api.flyff.com/). API row selection and once-only application have regression coverage in both auto and skill paths at +0/+5/+6/+10. This verifies the current data contract; no independent in-game damage capture was performed.

## C. Previously missing configuration

Ranged intrinsic effects previously always contributed ability.add. They were not configurable. The selected roll now replaces that one ability amount once, while retaining rate, mode flags, conditional metadata and fixed lines. Invalid configurations use the API fallback and produce validation errors. This does not turn currently unsupported conditional proc effects into unconditional stats.

## D. Current ranged weapons

146 current weapon records have finite, differing add/addMax intrinsic abilities. Eligibility follows canonical ability ranges, independent of names and Unique/Ultimate rarity. IDs below are audit fixtures, not production eligibility rules.

| ID | Weapon | Rarity | Intrinsic ranges |
|---|---|---|---|
| 4408 | FWC Golden Lusaka's Crystal Bow | ultimate | 0: criticaldamage 58–74.8%; 1: attack 12–18%; 2: criticalchance 1.8–2.4%; 3: skillchance 5–9% (skill 6824) |
| 9319 | Lusaka's Staff | unique | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 10319 | Coral Cutlass | unique | 0: criticaldamage 49–59%; 1: criticalchance 20–23%; 2: attackspeed 14–15.5%; 3: skillchance 4–9% (skill 11389) |
| 10720 | Lusaka's Axe | ultimate | 0: maxhp 20–25%; 1: skilldamage 6–8%; 2: incomingdamage -4–-7%; 3: skillchance 4–9% (skill 9304) |
| 10906 | Lusaka's Sword | ultimate | 0: maxhp 20–25%; 1: skilldamage 6–8%; 2: sta 25–30; 3: skillchance 4–9% (skill 6824) |
| 11095 | Lusaka's Bow | unique | 0: maxhp 25–30%; 1: skilldamage 12–16%; 2: sta 25–30; 3: skillchance 4–9% (skill 6824) |
| 11124 | Song of Sirens | ultimate | 0: attack 10–15%; 1: healing 10–15%; 2: decreasedcastingtime 26–30%; 3: skillchance 4–9% (skill 11389) |
| 11510 | Lusaka's Heavy Axe | ultimate | 0: maxhp 28–35%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 11855 | Abyss | ultimate | 0: criticaldamage 52–62%; 1: criticalchance 31–34%; 2: attackspeed 8–9.5%; 3: skillchance 4–9% (skill 11389) |
| 11905 | Lusaka's Crystal Bow | unique | 0: criticaldamage 58–68%; 1: attack 12–17%; 2: criticalchance 1.8–2.2%; 3: skillchance 5–9% (skill 6824) |
| 11957 | Nautilus | ultimate | 0: criticaldamage 53–63%; 1: criticalchance 16–20%; 2: attackspeed 10–11.5%; 3: skillchance 4–9% (skill 11389) |
| 11979 | Maw of Judgement | ultimate | 0: criticaldamage 65–80.9%; 1: criticalchance 35–44.6%; 2: attackspeed 12.5–16.25%; 3: ankousharvest 5–10% |
| 12362 | Lusaka's Crystal Yo-Yo | ultimate | 0: criticaldamage 57–67%; 1: str 25–30; 2: criticalchance 18–25%; 3: skillchance 4–9% (skill 9304) |
| 12508 | Lusaka's Wand | ultimate | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 12546 | FWC Golden Lusaka's Crystal Axe | ultimate | 0: criticaldamage 55–71.5%; 1: criticalchance 18–24.2%; 2: attackspeed 11–14.3%; 3: skillchance 4–9% (skill 9304) |
| 12648 | Lusaka's Fist | ultimate | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 6824) |
| 13024 | Typhoon | unique | 0: criticaldamage 54–64%; 1: str 23–28; 2: criticalchance 16–23%; 3: skillchance 4–9% (skill 11389) |
| 13257 | Lusaka's Crystal Sword | ultimate | 0: criticaldamage 53–63%; 1: criticalchance 23–26%; 2: attackspeed 15–16.5%; 3: skillchance 4–9% (skill 6824) |
| 13529 | Nemo's Fury | ultimate | 0: criticaldamage 55–65%; 1: attack 10–15%; 2: criticalchance 1.5–2%; 3: skillchance 5–9% (skill 11389) |
| 13556 | Lusaka's Crystal Sword | unique | 0: criticaldamage 53–63%; 1: criticalchance 23–26%; 2: attackspeed 15–16.5%; 3: skillchance 4–9% (skill 6824) |
| 13630 | FWC Golden Lusaka's Crystal Yo-Yo | ultimate | 0: criticaldamage 57–73.7%; 1: str 25–33; 2: criticalchance 18–27.5%; 3: skillchance 4–9% (skill 9304) |
| 13811 | Leviathan | unique | 0: criticaldamage 59–69%; 1: criticalchance 24–28%; 2: attackspeed 13–15%; 3: skillchance 4–9% (skill 11389) |
| 13845 | Lamprey's Wand | unique | 0: attack 15–20%; 1: decreasedcastingtime 23–28%; 2: int 23–28; 3: skillchance 4–9% (skill 11389) |
| 14000 | Conch Staff | unique | 0: allelementsmastery 18–23%; 1: decreasedcastingtime 26–30%; 2: int 22–28; 3: skillchance 4–9% (skill 11389) |
| 14085 | Lamprey's Wand | ultimate | 0: attack 15–20%; 1: decreasedcastingtime 23–28%; 2: int 23–28; 3: skillchance 4–9% (skill 11389) |
| 14100 | Lusaka's Crystal Fist | unique | 0: criticaldamage 55–65%; 1: criticalchance 29–35%; 2: attackspeed 10–12.5%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 14402 | Abyss | unique | 0: criticaldamage 52–62%; 1: criticalchance 31–34%; 2: attackspeed 8–9.5%; 3: skillchance 4–9% (skill 11389) |
| 14437 | Coral Cutlass | ultimate | 0: criticaldamage 49–59%; 1: criticalchance 20–23%; 2: attackspeed 14–15.5%; 3: skillchance 4–9% (skill 11389) |
| 14684 | FWC Golden Lusaka's Crystal Staff | ultimate | 0: allelementsmastery 20–27%; 1: decreasedcastingtime 28–36%; 2: int 25–33; 3: skillchance 4–9% (skill 14967) |
| 14844 | Lusaka's Heavy Axe | unique | 0: maxhp 28–35%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 14971 | Fist of Tides | unique | 0: criticaldamage 48–58%; 1: criticalchance 28–34%; 2: attackspeed 9–11.5%; 3: skillchance 4–9% (skill 11389) |
| 15019 | Lusaka's Crystal Fist | ultimate | 0: criticaldamage 55–65%; 1: criticalchance 29–35%; 2: attackspeed 10–12.5%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 15191 | Typhoon | ultimate | 0: criticaldamage 54–64%; 1: str 23–28; 2: criticalchance 16–23%; 3: skillchance 4–9% (skill 11389) |
| 15489 | Lusaka's Heavy Sword | ultimate | 0: maxhp 28–35%; 1: sta 25–30; 2: block 8–14%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 15533 | Lusaka's Crystal Yo-Yo | unique | 0: criticaldamage 57–67%; 1: str 25–30; 2: criticalchance 18–25%; 3: skillchance 4–9% (skill 9304) |
| 15677 | Lusaka's Wand | unique | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 15714 | Lusaka's Crystal Axe | unique | 0: criticaldamage 55–65%; 1: criticalchance 18–22%; 2: attackspeed 11–13%; 3: skillchance 4–9% (skill 9304) |
| 15880 | Lusaka's Stick | unique | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 15903 | Lusaka's Crystal Wand | ultimate | 0: attack 17–22%; 1: decreasedcastingtime 25–30%; 2: int 25–30; 3: skillchance 4–9% (skill 14967) |
| 15914 | Conch Staff | ultimate | 0: allelementsmastery 18–23%; 1: decreasedcastingtime 26–30%; 2: int 22–28; 3: skillchance 4–9% (skill 11389) |
| 16014 | Nemo's Fury | unique | 0: criticaldamage 55–65%; 1: attack 10–15%; 2: criticalchance 1.5–2%; 3: skillchance 5–9% (skill 11389) |
| 16135 | Lusaka's Fist | unique | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 6824) |
| 16147 | Lusaka's Heavy Crystal Axe | ultimate | 0: criticaldamage 55–65%; 1: criticalchance 32–36%; 2: attackspeed 9–11%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 16171 | Lusaka's Crystal Axe | ultimate | 0: criticaldamage 55–65%; 1: criticalchance 18–22%; 2: attackspeed 11–13%; 3: skillchance 4–9% (skill 9304) |
| 16364 | Lusaka's Heavy Crystal Sword | unique | 0: criticaldamage 62–72%; 1: criticalchance 26–30%; 2: attackspeed 14–16%; 3: skillchance 4–9% (skill 9304) |
| 16659 | FWC Golden Lusaka's Heavy Crystal Axe | ultimate | 0: criticaldamage 55–71.5%; 1: criticalchance 32–39.6%; 2: attackspeed 9–12.1%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 16721 | Lusaka's Axe | unique | 0: maxhp 20–25%; 1: skilldamage 6–8%; 2: incomingdamage -4–-7%; 3: skillchance 4–9% (skill 9304) |
| 16906 | Fist of Tides | ultimate | 0: criticaldamage 48–58%; 1: criticalchance 28–34%; 2: attackspeed 9–11.5%; 3: skillchance 4–9% (skill 11389) |
| 16918 | Song of Sirens | unique | 0: attack 10–15%; 1: healing 10–15%; 2: decreasedcastingtime 26–30%; 3: skillchance 4–9% (skill 11389) |
| 17540 | FWC Golden Lusaka's Crystal Sword | ultimate | 0: criticaldamage 53–69.3%; 1: criticalchance 23–28.6%; 2: attackspeed 15–18.15%; 3: skillchance 4–9% (skill 6824) |
| 17625 | Lusaka's Crystal Staff | unique | 0: allelementsmastery 20–25%; 1: decreasedcastingtime 28–33%; 2: int 25–30; 3: skillchance 4–9% (skill 14967) |
| 17629 | FWC Golden Lusaka's Crystal Fist | ultimate | 0: criticaldamage 55–71.5%; 1: criticalchance 29–38.5%; 2: attackspeed 10–13.75%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 17909 | Lusaka's Bow | ultimate | 0: maxhp 25–30%; 1: skilldamage 12–16%; 2: sta 25–30; 3: skillchance 4–9% (skill 6824) |
| 17967 | FWC Golden Lusaka's Crystal Wand | ultimate | 0: attack 17–24%; 1: decreasedcastingtime 25–33%; 2: int 25–33; 3: skillchance 4–9% (skill 14967) |
| 17978 | Lusaka's Heavy Crystal Axe | unique | 0: criticaldamage 55–65%; 1: criticalchance 32–36%; 2: attackspeed 9–11%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 18022 | Lusaka's Crystal Stick | unique | 0: attack 12–17%; 1: healing 12–17%; 2: decreasedcastingtime 28–33%; 3: int 25–30 |
| 18025 | Lusaka's Heavy Sword | unique | 0: maxhp 28–35%; 1: sta 25–30; 2: block 8–14%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 18102 | Lusaka's Yo-Yo | ultimate | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 18425 | Lusaka's Crystal Bow | ultimate | 0: criticaldamage 58–68%; 1: attack 12–17%; 2: criticalchance 1.8–2.2%; 3: skillchance 5–9% (skill 6824) |
| 18617 | Lusaka's Crystal Stick | ultimate | 0: attack 12–17%; 1: healing 12–17%; 2: decreasedcastingtime 28–33%; 3: int 25–30 |
| 18619 | Lusaka's Yo-Yo | unique | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 18770 | FWC Golden Lusaka's Crystal Stick | ultimate | 0: attack 12–18%; 1: healing 12–18%; 2: decreasedcastingtime 28–36%; 3: int 25–33 |
| 18949 | Lusaka's Stick | ultimate | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 1–3% (skill 7599); 4: skillchance 1–3% (skill 7599) |
| 18993 | FWC Golden Lusaka's Heavy Crystal Sword | ultimate | 0: criticaldamage 62–79.2%; 1: criticalchance 26–33%; 2: attackspeed 14–17.6%; 3: skillchance 4–9% (skill 9304) |
| 19005 | Lusaka's Crystal Staff | ultimate | 0: allelementsmastery 20–25%; 1: decreasedcastingtime 28–33%; 2: int 25–30; 3: skillchance 4–9% (skill 14967) |
| 19108 | Lusaka's Heavy Crystal Sword | ultimate | 0: criticaldamage 62–72%; 1: criticalchance 26–30%; 2: attackspeed 14–16%; 3: skillchance 4–9% (skill 9304) |
| 19242 | Leviathan | ultimate | 0: criticaldamage 59–69%; 1: criticalchance 24–28%; 2: attackspeed 13–15%; 3: skillchance 4–9% (skill 11389) |
| 19489 | Lusaka's Staff | ultimate | 0: maxhp 25–30%; 1: sta 25–30; 2: incomingdamage -6–-10%; 3: skillchance 4–9% (skill 14967) |
| 19508 | Lusaka's Sword | unique | 0: maxhp 20–25%; 1: skilldamage 6–8%; 2: sta 25–30; 3: skillchance 4–9% (skill 6824) |
| 19761 | Lusaka's Crystal Wand | unique | 0: attack 17–22%; 1: decreasedcastingtime 25–30%; 2: int 25–30; 3: skillchance 4–9% (skill 14967) |
| 19897 | Nautilus | unique | 0: criticaldamage 53–63%; 1: criticalchance 16–20%; 2: attackspeed 10–11.5%; 3: skillchance 4–9% (skill 11389) |
| 20602 | Wand of Apparitions | ultimate | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: decreasedcastingtime 20–30% |
| 20643 | Staff of Ethereal Dreams | unique | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 10–15%; 3: pvpdamage 6–9%; 4: decreasedcastingtime 30–40% |
| 20730 | 2025 FWC Golden Lusaka's Crystal Wand | ultimate | 0: attack 17–26%; 1: decreasedcastingtime 25–35%; 2: int 25–35; 3: skillchance 4–11% (skill 14967) |
| 21023 | Specter's Axe | unique | 0: maxhp 14–18%; 1: sta 10–14; 2: pvpdamagereduction 2–4%; 3: pvpdamage 2–4%; 4: actionspeed 10–15% |
| 21481 | Knuckle of Madness | ultimate | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: pvpcriticaldamage 4–7% |
| 22576 | 2026 FWC Golden Dementia | ultimate | 0: criticaldamage 67–91.6%; 1: str 30–43; 2: criticalchance 25–35.8%; 3: muranswrath 5–17% |
| 23704 | 2026 FWC Golden Dragon's Rain | ultimate | 0: criticaldamage 68–94.3%; 1: attack 17–24.2%; 2: criticalchance 2.2–3.1%; 3: muranswrath 5–17% |
| 23879 | K Fang | ultimate | 0: criticaldamage 60–75%; 1: criticalchance 26–32.2%; 2: attackspeed 16.5–21%; 3: ankousharvest 2–5% |
| 24890 | Cursed K Fang | unique | 0: criticaldamage 53–63%; 1: criticalchance 23–26%; 2: attackspeed 15–16.5%; 3: skillchance 7–15% (skill 23893) |
| 27418 | 2026 FWC Golden Harbinger | ultimate | 0: criticaldamage 65–89%; 1: criticalchance 36–50.2%; 2: attackspeed 11–15.95%; 3: muranswrath 5–17% |
| 27942 | 2026 FWC Golden Butcher's Carnage | ultimate | 0: criticaldamage 60–82.5%; 1: criticalchance 18–28.8%; 2: attackspeed 11–16.85%; 3: ankousharvest 5–11% |
| 28306 | 2025 FWC Golden Lusaka's Crystal Stick | ultimate | 0: attack 12–20%; 1: healing 12–20%; 2: decreasedcastingtime 28–38%; 3: int 25–35 |
| 28487 | Maw of Judgement | unique | 0: criticaldamage 65–80.9%; 1: criticalchance 35–44.6%; 2: attackspeed 12.5–16.25%; 3: ankousharvest 5–10% |
| 28585 | 2025 FWC Golden Lusaka's Crystal Staff | ultimate | 0: allelementsmastery 20–29%; 1: decreasedcastingtime 28–38%; 2: int 25–35; 3: skillchance 4–11% (skill 14967) |
| 30082 | 2025 FWC Golden Lusaka's Crystal Yo-Yo | ultimate | 0: criticaldamage 57–75.7%; 1: str 25–35; 2: criticalchance 18–29.5%; 3: skillchance 4–11% (skill 9304) |
| 31445 | Sword of Whisper | unique | 0: maxhp 14–18%; 1: sta 10–14; 2: pvpdamagereduction 3–5%; 3: pvpdamage 2–3%; 4: actionspeed 5–10% |
| 31895 | Jewel of Nightmare | unique | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: attack 2–5% |
| 32550 | Mirage | unique | 0: maxhp 32–35%; 1: sta 28–38; 2: pvpdamagereduction 8–12%; 3: healing 15–20%; 4: decreasedcastingtime 5–10% |
| 32782 | 2026 FWC Golden Oracle | ultimate | 0: attack 17–24.2%; 1: healing 17–24%; 2: decreasedcastingtime 33–46%; 3: int 30–43; 4: ankousharvest 5–11% |
| 33150 | Bow of Echoes | ultimate | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: attack 3–5% |
| 33326 | 2026 FWC Golden Celestial Edge | ultimate | 0: maxhp 30–42%; 1: sta 28–39; 2: block 9–17%; 3: incomingdamage -8–-13%; 4: actionspeed 12–28% |
| 33758 | Celestial Edge | unique | 0: maxhp 30–38%; 1: sta 28–35; 2: block 9–15%; 3: incomingdamage -8–-12%; 4: actionspeed 12–25% |
| 34104 | Cursed Harbinger | unique | 0: criticaldamage 55–65%; 1: criticalchance 32–36%; 2: attackspeed 9–11%; 3: skillchance 15–30% (skill 23893) |
| 34455 | Scepter of Disorder | unique | 0: attack 22–29%; 1: decreasedcastingtime 30–39%; 2: int 30–39; 3: skillchance 9–11% (skill 14967); 4: ankousharvest 5–10% |
| 35517 | 2026 FWC Golden Curtana | ultimate | 0: criticaldamage 65–89%; 1: criticalchance 25–35.2%; 2: attackspeed 12.5–17.9%; 3: ankousharvest 5–11% |
| 35874 | Cursed Maw of Judgement | unique | 0: criticaldamage 55–65%; 1: criticalchance 29–35%; 2: attackspeed 10–12.5%; 3: skillchance 15–30% (skill 23893) |
| 35955 | Bow of Echoes | unique | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: attack 3–5% |
| 36284 | Cursed Curtana | unique | 0: criticaldamage 53–63%; 1: criticalchance 23–26%; 2: attackspeed 15–16.5%; 3: skillchance 15–30% (skill 23893) |
| 36433 | Cursed Dementia | unique | 0: criticaldamage 57–67%; 1: str 25–30; 2: criticalchance 18–25%; 3: skillchance 15–30% (skill 23893) |
| 36559 | Dementia | ultimate | 0: criticaldamage 67–83.3%; 1: str 30–39; 2: criticalchance 25–32.5%; 3: muranswrath 5–15% |
| 37545 | 2025 FWC Golden Lusaka's Crystal Sword | ultimate | 0: criticaldamage 53–72.3%; 1: criticalchance 23–29.2%; 2: attackspeed 15–19.05%; 3: skillchance 4–11% (skill 6824) |
| 37675 | Roika's Staff | unique | 0: allelementsmastery 25–32%; 1: decreasedcastingtime 33–42%; 2: int 30–39; 3: skillchance 9–13% (skill 14967); 4: muranswrath 5–15% |
| 39018 | Cleaver of the Mist | ultimate | 0: maxhp 30–35%; 1: sta 24–34; 2: pvpdamagereduction 8–12%; 3: pvpdamage 8–12%; 4: pvpcriticaldamage 6–9% |
| 40229 | 2026 FWC Golden Roika's Staff | ultimate | 0: allelementsmastery 25–35%; 1: decreasedcastingtime 33–46%; 2: int 30–43; 3: skillchance 9–14% (skill 14967); 4: muranswrath 5–17% |
| 40365 | Cursed Roika's Staff | unique | 0: allelementsmastery 20–25%; 1: decreasedcastingtime 28–33%; 2: int 25–30; 3: skillchance 15–30% (skill 23893) |
| 40659 | Butcher's Carnage | ultimate | 0: criticaldamage 60–75%; 1: criticalchance 18–26.2%; 2: attackspeed 11–15.3%; 3: ankousharvest 5–10% |
| 40681 | Curtana | ultimate | 0: criticaldamage 65–80.9%; 1: criticalchance 25–32%; 2: attackspeed 12.5–16.25%; 3: ankousharvest 5–10% |
| 41264 | Wand of Apparitions | unique | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: decreasedcastingtime 20–30% |
| 41536 | 2025 FWC Golden Lusaka's Heavy Crystal Axe | ultimate | 0: criticaldamage 55–73.5%; 1: criticalchance 32–41.6%; 2: attackspeed 9–13.1%; 3: skillchance 1–5% (skill 7599); 4: skillchance 1–5% (skill 7599) |
| 41575 | Scepter of Disorder | ultimate | 0: attack 22–29%; 1: decreasedcastingtime 30–39%; 2: int 30–39; 3: skillchance 9–11% (skill 14967); 4: ankousharvest 5–10% |
| 41690 | Sword of Whisper | ultimate | 0: maxhp 14–18%; 1: sta 10–14; 2: pvpdamagereduction 3–5%; 3: pvpdamage 2–3%; 4: actionspeed 5–10% |
| 41971 | 2025 FWC Golden Lusaka's Crystal Fist | ultimate | 0: criticaldamage 55–73.5%; 1: criticalchance 29–40.5%; 2: attackspeed 10–14.75%; 3: skillchance 1–5% (skill 7599); 4: skillchance 1–5% (skill 7599) |
| 42020 | Roika's Staff | ultimate | 0: allelementsmastery 25–32%; 1: decreasedcastingtime 33–42%; 2: int 30–39; 3: skillchance 9–13% (skill 14967); 4: muranswrath 5–15% |
| 42906 | Dragon's Rain | ultimate | 0: criticaldamage 68–85.8%; 1: attack 17–22%; 2: criticalchance 2.2–2.9%; 3: muranswrath 5–15% |
| 44185 | Jewel of Nightmare | ultimate | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: attack 2–5% |
| 44718 | Staff of Ethereal Dreams | ultimate | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 10–15%; 3: pvpdamage 6–9%; 4: decreasedcastingtime 30–40% |
| 45024 | Knuckle of Madness | unique | 0: maxhp 28–35%; 1: sta 24–32; 2: pvpdamagereduction 8–12%; 3: pvpdamage 6–9%; 4: pvpcriticaldamage 4–7% |
| 45056 | 2025 FWC Golden Lusaka's Crystal Bow | ultimate | 0: criticaldamage 58–78%; 1: attack 12–20%; 2: criticalchance 1.8–2.6%; 3: skillchance 5–11% (skill 6824) |
| 45703 | Dragon's Rain | unique | 0: criticaldamage 68–85.8%; 1: attack 17–22%; 2: criticalchance 2.2–2.9%; 3: muranswrath 5–15% |
| 45923 | 2025 FWC Golden Lusaka's Heavy Crystal Sword | ultimate | 0: criticaldamage 62–81.2%; 1: criticalchance 26–35%; 2: attackspeed 14–18.6%; 3: skillchance 4–11% (skill 9304) |
| 46429 | Phantasmal Slayer | ultimate | 0: maxhp 32–35%; 1: sta 30–40; 2: block 12–18%; 3: pvpdamagereduction 10–14%; 4: actionspeed 12–25% |
| 46581 | Phantasmal Slayer | unique | 0: maxhp 32–35%; 1: sta 30–40; 2: block 12–18%; 3: pvpdamagereduction 10–14%; 4: actionspeed 12–25% |
| 47197 | 2026 FWC Golden K Fang | ultimate | 0: criticaldamage 60–82.5%; 1: criticalchance 26–35.4%; 2: attackspeed 16.5–23.1%; 3: ankousharvest 2–6% |
| 47778 | Cursed Butcher's Carnage | unique | 0: criticaldamage 55–65%; 1: criticalchance 18–22%; 2: attackspeed 11–13%; 3: skillchance 15–30% (skill 23893) |
| 48005 | Cursed Oracle | unique | 0: attack 12–17%; 1: healing 12–17%; 2: decreasedcastingtime 28–33%; 3: int 25–30; 4: skillchance 15–30% (skill 23893) |
| 48356 | Cursed Celestial Edge | unique | 0: criticaldamage 62–72%; 1: criticalchance 26–30%; 2: attackspeed 14–16%; 3: skillchance 15–30% (skill 23893) |
| 48574 | Dementia | unique | 0: criticaldamage 67–83.3%; 1: str 30–39; 2: criticalchance 25–32.5%; 3: muranswrath 5–15% |
| 48998 | 2026 FWC Golden Scepter of Disorder | ultimate | 0: attack 22–31.9%; 1: decreasedcastingtime 30–43%; 2: int 30–43; 3: skillchance 9–12% (skill 14967); 4: ankousharvest 5–11% |
| 49315 | 2026 FWC Golden Maw of Judgement | ultimate | 0: criticaldamage 65–89%; 1: criticalchance 35–49%; 2: attackspeed 12.5–17.85%; 3: ankousharvest 5–11% |
| 49341 | Cursed Scepter of Disorder | unique | 0: attack 17–22%; 1: decreasedcastingtime 25–30%; 2: int 25–30; 3: skillchance 15–30% (skill 23893) |
| 49827 | K Fang | unique | 0: criticaldamage 60–75%; 1: criticalchance 26–32.2%; 2: attackspeed 16.5–21%; 3: ankousharvest 2–5% |
| 49847 | Celestial Edge | ultimate | 0: maxhp 30–38%; 1: sta 28–35; 2: block 9–15%; 3: incomingdamage -8–-12%; 4: actionspeed 12–25% |
| 52387 | Oracle | unique | 0: attack 17–22%; 1: healing 17–22%; 2: decreasedcastingtime 33–42%; 3: int 30–39; 4: ankousharvest 5–10% |
| 53943 | 2025 FWC Golden Lusaka's Crystal Axe | ultimate | 0: criticaldamage 55–73.5%; 1: criticalchance 18–26.2%; 2: attackspeed 11–15.3%; 3: skillchance 4–11% (skill 9304) |
| 54696 | Curtana | unique | 0: criticaldamage 65–80.9%; 1: criticalchance 25–32%; 2: attackspeed 12.5–16.25%; 3: ankousharvest 5–10% |
| 54845 | Mirage | ultimate | 0: maxhp 32–35%; 1: sta 28–38; 2: pvpdamagereduction 8–12%; 3: healing 15–20%; 4: decreasedcastingtime 5–10% |
| 54987 | Oracle | ultimate | 0: attack 17–22%; 1: healing 17–22%; 2: decreasedcastingtime 33–42%; 3: int 30–39; 4: ankousharvest 5–10% |
| 55532 | Cleaver of the Mist | unique | 0: maxhp 30–35%; 1: sta 24–34; 2: pvpdamagereduction 8–12%; 3: pvpdamage 8–12%; 4: pvpcriticaldamage 6–9% |
| 56299 | Sword of Mist | unique | 0: maxhp 28–35%; 1: sta 24–34; 2: pvpdamagereduction 2–5%; 3: pvpdamage 5–8%; 4: pvpcriticaldamage 5–8% |
| 56978 | Butcher's Carnage | unique | 0: criticaldamage 60–75%; 1: criticalchance 18–26.2%; 2: attackspeed 11–15.3%; 3: ankousharvest 5–10% |
| 57111 | Specter's Axe | ultimate | 0: maxhp 14–18%; 1: sta 10–14; 2: pvpdamagereduction 2–4%; 3: pvpdamage 2–4%; 4: actionspeed 10–15% |
| 57314 | Cursed Dragon's Rain | unique | 0: criticaldamage 58–68%; 1: attack 12–17%; 2: criticalchance 1.8–2.2%; 3: skillchance 15–30% (skill 23893) |
| 57862 | Harbinger | ultimate | 0: criticaldamage 65–80.9%; 1: criticalchance 36–45.7%; 2: attackspeed 11–14.5%; 3: muranswrath 5–15% |
| 58444 | Sword of Mist | ultimate | 0: maxhp 28–35%; 1: sta 24–34; 2: pvpdamagereduction 2–5%; 3: pvpdamage 5–8%; 4: pvpcriticaldamage 5–8% |
| 58998 | Harbinger | unique | 0: criticaldamage 65–80.9%; 1: criticalchance 36–45.7%; 2: attackspeed 11–14.5%; 3: muranswrath 5–15% |

## E. Data model, editor and persistence

Gear.baseStatRolls is optional and stores only {abilityIndex, value}. The canonical item supplies parameter, rate, bounds and precision. A separate optional baseStatRollReview preserves source item ID, unmatched original roll selections and migration warnings.

The selected weapon editor exposes BASE STAT ROLLS, NumericInput controls, configured amounts with range hints, and Minimum/Midpoint/Maximum presets. Presets only replace intrinsic selections. Additional Stat, Bonus Awakening, Ultimate random bonuses, sockets, elements and upgrades are preserved. Explicit rolls appear as item-base-roll sources named “Weapon — Base Roll” in stat explanations.

New equipment defaults to legal midpoint values (integer 30–39 selects 35). Legacy saves with no field continue to use ability.add without silently changing calculations, with an editor notice and explicit presets. API endpoint precision sets the legal grid; float comparisons use tolerance. Nonfinite, out-of-range, duplicate, non-ranged and off-grid values are rejected.

Schema version remains 3. Client parsing and the production SQL schema accept optional roll/review state for all gear and opponent references. Database read-only checks accepted a roll/review fixture and a legacy fixture, rejected a negative index, and found both existing saved builds valid. No saved rows were modified by verification.

AI import has canonical roll state and a review editor for resolved ranged weapons. It does not assume midpoint rolls or infer unseen values. Users can explicitly review values before creating a build. Automatic screenshot extraction of intrinsic rolls remains future work; no new model call or Edge Function was required.

Scroll of Ultimate Power remains a material, excluded from Active Items.

## F. Roika example

Current Unique 37675 and Ultimate 42020 are both named Roika's Staff. Their ranges are mastery 25–32%, casting 33–42%, INT 30–39, skill proc 9–13%, and Muran's Wrath 5–15%.

With a clean level-180 Arcanist fixture and allocated INT 15, minimum rolls yield final INT 45, casting speed 133% and mastery 25%; maximum rolls yield INT 54, casting speed 142% and mastery 32%. Selecting INT 38 yields final INT 53, not 83. These intrinsic changes leave random bonus configuration unchanged. Proc and conditional values are retained in configured abilities without inventing unsupported combat behavior.

## G. Conch example

Current Unique 14000 and Ultimate 15914 are both named Conch Staff. Their ranges are mastery 18–23%, casting 26–30%, INT 22–28 and Waterbomb proc 4–9%.

The same clean fixture yields minimum INT 37 / casting speed 126% / mastery 18%, versus maximum INT 43 / casting speed 130% / mastery 23%. Both variants are tested using current repository API data. Ultimate random bonus state stays unchanged.

## H. Unique to Ultimate preservation

Conversion matches parameter, rate, range, effect metadata and occurrence, rather than assuming array positions. Equivalent Conch/Roika ranges retain configured selections. Reordered lines and repeated parameters are tested. Ambiguous or unmatched selections remain in baseStatRollReview with their original source item ID, line/value and warnings, and are not applied to an incompatible destination. Legacy normalization uses the same remapping.

## I. +6/+10 random bonus range audit

These slots remain separate from intrinsic rolls and use possibleRandomStats through getUltimateBonusAllowedRange. The [official Muran's Awakening announcement](https://universe.flyff.com/news/muransawakeningexpansion) confirms new stats at +6/+10 and Scroll of Ultimate Bonus II, but does not specify their reduced numeric ranges or rounding. The API exposes one shared possibleRandomStats table rather than authoritative slot-specific bounds.

The audited [Flyffulator reference](https://github.com/Frostiae/Flyffulator/tree/89116244b670930ac8633a99212b7f9727bb8c12), commit 89116244b670930ac8633a99212b7f9727bb8c12, uses half-strength later slots with parameter-specific step rounding. Its intrinsic range midpoint and configurable aggregation behavior were studied, and cleanly reimplemented without copying source. The exact later-slot game rounding was not independently confirmed. Therefore this update retains existing full numeric bounds and marks +6/+10 ranges unverified in the UI/helper. It deliberately makes no numeric migration based solely on that reference. Base slots use the verified shared API range. This secondary audit remains a documented limitation pending authoritative numeric evidence.

## J. Files changed

- lib/item-stat-ranges.ts; lib/ultimate-bonus-ranges.ts: canonical range, preset, validation, remapping and bonus range helpers.
- lib/model.ts; lib/persistence.ts; supabase/migrations/202610130005_base_stat_rolls.sql: optional schema-3 roll/review state.
- lib/stat-modifiers.ts; combat/character.ts; combat/attack.ts; lib/item-rules.ts: intrinsic replacement, inspector source, validation and shared attack mapping.
- lib/equipment.ts; lib/item-variants.ts: new-equipment defaults and safe conversion.
- components/BaseStatRollEditor.tsx; components/EquipmentEditor.tsx; components/ItemUpgradePanel.tsx: independent roll editor and random-slot confidence.
- lib/ai-item-resolution.ts; lib/ai-build-import.ts; components/AICharacterImport.tsx: canonical reviewed import values without invented rolls.
- tests/item-stat-ranges.test.ts; scripts/test.mjs: regression suite integration.
- docs/ultimate-power-base-roll-audit.md: this A–O report.

## K. Tests added

31 cases cover fixed effects, exactly-once INT replacement, percentage semantics, decimal precision/tolerance, invalid bounds/nonfinite/duplicate/fixed indices, presets, new versus legacy defaults, both real weapon pairs, separation from other weapon properties, signature/occurrence remapping, retained unmatched values, legacy normalization, +0/+5/+6/+10 auto and skill scaling, all eleven upgrade rows, schema-3/opponent round trips, editor rendering, Active Item exclusion, range confidence and AI review/import compatibility.

## L. npm test

295 passed; 0 failed.

## M. npm run typecheck

Passed with no TypeScript errors.

## N. npm run lint

Passed with 0 errors; 29 pre-existing warnings. No new warning remains.

## O. npm run build

Production build passed for all client/server/worker environments. UI rendering is covered by server-rendered component checks. Interactive browser QA could not run because the installed browser automation runtime failed to initialize (missing kernel asset path); no manual interaction pass is claimed.

