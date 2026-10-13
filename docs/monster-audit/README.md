> Historical audit baseline before the selector update. See [the implemented selector policy](../monster-selection.md) for current browsing behavior.

# Full Monster Duplicate / Variant Audit

Captured 2026-10-13T15:31:38.194Z. Public API, local seed and active Supabase generation all use Flyff data version 37. This is a read-only investigation: no monster, save, selector policy or production code was changed. No name-based deduplication was performed.

## Result

| Check | Result |
| --- | --- |
| Current/local/cached records | 1224 / 1224 / 1224 |
| Duplicate IDs in any current inventory | 0 |
| Full-payload duplicate groups ignoring only ID | 0 |
| Local vs current normalized payload mismatches | 0 |
| Cached raw vs current API mismatches | 0 |
| Cache normalizer mismatches | 0 |
| Exact-name collision groups | 82 groups / 358 records |
| Normalized-name groups | 83 |
| Role/title/difficulty-stripped family candidates | 194 |
| Near-name candidate pairs | 27 |
| Core-equivalent groups with different IDs | 7 |
| Same-name metadata-only pairs | 1 |
| Locale/name collision groups with different English labels | 40 |
| Explicit event monsters | 118 |
| Inactive/removed records carried into active cache | 0 |
| No inbound cross-record references | 502 |
| No spawn/inbound evidence (includes location-only records) | 241 |
| No spawn, inbound reference or location metadata | 141 |

Exact-name groups are not necessarily duplicate records. 54 groups differ in level, 2 in rank, 82 in statistics and 75 in inline drops. Counts describe groups, not pair counts.

## Demonic Ankou — both valid, preserve both IDs

| Field | ID 49835 | ID 54177 |
| --- | --- | --- |
| Monster ID | 49835 | 54177 |
| Resource/table entity ID | 49835 | 54177 |
| Internal MI_* resource code | Not exposed by public API | Not exposed by public API |
| Name | [God of Death] Demonic Ankou | [God of Death] Demonic Ankou |
| Level | 180 | 200 |
| Rank / separate class | super / no separate class field | super / no separate class field |
| HP | 1000000000 | 38500000 |
| MP | 0 | 0 |
| Attack range | 38001–87000 | 1151–1415 |
| Defense / magic defense | 416 / 400 | 416 / 400 |
| STR / STA / DEX / INT | 30 / 40 / 375 / 350 | 30 / 40 / 375 / 350 |
| Hit rate / parry | 246 / 178 | 246 / 178 |
| Element | fire | fire |
| Area | instance | instance |
| Dungeon | Ankou's Asylum #46476 (normal) | Ankou's Asylum (Story) #50040 (story) |
| Dungeon entry level | 166–190 | 166–190 |
| World ID | 59671 | 59671 |
| Spawn evidence | 1 spawn rectangle(s) | 1 spawn rectangle(s) |
| Event flag | false | false |
| Separate drop-table ID | Not published; inline monster.drops | Not published; inline monster.drops |
| Inline drop entries | 303 | 184 |
| Booty item ID (NOT drop-table ID) | 57589 | 57589 |
| Game-data references | dungeon #46476 Ankou's Asylum .monsters[7]; quest #37960 Climax .endKillMonsters[0].monster[2] | dungeon #50040 Ankou's Asylum (Story) .monsters[7]; quest #37960 Climax .endKillMonsters[0].monster[5] |

Both appear in `data/monster.json`, current `GET /monster/{id}`, and `public.flyff_entities` with `resource='monster'` and `entity_id='49835'` / `'54177'` in active generation `932d313c-a4a6-4e65-85d6-4f1be48c4584`. Both are active, present in version 37, linked from current dungeon definitions and the Climax quest #37960. Neither is an event record or an unused variant.

