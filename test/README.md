# test: shooter × pixel dialogue (decompose & combination)

Playable G1 (shooter), G2 (pixel dialogue reference) and five G3s (shooter + dialogue): the GT, Opus 5.5 and astra
from G1 source + G2 video, and Opus 5.5 and astra from G1 source + a text description (name-only baseline).
Below the player: the G3 transplant results on 9 hidden input sequences (tick-by-tick state, dialogue, battle events,
pixels), side-by-side videos per sequence and each agent's code diff.

Source, tools and runs live in `/shared/perception/personals/beijia/idea/decompose&combination/` (see its README.md).
This folder is generated, do not edit by hand:

```bash
cd "/shared/perception/personals/beijia/idea/decompose&combination"
./build.sh                                        # bundles web/play.js, web/results.js
python3 tools/eval_g3.py --run-id r1 --runs r1 r1-text   # web/g3_results.js, web/hat_*.js, web/media/r1/
tools/export_static.sh /shared/perception/personals/beijia/Sim_AngryBird_Visualization/test
```
