# iRO Wiki formula audit

Checked2026-09-30. These are community-documented iRO models, not an official-server experiment. Stat cost/budget tables remain the RO-help-tool snapshot; this audit does not extend class/level support beyond the app's existing model.

## Rune Mastery

Source: https://irowiki.org/wiki/Rune_Mastery (formula, materials and2022-10-13 changelog).

Raw percent =30+2×RuneMastery+DEX/30+LUK/10+JobLevel/10+StoneBonus−RankPenalty.

The old app embedded69.4. Current Wiki shows base32..50 for skill1..10, following the2022-10-13 reduction from53..71. The new implementation exposes the terms rather than retaining a hardcoded preset.

| Stone | Bonus |
|---|---:|
| General |4|
| Quality |8|
| Rare |15|
| Ancient |30|
| Mystic |60|

| Rune | Minimum mastery | Rank | Penalty |
|---|---:|---|---:|
| Turisus |1|C|5|
| Isia |2|B|10|
| Pertz |3|B|10|
| Hagalas |4|C|5|
| Asir |5|C|5|
| Urj |6|A|15|
| Rhydo |7|C|5|
| Nosiege |8|A|15|
| Verkana |9|S|20|
| Lux Anima |10|S|20|

Test vector: mastery10/job70/Ancient/Verkana,DEX90,LUK100 gives80 raw. Changing toMystic gives110 raw. No undocumented probability clamp is applied. The Wiki's98–100% comment about Rune activation does not establish a crafting cap.

## Create Deadly Poison

Source: https://irowiki.org/wiki/Create_Deadly_Poison

Raw percent=20+DEX×0.4+LUK×0.2. This matches the original reference. The documented formula has no additional Job/Base/INT term. It concerns Poison Bottle creation, not New Poison Creation.

Official iRO skill description corroborates that DEX/LUK matter, but does not publish the numeric formula: https://renewal.playragnarok.com/gameguide/classes_skill.aspx?c=25

## Prepare Potion

Sources: https://irowiki.org/wiki/Potion_Creation#Formula and https://irowiki.org/wiki/Instruction_Change

Raw percent=3×PreparePotion+PotionResearch+InstructionChange+JobLevel×0.2+DEX×0.1+LUK×0.1+INT×0.05+Potion_Rate.

**The Wiki explicitly flags this mathematics as disputed.** We retain that qualification in the UI. The old fixed54 can be reproduced by certain skill/job assumptions before an item modifier, but the old source does not document its intended preset.

| Recipe | Potion_Rate (percentage points) |
|---|---|
| Red, Yellow, White Potion |15..25|
| Alcohol |5..15|
| Acid, Marine Sphere, Bottle Grenade, Plant Bottle |−5..5|
| Blue Potion, Anodyne, Aloevera, Embryo, Elemental Potion, Condensed Red Potion |−5|
| Condensed Yellow Potion |−10..−5|
| Condensed White Potion, Glistening Coat |−15..−5|

The range is preserved as documented endpoints. No probability distribution or midpoint assumption is introduced. Instruction Change adds1 percentage point per level; use0 when not applicable. The source does not clearly define all homunculus-state conditions, so the app does not infer them.

Test vector: PreparePotion10/PotionResearch10/InstructionChange5/Job70,DEX90,LUK100,INT50,RedPotion produces95.5..105.5 raw.

This is NOT Genetic Special Pharmacy, which uses a different Creation/Difficulty/yield model: https://irowiki.org/wiki/Special_Pharmacy . Likewise New Poison Research uses a separate skill/model: https://irowiki.org/wiki/New_Poison_Research .

Official iRO Alchemist page confirms skill requirements, not the full numeric formula: https://renewal.playragnarok.com/gameguide/classes_skill.aspx?c=18

## Remaining evidence limits

- Crafting cap and rounding rules are not explicitly established by these formula pages; the optimizer maximizes raw model output
- Two decimal places are display formatting, not asserted game-engine rounding
- Fixed recipe/skill/job terms do not change the optimum of these linear raw-score formulas; they do change the displayed rate or interval
- Materials required and inventory are not checked; a valid stat/skill plan is not proof the player can craft now
- No new-poison,SpecialPharmacy,fourth-class or server-specific model is implied

## Multisource cross-check: rAthena and player reports

rAthena was inspected at pinned commit **e985006171d2eb320ee512a653f4c83aea3d81b6**, not a moving branch:
- [CDP, potion and Rune implementations](https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/src/map/skill.cpp#L12955-L13053)
- [Minimum threshold / random roll handling](https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/src/map/skill.cpp#L13234-L13303)

| Topic | Comparison | Interpretation used here |
|---|---|---|
| Create Deadly Poison | Wiki and rAthena agree on20+.4DEX+.2LUK | Strongest cross-source agreement; official iRO only confirms which stats matter |
| Rune base / stones | Current Rune base and stone bonuses broadly agree | Supports the corrected Wiki model, not proof of exact iRO implementation |
| Lux Anima penalty | WikiS-rank penalty20; pinned rAthena default penalty15 | App explicitly uses Wiki20. Changes displayed raw rate by5pp, **not the optimal stat allocation** because this is a fixed term |
| Rune arithmetic | rAthena truncates its DEX contribution to hundredths: floor(100DEX/30)/100 | App retains documented Wiki division; does not imply Wiki specifies emulator rounding |
| Potion | rAthena has different Research coefficient/recipe offsets and random terms in0.1pp steps | Differences must be assessed together: Research.5 vs Wiki1 partly cancels item offsets atResearch10. Odd INT can differ by.05pp. Do not equate Wiki intervals with a proven live-iRO RNG distribution |
| End-of-roll bounds | rAthena rolls against10000 and enforces minimum threshold; its effective outcomes bound at100% | Emulator behavior is not applied silently to the Wiki raw-score objective |

The [rAthena Rune update commit](https://github.com/rathena/rathena/commit/44e5c5bcc7c19ab34dc284b18d4e9a40a96ebbbe) explicitly concerns **kRO**. The [official kRO2019 notice](https://ro.gnjoy.com/news/notice/View.asp?BBSMode=10001&seq=7177) corroborates reduced Rune success / increased yield, but is neither exact numeric proof nor an iRO patch record.

Player reports add context, not controlled verification:
- [WarpPortal brewing discussion2011](https://forums.warpportal.com/index.php?/topic/40307-brewing-alchemist/): DrAzzy supports the Wiki potion model and reports100% ordinary potion outcomes. Historical and without controlled logs
- [WarpPortal Bottle Grenade discussion2014](https://forums.warpportal.com/index.php?/topic/145921-why-do-i-still-fail-when-i-make-bottle-grenades/): players discuss±5 modifier, later incorporated into Wiki. This is **provenance for the Wiki**, not independent replication

Confidence is highest for CDP's linear coefficients, good but qualified for Rune's documented base/material terms, and lower for exact Potion outcomes. No current controlled iRO test establishes every rounding/cap/RNG detail. Hence this release removes the generic development placeholder but retains named evidence limitations.