The Lv. 200 record is explicitly the Story dungeon record; its HP and attack are much lower despite its higher level field. The API does not explain why the designers chose the numeric level 200, so no balancing rationale or level correction is invented. The normal dungeon has three named Ankou boss forms; official release notes describe the strongest Demonic form as the fast-clear reward. This boss-form distinction is separate from normal-versus-Story difficulty.

Both share world 59671 and coordinates x=1262, y=101.6, z=1390. Their spawn rectangles are x=1260–1264 / z=1388–1392, aggression 100. Shared geometry does not collapse the distinct difficulty records. Drop arrays differ (303 versus 184 entries and different SHA-256 audit fingerprints); fingerprints are audit hashes, not authoritative drop-table IDs. Full attack entries and references are in the JSON inventory.

Authoritative sources: [normal monster](https://api.flyff.com/monster/49835), [Story monster](https://api.flyff.com/monster/54177), [current dungeon list](https://api.flyff.com/dungeon), [Climax quest](https://api.flyff.com/quest/37960), [official expansion note](https://universe.flyff.com/news/muransawakeningexpansion), [API schema documentation](https://api.flyff.com/).

## Why the selector looks duplicated

The importer preserves authoritative IDs and uses English localized names. The source English names themselves collide: no duplicate IDs or normalized payload corruption were found. Both import paths call the same normalizer. `normalizeFlyffRecord` removes `spawns`, `drops`, `experienceTable`, `location` and unrelated title/transy payloads; raw cache records retain them. The selector prints name + level + rank, without dungeon/difficulty, so valid variants appear ambiguous. The dungeon filter already follows dungeon.monsters by ID.

Cache identity is the primary key `(generation_id, resource, entity_id)`. API version and generation are history boundaries, not alternate monster identities. This cache has one generation, all 1,224 monsters active, with no carried inactive monster records. The local file and active database both match current API records.

## Selector exposure and safe policy

- **118 event=true records** are in the current Builder dataset; the current selector has no event filter. Availability in the API does not prove an event is running now. Event choices should be explicit opt-in, preserving IDs.
- **3 display placeholders** literally named `null`: IDs 10801, 18819 (event=true, level 1) and 25001 (event=false, level 100). None has exposed inbound references or spawns. They are review candidates, not conclusively proven unused server resources.
- **96 super-rank records** exist; the current “bosses” filter only accepts giant/boss/worldboss. It excludes Demonic Ankou and other `super` records. This is a filtering-policy gap, not an importer duplicate.
- **241 records lack exposed spawn/inbound reference evidence**; 100 of these still have location metadata. Only 141 lack all three categories. These are marked for review in the audit, not labeled legacy or removed. Violet/rare/scripted/event monsters show why reference absence is insufficient evidence.
- **0 inactive legacy cache records** were found. Do not synthesize isActive=false from names or missing public spawn data.
- Both Demonic Ankou entries remain selectable and are marked preserve-ID/disambiguate-context. The requested condition for excluding an unused Ankou variant does not apply because both are referenced.

## Complete exact-name collision groups

| Name | ID:level:rank | Dungeon/difficulty associations | Stats differ | Drops differ | Evidence |
| --- | --- | --- | --- | --- | --- |
| Cavern Larva | 2:130:captain; 2387:45:captain; 4906:23:captain; 6212:105:captain; 7452:75:captain; 16408:23:captain; 17961:150:captain; 49622:150:captain | Leren Chasm (Nightmare) #15396; Leren Chasm (Medium) #16977; Leren Chasm #19867; Leren Chasm (Extra Hard) #11989; Leren Chasm (Hard) #15267; Leren Chasm (Story) #11419; Leren Chasm (Cursed) #13883; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Caveman Chief | 140:130:super; 711:45:super; 1237:23:super; 4308:75:super; 5673:105:super; 11661:23:super; 13896:155:super; 18679:150:super; 47276:150:super | Leren Chasm (Nightmare) #15396; Leren Chasm (Medium) #16977; Leren Chasm #19867; Leren Chasm (Hard) #15267; Leren Chasm (Extra Hard) #11989; Leren Chasm (Story) #11419; Leren Chasm (Cursed) #13883; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Giant Turtle | 252:130:captain; 2519:75:captain; 8504:105:captain; 13224:150:captain; 19865:75:captain; 31416:150:captain | Envy Depths (Nightmare) #10438; Envy Depths #10010; Envy Depths (Extra Hard) #16675; Envy Depths (Cursed) #15733; Envy Depths (Story) #14679; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Small Mushpoie | 307:36:normal; 8283:78:small | None exposed | Yes | Yes | Current reference/spawn evidence |
| Pyramid Guardian | 392:105:super; 3066:105:super; 6501:130:super; 15268:150:super; 16309:155:super; 50984:150:super | Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary #10105; Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Yetti | 528:120:small; 19629:1:small | None exposed | Yes | Yes | Event records present |
| Cavern Nightmist | 679:45:captain; 3267:105:captain; 3769:23:captain; 4443:75:captain; 8687:23:captain; 9159:130:captain; 16793:150:captain; 50820:150:captain | Leren Chasm (Medium) #16977; Leren Chasm (Extra Hard) #11989; Leren Chasm #19867; Leren Chasm (Hard) #15267; Leren Chasm (Story) #11419; Leren Chasm (Nightmare) #15396; Leren Chasm (Cursed) #13883; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Grunt Gorilla | 712:105:captain; 2505:45:captain; 7077:130:captain; 8143:75:captain; 13686:150:captain; 15738:45:captain; 25120:150:captain | Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs #10316; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Old Rut | 777:45:captain; 7094:105:captain; 9460:75:captain; 10000:130:captain; 10077:150:captain; 13028:45:captain; 55702:150:captain | Rhisis Catacombs #10316; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Great Kraken | 1179:130:super; 4664:75:super; 6362:105:super; 11004:130:super; 13969:75:super; 18588:150:super; 43640:150:super | Envy Depths (Nightmare) #10438; Envy Depths #10010; Envy Depths (Extra Hard) #16675; Envy Depths (Story) #14679; Envy Depths (Cursed) #15733; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Kraken Spawn | 1257:130:small; 5679:105:small; 5729:75:small; 12319:75:small; 16141:150:small; 22010:150:small | None exposed | Yes | Yes | Current reference/spawn evidence |
| Overgrown Broodmother | 1322:75:boss; 2140:105:boss; 7525:45:boss; 9574:130:boss; 12911:150:boss; 17615:45:boss; 53966:150:boss | Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs #10316; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Siren | 1344:75:boss; 2000:130:boss; 3846:105:boss; 10120:75:boss; 18091:150:boss; 22880:150:boss | Envy Depths #10010; Envy Depths (Nightmare) #10438; Envy Depths (Extra Hard) #16675; Envy Depths (Story) #14679; Envy Depths (Cursed) #15733; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Spiderling | 1390:75:small; 6154:45:small; 6336:130:small; 7823:105:small; 10441:45:small; 13579:150:small; 49069:150:small | None exposed | Yes | Yes | Current reference/spawn evidence |
| Bolt Otem | 1471:130:captain; 1652:105:captain; 2621:45:captain; 6838:75:captain; 11153:45:captain; 11329:150:captain; 25030:150:captain | Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs #10316; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Defense Otem | 1584:75:captain; 1780:105:captain; 3389:130:captain; 4910:23:captain; 6894:45:captain; 15980:23:captain; 16567:150:captain; 45415:150:captain | None exposed | Yes | Yes | Current reference/spawn evidence |
| Skeletal Militant | 1948:130:captain; 14516:150:captain; 17690:130:captain; 25749:150:captain | Storm Peak #15077; Storm Peak (Cursed) #12210; Storm Peak (Story) #17871; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Temple Guardian | 2363:105:super; 2567:130:super; 4282:75:super; 9085:45:super; 16430:155:super; 16503:45:super; 19797:150:super; 41085:150:super | Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs #10316; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Enraged Gorilla | 2378:45:boss; 2675:75:boss; 3058:130:boss; 5493:105:boss; 11835:45:boss; 12117:150:boss; 25376:150:boss | Rhisis Catacombs #10316; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Radioactive Long Legs | 2539:75:captain; 2753:45:captain; 3695:105:captain; 5574:130:captain; 8445:23:captain; 16448:23:captain; 18648:150:captain; 37395:150:captain | Leren Chasm (Hard) #15267; Leren Chasm (Medium) #16977; Leren Chasm (Extra Hard) #11989; Leren Chasm (Nightmare) #15396; Leren Chasm #19867; Leren Chasm (Story) #11419; Leren Chasm (Cursed) #13883; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Golden Aibatt | 2630:1:small; 19168:1:small | None exposed | Yes | No | Event records present |
| Nightmist Empress | 2663:130:boss; 5356:45:boss; 7109:23:boss; 7783:75:boss; 8827:105:boss; 14071:150:boss; 15032:23:boss; 49531:150:boss | Leren Chasm (Nightmare) #15396; Leren Chasm (Medium) #16977; Leren Chasm #19867; Leren Chasm (Hard) #15267; Leren Chasm (Extra Hard) #11989; Leren Chasm (Cursed) #13883; Leren Chasm (Story) #11419; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Sentient Tree Guardian | 2749:45:boss; 4012:105:boss; 8438:130:boss; 9157:75:boss; 15336:150:boss; 17307:45:boss; 51360:150:boss | Rhisis Catacombs #10316; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Lurking Merman | 2793:130:captain; 7466:105:captain; 7478:75:captain; 10954:150:captain; 17062:75:captain; 50102:150:captain | Envy Depths (Nightmare) #10438; Envy Depths (Extra Hard) #16675; Envy Depths #10010; Envy Depths (Cursed) #15733; Envy Depths (Story) #14679; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Enchanted AI | 2847:130:captain; 7117:105:captain; 16120:150:captain; 19027:105:captain; 57130:150:captain | Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary #10105; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Frozen Hare Assassin | 2987:130:boss; 17196:150:boss; 18530:130:boss; 57556:150:boss | Storm Peak #15077; Storm Peak (Cursed) #12210; Storm Peak (Story) #17871; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Regal Kumai | 3218:105:captain; 4867:130:captain; 16714:150:captain; 18836:105:captain; 22379:150:captain | Guardiane Sanctuary #10105; Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Saphyryan Hound | 3321:130:captain; 12449:130:captain; 14234:150:captain; 21067:150:captain | Storm Peak #15077; Storm Peak (Story) #17871; Storm Peak (Cursed) #12210; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Queen Long Legs | 3535:130:boss; 5333:75:boss; 5801:45:boss; 8124:23:boss; 9899:105:boss; 12384:150:boss; 19375:23:boss; 53806:150:boss | Leren Chasm (Nightmare) #15396; Leren Chasm (Hard) #15267; Leren Chasm (Medium) #16977; Leren Chasm #19867; Leren Chasm (Extra Hard) #11989; Leren Chasm (Cursed) #13883; Leren Chasm (Story) #11419; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Sentient Tree Warrior | 3640:45:captain; 4161:130:captain; 5784:75:captain; 7792:105:captain; 16057:45:captain; 19961:150:captain; 52533:150:captain | Rhisis Catacombs #10316; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Deep Cave Gorilla | 3670:45:captain; 6719:75:captain; 7397:130:captain; 9615:105:captain; 9745:23:captain; 16539:23:captain; 17048:150:captain; 20321:150:captain | Leren Chasm (Medium) #16977; Leren Chasm (Hard) #15267; Leren Chasm (Nightmare) #15396; Leren Chasm (Extra Hard) #11989; Leren Chasm #19867; Leren Chasm (Story) #11419; Leren Chasm (Cursed) #13883; Leren Chasm (Infernal) #36054 | Yes | Yes | Confirmed dungeon difficulty variants |
| Cunning Merman | 3948:105:captain; 5419:75:captain; 7420:130:captain; 11970:150:captain; 14104:75:captain; 54443:150:captain | Envy Depths (Extra Hard) #16675; Envy Depths #10010; Envy Depths (Nightmare) #10438; Envy Depths (Cursed) #15733; Envy Depths (Story) #14679; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Pyramid Keeper | 4033:105:boss; 8056:130:boss; 17471:150:boss; 19078:105:boss; 38004:150:boss | Guardiane Sanctuary #10105; Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Enchanted Shaman | 4309:130:captain; 9083:105:captain; 13966:105:captain; 15415:150:captain; 43245:150:captain | Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary #10105; Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Phantom General | 4701:130:captain; 18174:130:captain; 19364:150:captain; 56899:150:captain | None exposed | Yes | Yes | Current reference/spawn evidence |
| Skeleton General | 4908:130:boss; 12183:130:boss; 17488:150:boss; 58897:150:boss | Storm Peak #15077; Storm Peak (Story) #17871; Storm Peak (Cursed) #12210; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Overgrown Spider | 4931:105:captain; 6384:75:captain; 7327:130:captain; 8202:45:captain; 13716:45:captain; 19254:150:captain; 42492:150:captain | Rhisis Catacombs (Extra Hard) #14293; Rhisis Catacombs (Hard) #13683; Rhisis Catacombs (Nightmare) #17697; Rhisis Catacombs #10316; Rhisis Catacombs (Story) #18149; Rhisis Catacombs (Cursed) #15227; Rhisis Catacombs (Infernal) #37107 | Yes | Yes | Confirmed dungeon difficulty variants |
| Enraged Yetti | 5447:130:captain; 8242:130:captain; 14047:150:captain; 56637:150:captain | Storm Peak (Story) #17871; Storm Peak #15077; Storm Peak (Cursed) #12210; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Wildwood Stalker | 5602:150:captain; 11913:150:captain; 52689:150:captain | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Mermaid Beauty | 5921:105:captain; 8737:75:captain; 9658:130:captain; 14360:75:captain; 18628:150:captain; 56897:150:captain | Envy Depths (Extra Hard) #16675; Envy Depths #10010; Envy Depths (Nightmare) #10438; Envy Depths (Story) #14679; Envy Depths (Cursed) #15733; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Frozen Hare Guard | 6793:130:captain; 17214:150:captain; 17534:130:captain; 42990:150:captain | Storm Peak #15077; Storm Peak (Cursed) #12210; Storm Peak (Story) #17871; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Overgrown Shark | 6981:105:captain; 7607:75:captain; 8229:130:captain; 12958:75:captain; 15260:150:captain; 50272:150:captain | Envy Depths (Extra Hard) #16675; Envy Depths #10010; Envy Depths (Nightmare) #10438; Envy Depths (Story) #14679; Envy Depths (Cursed) #15733; Envy Depths (Infernal) #32895 | Yes | Yes | Confirmed dungeon difficulty variants |
| Crystal Demon Lord | 7093:130:super; 15792:150:super; 17287:130:super; 23731:150:super | Storm Peak #15077; Storm Peak (Cursed) #12210; Storm Peak (Story) #17871; Storm Peak (Infernal) #20146 | Yes | Yes | Confirmed dungeon difficulty variants |
| Enchanted Rider | 7213:130:captain; 8452:105:captain; 14031:150:captain; 18876:105:captain; 52865:150:captain | Guardiane Sanctuary (Nightmare) #17801; Guardiane Sanctuary #10105; Guardiane Sanctuary (Cursed) #14451; Guardiane Sanctuary (Story) #14020; Guardiane Sanctuary (Infernal) #56105 | Yes | Yes | Confirmed dungeon difficulty variants |
| Scorched Meteonyker | 8013:120:captain; 10186:155:captain | None exposed | Yes | Yes | Current reference/spawn evidence |
| Wildwood Shaman | 10160:150:captain; 13512:150:captain; 59960:150:captain | None exposed | Yes | Yes | Current reference/spawn evidence |
| Twinstrike Den Mother | 10208:150:boss; 16181:150:boss; 24619:150:boss | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Water Totem Pole | 10303:150:captain; 10944:150:captain; 49941:150:captain | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Event] Creper | 10364:30:normal; 12869:120:normal; 13984:80:normal; 28558:170:normal | None exposed | Yes | No | Event records present |
| null | 10801:1:small; 18819:1:small; 25001:100:normal | None exposed | Yes | No | Event records present |
| [Event] Violet Giggle Box | 10887:101:captain; 11714:61:captain; 12789:20:captain | None exposed | Yes | No | Event records present |
| Wind Totem Pole | 11261:150:captain; 15138:150:captain; 57462:150:captain | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Event] Violet Creper | 12172:80:violet; 14111:120:violet; 18339:30:violet; 48646:170:violet | None exposed | Yes | No | Event records present |
| Tanuki Trainee | 12246:150:captain; 18899:150:captain; 36788:150:captain | None exposed | Yes | Yes | Current reference/spawn evidence |
| Electric Totem Pole | 12835:150:captain; 17041:150:captain; 32527:150:captain | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Tanuki Enforcer | 12894:150:captain; 17224:150:captain; 41008:150:captain | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Fire Totem Pole | 13132:150:captain; 18128:150:captain; 24377:150:captain | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Beast King Khan | 13286:155:super; 16244:150:super; 16575:150:super; 47146:150:super | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Earth Totem Pole | 15755:150:captain; 19338:150:captain; 46973:150:captain | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Event] Giggle Box | 16510:20:normal; 17778:101:normal; 17990:61:normal | None exposed | Yes | No | Event records present |
| Twinstrike Cobra | 16549:150:captain; 17120:150:captain; 42792:150:captain | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Wildwood Chieftain | 16723:150:boss; 17187:150:boss; 25270:150:boss | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Tanuki Protector | 17309:150:boss; 19819:150:boss; 54800:150:boss | The Wilds (Story) #15201; The Wilds #14320; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| Prismatic Cobra | 17443:150:captain; 19517:150:captain; 32723:150:captain | The Wilds #14320; The Wilds (Story) #15201; The Wilds (Infernal) #51658 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Event] Mr. Pumpkin | 19371:25:normal; 22389:61:normal; 24413:20:normal; 58890:101:normal | None exposed | Yes | Yes | Event records present |
| Blossom | 20209:180:captain; 49630:180:captain | Rescue [Eillun Farmer] Sprout #57115; Rescue [Eillun Farmer] Thorn #44887; Defend [Eillun Farmer] Dr. Root #42131; Rescue [Eillun Farmer] Dr. Root #30348 | Yes | Yes | Current reference/spawn evidence |
| [Perverted Soul] Morrigan | 20947:192:captain; 33002:192:captain | Ankou's Asylum #46476; Ankou's Asylum (Story) #50040 | Yes | Yes | Confirmed dungeon difficulty variants |
| Nightmyst | 22279:190:captain; 33393:190:captain | None exposed | Yes | Yes | Mixed reference evidence — review; not proven legacy |
| Minimusha | 25137:184:captain; 39763:184:captain | Rescue [Eillun Farmer] Thorn #44887; Defend [Eillun Farmer] Dr. Root #42131; Rescue [Eillun Farmer] Dr. Root #30348 | Yes | Yes | Current reference/spawn evidence |
| [Tormented Soul] Nergal | 25495:190:captain; 29436:190:captain | Ankou's Asylum (Story) #50040; Ankou's Asylum #46476 | Yes | Yes | Confirmed dungeon difficulty variants |
| [God of Death] Ankou | 25961:180:super; 58517:195:super | Ankou's Asylum #46476; Ankou's Asylum (Story) #50040 | Yes | Yes | Confirmed dungeon difficulty variants |
| [God of Death] Blazing Ankou | 26157:180:super; 31853:200:super | Ankou's Asylum #46476; Ankou's Asylum (Story) #50040 | Yes | Yes | Confirmed dungeon difficulty variants |
| Mushbro | 29628:188:captain; 49553:188:captain | Rescue [Eillun Farmer] Thorn #44887; Defend [Eillun Farmer] Dr. Root #42131; Rescue [Eillun Farmer] Dr. Root #30348 | Yes | Yes | Current reference/spawn evidence |
| [Anguished Soul] Mara | 30425:193:captain; 49205:193:captain | Ankou's Asylum (Story) #50040; Ankou's Asylum #46476 | Yes | Yes | Confirmed dungeon difficulty variants |
| Oldroot | 30740:182:captain; 35732:182:captain | Rescue [Eillun Farmer] Sprout #57115; Rescue [Eillun Farmer] Thorn #44887; Defend [Eillun Farmer] Dr. Root #42131; Rescue [Eillun Farmer] Dr. Root #30348 | Yes | Yes | Current reference/spawn evidence |
| [Event] Giant Mr. Pumpkin | 31085:101:giant; 33098:20:giant; 53887:61:giant | None exposed | Yes | No | Event records present |
| [Twisted Soul] Orcus | 39205:189:captain; 41768:189:captain | Ankou's Asylum (Story) #50040; Ankou's Asylum #46476 | Yes | Yes | Confirmed dungeon difficulty variants |
| Lady Bloom | 40234:186:captain; 52945:186:captain | Rescue [Eillun Farmer] Thorn #44887; Defend [Eillun Farmer] Dr. Root #42131; Rescue [Eillun Farmer] Dr. Root #30348 | Yes | Yes | Current reference/spawn evidence |
| Monument of Death | 43159:195:super; 55961:195:super | Ankou's Asylum (Story) #50040; Ankou's Asylum #46476 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Violent Soul] Ghed  | 44752:194:captain; 57515:194:captain | Ankou's Asylum (Story) #50040; Ankou's Asylum #46476 | Yes | Yes | Confirmed dungeon difficulty variants |
| [God of Death] Demonic Ankou | 49835:180:super; 54177:200:super | Ankou's Asylum #46476; Ankou's Asylum (Story) #50040 | Yes | Yes | Confirmed dungeon difficulty variants |
| [Demonic Soul] Hel | 51026:191:captain; 54794:191:captain | Ankou's Asylum #46476; Ankou's Asylum (Story) #50040 | Yes | Yes | Confirmed dungeon difficulty variants |

## Near-name candidates (never identity matches)

NFKC/case/punctuation/whitespace normalization is separate from title/role/difficulty stripping. Fuzzy candidates compare every normalized name pair of at least four characters: edit distance ≤1 for short names, ≤2 otherwise, and relative distance ≤20%. These heuristics identify review candidates, not duplicate identities. Drifter versus Rifter and Red Mantis A/B/C are examples where similarity does not authorize merging.

| Name A | Name B | IDs | Edit distance |
| --- | --- | --- | --- |
| 2nd chef muffrin | 3rd chef muffrin | 7283, 9790 | 2 |
| ant turtle | giant turtle | 252, 1597, 2519, 8504, 13224, 19865, 31416 | 2 |
| captain boo | captain hobo | 596, 9734 | 2 |
| captain kern | captain okean | 9014, 15246 | 2 |
| captain luia | captain mia | 3209, 4521 | 2 |
| female zombie | male zombie | 6323, 9220 | 2 |
| forgotten captain drifter | forgotten captain rifter | 50881, 51994 | 1 |
| forgotten drifter | forgotten rifter | 31735, 33737 | 1 |
| forgotten giant drifter | forgotten giant rifter | 24575, 47859 | 1 |
| forgotten great drifter | forgotten great rifter | 30124, 54471 | 1 |
| forgotten small drifter | forgotten small rifter | 39184, 49818 | 1 |
| giant boo | giant hobo | 2774, 3507 | 2 |
| giant demian | giant dorian | 6172, 13313 | 2 |
| giant kern | giant okean | 4149, 12881 | 2 |
| giant luia | giant mia | 3491, 6243 | 2 |
| iren | siren | 1344, 2000, 3846, 9338, 10120, 18091, 22880 | 1 |
| lord demian | lord dorian | 16175, 58428 | 2 |
| red mantis a | red mantis b | 5377, 6658 | 1 |
| red mantis a | red mantis c | 5377, 6035 | 1 |
| red mantis b | red mantis c | 6035, 6658 | 1 |
| small boo | small hobo | 6260, 7751 | 2 |
| small kern | small okean | 7628, 13645 | 2 |
| small luia | small mia | 9224, 9424 | 2 |
| violet boo | violet hobo | 5847, 6769 | 2 |
| violet demian | violet dorian | 5357, 18866 | 2 |
| violet kern | violet okean | 4273, 17273 | 2 |
| violet luia | violet mia | 887, 7877 | 2 |

## Core-equivalent / internal-metadata candidates

These fingerprints ignore only ID, localized name, icon, location/spawn metadata and the experience-table array. They retain level, event, rank, statistics, drop definitions and other exposed mechanics. They are not byte-identical full records.

| IDs | Names | Differing raw fields |
| --- | --- | --- |
| 1716, 4107 | Rubo / Ren | id, name, icon, location, spawns |
| 3159, 8305 | Earl Vermelho / Gray Earl | id, name, icon |
| 3582, 4193 | Mocomochi / Grumpy elf | id, name, icon |
| 3713, 4894 | Lord Mia / Lord Lykanos | id, name, icon |
| 6323, 9220 | Male Zombie / Female Zombie  | id, name, icon |
| 9918, 12973 | Deviant Mr. Pumpkin / Wild Turkey | id, name, icon |
| 10801, 18819 | null | id, icon |

Same-name metadata-only pairs: null [10801, 18819]. The other core-equivalent groups include event reskins or different display/resource records. None was generated by NAOL; all IDs exist independently in the current official API. Do not merge even when damage/drop payloads match. Internal resource codes are not exposed, so no claim about identical server-side MI_* definitions is made.

## Reference coverage and limitations

Fetched and scanned 1224 monster records, 88 dungeon records, 88 world records, 803 quest records, 298 npc records, 827 skill records, 291 achievement records. Cross-record references include dungeon.monsters, monster.summoned/avenge, quest.endKillMonsters.monster, achievement.monsters/mainMonster and explicitly named monster-ID fields. NPC/world/skill records were scanned; no monster-ID fields were found there in this snapshot. Own monster spawn/location metadata is recorded separately from inbound references. Current API IDs and raw payloads were compared against all active-cache records and local normalized records. Beginning/end API versions and cache generations were checked for consistency.

The public API does not expose the complete server dungeon/spawn/event script graph, internal resource codes or independent drop-table IDs. Therefore this audit cannot prove that every API-listed monster is currently spawnable or that every no-reference record is legacy. Localized collisions preserve locale and all source IDs. No uncertain record is auto-excluded.

## Artifacts and reproduction

- `full-dataset-audit.json`: every record, references, source provenance, differences, 83 normalized groups, 194 family groups, localized collisions and classification/review flags.
- `monster-inventory.csv`: all 1,224 records for spreadsheet review.
- `scripts/audit-monster-dataset.mjs`: read-only reproduction; requires the existing ignored migration environment for database SELECTs. Run from naol-build with `node scripts/audit-monster-dataset.mjs`. It never updates database records or application data.
- Raw snapshots are retained in ignored `work/monster-audit/`; no credentials are written to reports.

No site deployment or game-data deletion was performed for this audit.

