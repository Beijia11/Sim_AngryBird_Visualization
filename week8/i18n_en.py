"""English text for the copied tennis demos. Used only by build_week8.py.

DATA maps whole strings (or sentence fragments) inside the copied JSON data.
CODE maps exact code snippets per copied file. Every CODE key must occur in its
source file, and no Chinese may remain in any output; the build stops otherwise.
"""

NAMES = {
    '驻位': 'Stationary', '左移': 'Left', '右移': 'Right', '前移': 'Forward', '后移': 'Back',
    '正手': 'Forehand', '反手': 'Backhand', '发球': 'Serve',
}

PHASES = {
    '驻位': 'Idle', '进入与持续移动': 'Entering / moving', '制动 / 换向': 'Braking / turning',
    '可接收击球请求': 'Ready for a stroke request', '引拍': 'Take-back',
    '挥拍与随挥': 'Swing and follow-through', '恢复': 'Recovery',
}

# Sentence fragments of the hand-review notes in fsm.json; a note is several of these.
NOTE_FRAGMENTS = {
    '伸拍后的阶段结束与下一段发球之间不连续，边界无法完整确认。':
        'The end of the reach is not continuous with the next serve; the boundary cannot be fully confirmed.',
    '剪辑/比分变化，之后近端球员被比分条大面积遮挡。':
        'Cut / score change; afterwards the near player is largely covered by the score bar.',
    '剪辑前后位置/比赛阶段改变；不把画面切换当作身体直接转换。':
        'Position and match phase change across the cut; a cut is not treated as a direct body transition.',
    '剪辑后位置与比分改变，不生成虚构的放松→准备动作。':
        'Position and score change after the cut; no invented relax → ready motion is generated.',
    '发球后的重整很快接到回击，抽帧证据不能确认已恢复准备，也不能证明重整可任意打断。':
        'The reset after the serve runs straight into a return; sampled frames cannot confirm a recovered ready stance, nor that the reset can be interrupted at any time.',
    '回合画面跳到下一段发球，不能从剪辑推出运动转换。':
        'The rally cuts to the next serve; no motion transition is inferred from a cut.',
    '复核后仅确认追球/跑动，未确认常规正反手击球；不再将此段描述为已发生的伸拍/救球。':
        'Review confirms only chasing / running, not a regular forehand or backhand; this segment is no longer described as a reach / save.',
    '抬拍和转体已出现，后续是否形成常规击球尚未确定；不收录为纯前移。':
        'Racket lift and body turn appear, but whether a regular stroke follows is unconfirmed; not collected as pure forward movement.',
    '拍臂挥动后连续随挥；精确触球帧不单列。':
        'The racket arm swings and continues into the follow-through; the exact contact frame is not separated.',
    '双手共同带拍，在身体反手侧完成挥动，随后双手收至肩部；不依据移动方向。':
        'Both hands take the racket back and swing on the backhand side, finishing at the shoulder; not decided by movement direction.',
    '引拍后非持拍手分开，持拍臂单臂向前上方挥动，随后高位/绕头随挥；与近端球员正手序列一致。':
        "After the take-back the free hand separates, the racket arm swings forward and up alone, then a high / over-the-head follow-through; consistent with the near player's forehand sequence.",
    '比分条遮住部分身体，但前后可见的拍臂与随挥足以判断手型；接触瞬间和阶段边界仍较粗。':
        'The score bar covers part of the body, but the visible racket arm and follow-through are enough to judge the stroke; contact moment and phase boundaries remain rough.',
    '接续追球/跑动，前段未确认击球；不能把此处当作已确认的击球恢复。':
        'Continues chasing / running; the preceding stroke is unconfirmed, so this is not a confirmed recovery.',
    '放松/分间整理不在本次回击控制范围；不建立 rest 游戏状态。':
        'Relaxing between points is outside the rally-control scope; no rest game state is built.',
    '无持续改变接球位置，仍有小幅垫步/分腿跳。':
        'No sustained change of receiving position; small adjustment steps / split steps remain.',
    '有斜向分量；前/后只表示该区间的主导趋势，不能视为纯直线素材。':
        'Has a diagonal component; forward / back is only the dominant trend of this interval, not pure straight-line material.',
    '紧接前一动作，收拍并重整支撑；可同时移位。':
        'Directly after the previous motion: bring the racket back and reset the stance; may move at the same time.',
    '自抛球和向上挥拍序列；作为一段连续发球动作，内部不再细拆。':
        'Self toss and upward swing; kept as one continuous serve, not split further.',
    '转体和拍臂带开可见。手型可判。':
        'Body turn and racket take-back are visible. Stroke type is identifiable.',
    'v5 起点复核：61.0s 仍在调整，61.1s 拍臂上提、转体开始。':
        'v5 onset review: still adjusting at 61.0s; racket arm lifts and the turn begins at 61.1s.',
    'v5 起点复核：63.5s 调整支撑；63.6s 起拍和躯干转向开始，63.7–63.8s 持续引拍。':
        'v5 onset review: stance adjustment at 63.5s; racket lift and trunk turn begin at 63.6s; take-back continues 63.7–63.8s.',
    'v5 起点复核：71.9s 仍为接球调整，72.0s 起已抬拍转体。':
        'v5 onset review: still adjusting to receive at 71.9s; racket lifted and body turned from 72.0s.',
    'v5 起点复核：90.5s 调整，90.6s 起转体，90.7s 明显抬拍。':
        'v5 onset review: adjusting at 90.5s; turn begins at 90.6s; clear racket lift at 90.7s.',
    '近端球员连续帧复核：比分条部分遮挡，但引拍与高位随挥可辨为正手。阶段边界粗标，不代表精确接触时间。':
        'Consecutive-frame review of the near player: partly covered by the score bar, but the take-back and high follow-through identify a forehand. Phase boundaries are rough, not the exact contact time.',
    'v5 起点复核：74.9s 仍在跑动，75.0s 转体抬拍，75.1–75.2s 引拍清楚。':
        'v5 onset review: still running at 74.9s; turn and racket lift at 75.0s; clear take-back 75.1–75.2s.',
    '连续原图中的主导移动方向；未做球场坐标/速度校准。':
        'Dominant movement direction in consecutive source frames; no court-coordinate or speed calibration.',
    '连续原图可见减速/改变支撑，常与击后重整重叠；不是独立通用制动片段。':
        'Consecutive source frames show deceleration / support change, often overlapping the post-stroke reset; not a standalone braking clip.',
    '遮挡、剪辑或主导方向/转向边界尚未确认；不使用旧 adjust 标签冒充方向标注。':
        'Occlusion, cut, or direction / turn boundary unconfirmed; the old adjust label is not reused as a direction label.',
}

REASONS = {
    '同一次击球的内部阶段推进': 'Phase advance within the same stroke',
    '开始引拍／发球：退出未击球状态': 'Take-back / serve starts: leave non-hitting',
    '恢复结束：返回未击球状态': 'Recovery ends: back to non-hitting',
    '未击球期间移动方向／驻位变化': 'Movement direction / stationary change while not hitting',
}

# Whole strings in curated/bank.json (also exported as game/v3-data.js).
BANK = {
    **NAMES,
    '同状态续播': 'Same-state continuation',
    '视频观察关系': 'Observed in video',
    '控制补充': 'Control supplement',
    '已检查接缝，仍需实际操作评价': 'Seam checked; still needs hands-on evaluation',
    '姿态差较大，需检查拉伸': 'Large pose gap; check for stretching',
    '视频观察': 'Video observation',
    '视频观察 + 主导方向推断（含斜向、未校准深度）':
        'Video observation + dominant-direction inference (diagonal, uncalibrated depth)',
    '外部遮挡/截断筛选通过；低置信关节不画线':
        'Passed external occlusion / truncation screening; low-confidence joints are not drawn',
    '整身击球片段，允许身体位移；仅击球状态生效。':
        'Whole-body stroke clip; body displacement allowed; applies to the hitting state only.',
    **{f'未引拍、未挥拍、未处于击球恢复时的{zh}；方向按近端球员画面运动判断。':
       f"{en} while not taking back, swinging or recovering; direction judged from the near player's on-screen motion."
       for zh, en in NAMES.items() if zh in ('驻位', '左移', '右移', '前移', '后移')},
    '保留完整驻位段；首中尾双脚和头部可见，朝向较一致。放弃分数最高但头部混入白线的候选。':
        'Keeps the whole stationary segment; feet and head visible at start, middle and end, facing consistent. Rejected the top-scoring candidate whose head merged with a white court line.',
    '短驻位/准备步，仍不是静止站姿。': 'Short stationary / ready steps; still not a static stance.',
    '左移表达清楚，连续时间较长，腿部轮廓完整；可在片内挑选更适合续播的起止帧。':
        'Clear left movement, relatively long and continuous, full leg outline; start and end frames can be chosen inside the clip for continuation.',
    '原尾段明显转体，精选时避免把尾部转体直接接回片头。':
        'The original tail has a clear body turn; the selection avoids joining that turn straight back to the start.',
    '右移候选中较长，骨架稳定性靠前，头和双腿清楚；比分栏在人物外。':
        'One of the longer right-move candidates with a stable skeleton; head and both legs clear; the score bar is outside the player.',
    '原片存在比分栏，透明导出仍有细小边缘误差。':
        'The source has a score bar; the transparent export still has small edge errors.',
    '相比高分但只有9帧的候选，18帧能表达更完整的前向调整，首中尾头脚可见。':
        'Compared with a higher-scoring 9-frame candidate, 18 frames show a fuller forward adjustment; head and feet visible at start, middle and end.',
    '含斜向分量，只是短距离前向调整，不是完整前跑循环。':
        'Has a diagonal component; only a short forward adjustment, not a full forward-run loop.',
    '当前唯一通过筛选的后移片段，保留完整21帧，头和脚可见。':
        'The only back-move clip that passed screening; all 21 frames kept, head and feet visible.',
    '无其他后移候选，不能声称经过多素材优选；自循环仍需合成。':
        'No other back-move candidate, so it was not chosen among several; its self-loop still has to be synthesized.',
    '完整54帧正手，主要关节置信度和稳定性较好，抽查引拍/挥拍/恢复头腿均可见。':
        'Complete 54-frame forehand with good joint confidence and stability; head and legs visible in sampled take-back / swing / recovery frames.',
    '球拍与手臂相叠时边缘不完整，不做球拍补全。':
        'Edges are incomplete where racket and arm overlap; the racket is not completed.',
    '完整48帧反手；放弃分数更高但中段腿部蒙版明显缺损的backhand-01，优先人体像素完整。':
        'Complete 48-frame backhand; rejected the higher-scoring backhand-01 whose leg mask breaks mid-clip, preferring complete body pixels.',
    '随挥时手臂自遮挡，部分骨架点置信度较低。':
        'Arms self-occlude during the follow-through; some keypoints have low confidence.',
    '保留完整48帧发球；上挥手臂较伸展，首中尾头和腿可见，恢复较稳定。':
        'Complete 48-frame serve; the arm extends well on the upswing, head and legs visible at start, middle and end, stable recovery.',
    '高速上挥有运动模糊，球拍抠图不完整。': 'The fast upswing has motion blur; the racket matte is incomplete.',
}

N = "{stationary:'Stationary',left:'Left',right:'Right',forward:'Forward',back:'Back',forehand:'Forehand',backhand:'Backhand',serve:'Serve'}"

CODE = {
    # ---------------- control (curated v3 keyboard page) ----------------
    'control/curated-app.js': {
        "'离线动作库尚未加载'": "'Offline motion library not loaded yet'",
        "'离线播放中'": "'Playing offline'",
        "'已暂停，按Space继续'": "'Paused; press Space to continue'",
        "'窗口失焦：已清空输入并暂停'": "'Window lost focus: inputs cleared and paused'",
        "'页面隐藏：已清空输入并暂停'": "'Page hidden: inputs cleared and paused'",
        "controller.pause('已暂停')": "controller.pause('Paused')",
        "`${data.clips.length} 条精选状态片段 · ${data.relations.length} 类连接 · ${data.transitions.length} 个离线出口`":
            "`${data.clips.length} curated state clips · ${data.relations.length} connection types · ${data.transitions.length} offline exits`",
        "· ${r.count} 条`": "· ${r.count}`",
        "${'精选'} ·": "${'curated'} ·",
        "'加载离线素材'": "'Loading offline assets'",
        "'等待预加载'": "'Waiting for preload'",
        "`离线 transition ${controller.active.index+1}/5`": "`offline transition ${controller.active.index+1}/5`",
        "`等出口 #${controller.waiting.exitFrame}`": "`waiting for exit #${controller.waiting.exitFrame}`",
        "'完整击球播放'": "'full stroke playing'",
        "'状态序列播放'": "'state clip playing'",
        "||'无按键'": "||'no keys'",
        "'开始 / 继续':'暂停 Space'": "'Start / resume':'Pause (Space)'",
        "'点击场地或按键开始 · 播放已生成的状态 / transition'":
            "'Click the court or press a key · plays pre-generated states / transitions'",
        " · 离线 ${controller.active.index+1}/5帧`": " · offline ${controller.active.index+1}/5 frames`",
        "/${controller.clip.count}帧`": "/${controller.clip.count} frames`",
        "${'精选双侧对齐 / 离线生成'} · 运行时 MLS：0`": "${'curated two-sided alignment / generated offline'} · runtime MLS: 0`",
        "'状态与接缝均已离线生成，运行时只检索、解码和播放。'":
            "'States and seams are all generated offline; at runtime the page only looks up, decodes and plays them.'",
        "`拒绝 ${names[e.kind]}：${e.reason}`": "`Rejected ${names[e.kind]}: ${e.reason}`",
        "`请求 ${names[e.kind]}`": "`Request ${names[e.kind]}`",
        "`接缝完成 → 目标第 ${e.resumeFrame} 帧`": "`Seam done → target frame ${e.resumeFrame}`",
        "'击球完成，读取当前方向'": "'Stroke done; reading the current direction'",
    },
    'control/curated-controller.js': {
        "'准备离线素材'": "'Preparing offline assets'",
        "'离线播放就绪；按方向键或击球键开始'": "'Offline playback ready; press an arrow or stroke key'",
        "pause(reason='暂停')": "pause(reason='Paused')",
        "'拒绝：击球播放或请求已锁定，不能重复启动 / 改型'":
            "'Rejected: a stroke is playing or queued; it cannot restart or change type'",
        "'击球尚未完成或已排队'": "'Stroke not finished or already queued'",
        "'拒绝：发球只能从驻位且没有移动请求时启动'":
            "'Rejected: the serve only starts from stationary with no movement key held'",
        "'发球要求驻位'": "'Serve requires stationary'",
        "'已接收击球请求；等待绑定的离线出口'": "'Stroke request accepted; waiting for its bound offline exit'",
        "'等待离线素材加载（不计算MLS）'": "'Waiting for offline assets (no MLS computed)'",
        "'离线接缝出口不匹配'": "'Offline seam exit mismatch'",
        "'播放精选离线过渡'": "'Playing curated offline transition'",
        "'播放离线过渡'": "'Playing offline transition'",
        "'离线过渡完成，继续目标动作'": "'Offline transition done; continuing the target motion'",
        "'缺少离线连接：'": "'Missing offline connection: '",
        "'播放至离线出口，再切换目标动作'": "'Playing to the offline exit, then switching to the target motion'",
        "'预览指定离线连接'": "'Previewing the selected offline connection'",
    },
    'control/offline-bank.js': {
        "'离线素材加载失败：'": "'Offline asset failed to load: '",
        "'离线图集尚未就绪：'": "'Offline atlas not ready: '",
    },
    'control/curated-view.js': {
        # Show only the states and transitions chosen for the week 8 page (set in control/index.html).
        "export function initInspector(data,controller,names){":
            "export function initInspector(data,controller,names){const SHOW=window.WEEK8_SHOW;",
        "for(const c of data.clips){": "for(const c of data.clips.filter(c=>SHOW.states.includes(c.behavior))){",
        "for(const r of data.relations){const t=data.transitions.find(t=>t.id===r.representative);":
            "for(const r of data.relations.filter(r=>SHOW.relations.includes(r.id))){const t=data.transitions.find(t=>t.id===r.representative);",
        # The raw sequence library is not packaged.
        "const link=document.createElement('a');link.href='../sequences/'+c.source;link.target='_blank';link.rel='noopener';link.textContent='查看原始画面与骨架 ↗';article.append(link);": "",
        "title+'人物与骨架视频'": "title+' person and skeleton video'",
        "'播放视频 + 骨架'": "'Play video + skeleton'",
        "'正在查看素材视频；按键可回到操控'": "'Viewing an asset video; press a key to return to control'",
        '现在是什么状态，用的是哪一段。': 'What state is it in, and which clip is playing?',
        '与上方操控同步': 'Synced with the control on the left',
        '<h3>实时状态机</h3>': '<h3>Live state machine</h3>',
        '未击球与击球互斥。显示当前状态可达的连接；橙色箭头表示正在播放的 transition。':
            'Non-hitting and hitting are mutually exclusive. Shows the connections reachable from the current state; the orange arrow is the transition now playing.',
        '<h3 id="current-title">当前片段</h3>': '<h3 id="current-title">Current clip</h3>',
        '当前使用的人物像素与骨架': 'Person pixels and skeleton in use',
        '每个状态，一条主片段。': 'One main clip per state.',
        '<span class="tag">8 条 · 人物 / 骨架同步</span>':
            '<span class="tag">${SHOW.states.length} of 8 states shown · person / skeleton in sync</span>',
        '按画面完整、动作清楚、关节稳定和衔接条件选择。左移与右移修剪起止帧，击球保留完整动作；后移只有一条可用素材。这里的“精选”是本轮审阅选择，不是已经证明最优。':
            'Chosen for complete frames, clear motion, stable joints and joinability. Left and right moves are trimmed at both ends; strokes keep the full motion. "Curated" means chosen in this review, not proven optimal.',
        '把这些片段，逐对接起来。': 'Join these clips, pair by pair.',
        '<span class="tag">51 类 · 全部离线制作</span>':
            '<span class="tag">${SHOW.relations.length} of 51 types shown · all made offline</span>',
        '视频包含源动作尾段 → 5帧离线过渡 → 目标动作，橙色骨架是合成引导。两侧人物图先对齐到同一引导姿态再混合，网页只播放结果。每类展示一个选定出口；其余按键出口可在上面的离线库中检查。':
            'Each video: tail of the source motion → 5-frame offline transition → target motion; the orange skeleton is the synthesized guide. Both person images are first warped to the same guide pose and then blended; the page only plays the result. Each type shows one chosen exit.',
        '<label>从 <select': '<label>From <select',
        '<label>到 <select': '<label>To <select',
        '全部状态': 'All states',
        "'八状态实时状态机'": "'Eight-state live state machine'",
        "[[25,'未击球'],[445,'击球']]": "[[25,'Non-hitting'],[445,'Hitting']]",
        "· 原片 ${c.start.toFixed(3)}–${c.end.toFixed(3)}s · ${c.count}帧 /":
            "· source ${c.start.toFixed(3)}–${c.end.toFixed(3)}s · ${c.count} frames /",
        "`${t.origin} · 源 #${t.fromFrame} → 目标 #${t.toFrame} · 本类 ${r.count} 个离线出口`":
            "`${t.origin} · source #${t.fromFrame} → target #${t.toFrame} · ${r.count} offline exits of this type`",
        "`原片 ${t.sourceTime.toFixed(3)}s →": "`source ${t.sourceTime.toFixed(3)}s →",
        "'在上方操控区播放这条'": "'Play this in the control below'",
        "`${n} / 51 类连接`": "`${n} / 51 connection types`",
        "'当前播放的像素'": "'Pixels now playing'",
        "'离线保存的引导骨架':'源视频估计骨架'": "'Guide skeleton saved offline':'Skeleton estimated from the source video'",
        " · 过渡 ${active.index+1}/5`:`${names[state]} · 当前状态片段`":
            " · transition ${active.index+1}/5`:`${names[state]} · current state clip`",
        "[['正在用',edge.id],['源片段',`${source.originalClip} · 精选帧 #${edge.fromFrame}`],['目标片段',`${target.originalClip} · 精选帧 #${edge.toFrame} 进入`],['原片对应',`":
            "[['Using',edge.id],['Source clip',`${source.originalClip} · curated frame #${edge.fromFrame}`],['Target clip',`${target.originalClip} · enters at curated frame #${edge.toFrame}`],['Source time',`",
        "[['正在用',source.originalClip],['精选范围',`": "[['Using',source.originalClip],['Curated range',`",
        "['当前帧',`${controller.frame+1} / ${source.count} · 原片 ${": "['Frame',`${controller.frame+1} / ${source.count} · source ${",
        "'当前为离线合成过渡，没有单一原视频时间；骨架是合成时保存的引导，不是重新估计。'":
            "'An offline synthesized transition has no single source-video time; the skeleton is the guide saved at synthesis, not re-estimated.'",
        " · 已保存的过渡第 ${active.index+1}/5 帧`:`当前：${names[state]}${controller.paused?' · 已暂停':''}":
            " · saved transition frame ${active.index+1}/5`:`Now: ${names[state]}${controller.paused?' · paused':''}",
    },
    # ---------------- game (tennis_simple_v3: Simple world + v3 near player) ----------------
    'game/app.js': {
        "names={stationary:'驻位',left:'左移',right:'右移',forward:'前移',back:'后移',forehand:'正手',backhand:'反手',serve:'发球'}": 'names=' + N,
        "'开始 / 继续':'暂停 Space'": "'Start / resume':'Pause (Space)'",
        "textContent='开始操控'": "textContent='Start playing'",
        "pause(reason='已暂停')": "pause(reason='Paused')",
        "'已重置。开始后，两版接收同样的输入。'": "'Reset. After Start, both versions receive the same input.'",
        "||'无按键'": "||'no keys'",
        "'窗口失焦：输入已清空，游戏暂停。'": "'Window lost focus: inputs cleared, game paused.'",
        "'页面隐藏：游戏暂停。'": "'Page hidden: game paused.'",
        "'对照版本切换：已重置两边，点击开始后接收相同输入。'":
            "'Comparison switched: both sides reset; after Start they receive the same input.'",
        "'修改前 · v3 近端':'当前视频 · Simple 基线'": "'Before · v3 near player':'This video · Simple baseline'",
        "'匀速平移 / 续播停位置':'直接进入动作 / 片内采样'":
            "'Constant shift / stops on continuation':'Direct action entry / in-clip sampling'",
        "'准备对照版本…'": "'Preparing comparison…'",
        "'A 修改前的v3移动':'A 当前视频Simple基线'": "'A v3 movement before the change':'A this video, Simple baseline'",
        "'正在查看原视频，游戏已暂停。'": "'Watching the source video; game paused.'",
        "'正在查看固定按键回放，游戏已暂停。'": "'Watching the fixed-input replay; game paused.'",
        "pause('原视频来源定位')": "pause('Seeking the source video')",
        "`接收 ${names[e.kind]}请求 → 等待离线出口`": "`Accepted ${names[e.kind]} request → waiting for offline exit`",
        "`拒绝 ${names[e.kind]}：${e.reason}`": "`Rejected ${names[e.kind]}: ${e.reason}`",
        "· 已存接缝 · 出口 #${e.fromFrame}`": "· stored seam · exit #${e.fromFrame}`",
        "`接缝完成 → 目标 #${e.resumeFrame}`": "`Seam done → target #${e.resumeFrame}`",
        "`动作事件帧 #${e.frame} · 原片 ${e.sourceTime.toFixed(2)}s`": "`Action event frame #${e.frame} · source ${e.sourceTime.toFixed(2)}s`",
        "`${names[e.kind]}到达挥拍事件 → 开启范围判断`": "`${names[e.kind]} reached its swing event → hit-range check on`",
        "`近端命中 · ${names[e.kind]||'挥拍'}${e.distance!==undefined?' · 距离 '+e.distance+'px':''}`:'远端简化回球'":
            "`Near hit · ${names[e.kind]||'swing'}${e.distance!==undefined?' · distance '+e.distance+'px':''}`:'Far player: simplified return'",
        "`未命中：${e.reason}`": "`Miss: ${e.reason}`",
        "`${e.winner==='near'?'近端':'远端'}得分 · ${e.reason}`": "`${e.winner==='near'?'Near':'Far'} scores · ${e.reason}`",
        "`新回合 · 球目标 x=": "`New point · ball target x=",
        "m.mode+'：'+m.message;pause('发生运行错误，已暂停')": "m.mode+': '+m.message;pause('Runtime error; paused')",
        "'已就绪。按方向键或 J / K 开始。'": "'Ready. Press an arrow key or J / K to start.'",
        "comparison==='motion'?'修改前 · ':'Simple · '": "comparison==='motion'?'Before · ':'Simple · '",
        "` · 过渡 ${i.transition.index+1}/${i.transition.count}`": "` · transition ${i.transition.index+1}/${i.transition.count}`",
        "`近端 ${s.score.near} : ${s.score.far} 远端`": "`Near ${s.score.near} : ${s.score.far} Far`",
        "'标签动作回放 · 不是原比赛精确重演'": "'Label replay · not an exact re-enactment of the match'",
        "`来球 ${eta.toFixed(1)}s · 目标横向 ${Math.round(s.ball.to[0]-s.near.x)}px · 提前约 0.8s 请求挥拍；命中仍取决于位置。`":
            "`Ball arrives in ${eta.toFixed(1)}s · lateral offset ${Math.round(s.ball.to[0]-s.near.x)}px · request the swing about 0.8s early; a hit still depends on position.`",
        "'球已飞向远端。可以提前移动准备下一次。'": "'The ball is heading to the far side. Move early for the next one.'",
        "`回合结束 · ${Math.max(0,s.wait).toFixed(1)}s 后喂球，或驻位按 S 发球。`":
            "`Point over · next ball in ${Math.max(0,s.wait).toFixed(1)}s, or press S while stationary to serve.`",
        '未击球 / NON-HITTING': 'NON-HITTING',
        '击球 / HITTING': 'HITTING',
        "textContent='状态序列'": "textContent='State clip'",
        "'请求等待已存出口；只有当前骨架进入目标动作后，游戏才继续对应行为。'":
            "'Requests wait for a stored exit; the game acts only once the skeleton has entered the target motion.'",
        "`离线过渡 ${e.index+1}/${e.count}`": "`Offline transition ${e.index+1}/${e.count}`",
        "· 源 #${e.fromFrame} → 目标 #${e.toFrame} → 续播 #${e.resumeFrame}`": "· source #${e.fromFrame} → target #${e.toFrame} → resume #${e.resumeFrame}`",
        "[['正在播放',i.transition.id],['已存接缝帧',`": "[['Playing',i.transition.id],['Stored seam frame',`",
        "['来源 / 目标',`": "['Source / target',`",
        "['骨架类型','离线合成引导；非重估']": "['Skeleton','Offline synthesized guide; not re-estimated']",
        "[['原始片段',i.originalClip||i.clip],['当前帧',`": "[['Source clip',i.originalClip||i.clip],['Frame',`",
        "['源视频区间',i.source": "['Source interval',i.source",
        "['骨架类型','原视频检测骨架']": "['Skeleton','Detected from the source video']",
        "items.push(['水平位移',": "items.push(['Horizontal shift',",
        "{source:'原片轨迹',continuation:'同向续播',start:'起步',stop:'停止',reverse:'换向',locked:'锁定',other:'其他状态'}":
            "{source:'source trajectory',continuation:'same-direction continuation',start:'start',stop:'stop',reverse:'reverse',locked:'locked',other:'other state'}",
        "'已存引导帧':'已存原始帧'": "'Stored guide frame':'Stored source frame'",
        "'查看这类连接的代表视频 ↗':'查看当前状态的像素 / 骨架视频 ↗'":
            "'Representative video of this connection ↗':'Pixel / skeleton video of this state ↗'",
        "pause('标签动作回放结束。按动作键继续操控。')": "pause('Label replay finished. Press an action key to continue.')",
    },
    'game/baseline/world.js': {
        "'回合进行中：仅播放发球动作，不重置球'": "'Point in play: serve motion only, ball not reset'",
        "'远端未赶到简化回球范围'": "'Far player did not reach the simplified return range'",
        "'到达接球区域后未命中'": "'Reached the receiving area but missed'",
        "'挥拍窗口内球不在简化命中范围'": "'Ball outside the simplified hit range during the swing window'",
        "'当前视频 · Simple 本地适配基线'": "'This video · Simple local adaptation baseline'",
        "'左移'": "'move left'", "'右移'": "'move right'", "'前移'": "'move forward'", "'后移'": "'move back'",
        "'正手'": "'forehand'", "'反手'": "'backhand'",
        "'驻位发球（无活球时）'": "'serve from stationary (no live ball)'",
        "'下一球'": "'next ball'",
        "'原生 simple 方式：移动平移待机姿态，击球直接采样片段'":
            "'Native Simple style: movement shifts the idle pose, strokes sample the clip directly'",
    },
    'game/integrated/adapter.js': {
        "'缺少离线步幅标定数据'": "'Missing offline stride calibration data'",
        "'接缝完成，继续目标片段'": "'Seam done; continuing the target clip'",
        "`缺少离线连接 ${clip.behavior} → ${target}`": "`Missing offline connection ${clip.behavior} → ${target}`",
        "`等待已存出口 #${e.fromFrame}`": "`Waiting for stored exit #${e.fromFrame}`",
        "'出口不一致'": "'Exit mismatch'",
        "'播放已存过渡'": "'Playing stored transition'",
        "'当前视频 · Simple + v3近端'": "'This video · Simple + v3 near player'",
        "'v3 离线序列就绪 · 左右位移已按原轨迹标定'": "'v3 offline clips ready · left/right shift calibrated from the source trajectory'",
        "'已到场地边界，停止持续迈步'": "'Reached the court boundary; stepping stops'",
        "'击球尚未完成或已排队，不能重启/改型'": "'Stroke not finished or already queued; cannot restart or change type'",
        "'发球要求驻位且无移动/过渡'": "'Serve requires stationary with no movement / transition'",
        "'当前回合有活球；请在两分间发球'": "'Ball in play; serve between points'",
        "'已接收，等待离线出口'": "'Accepted; waiting for the offline exit'",
    },
    'game/baseline/play.html': {'<title>A · 当前视频 Simple 基线</title>': '<title>A · Simple baseline</title>',
                                'lang="zh-CN"': 'lang="en"'},
    'game/integrated/play.html': {'<title>B · 当前视频 Simple + v3</title>': '<title>B · Simple + v3</title>',
                                  'lang="zh-CN"': 'lang="en"'},
}

# ---------------- (4) improve through validation: keyboard player shell (test_selfevolve/round_02/interactive) ----------------
CODE['improve/play/player.js'] = {
    "names={simple_before:'Simple · 修改前',simple_after:'Simple · 修改后',ours_before:'ours / v3 · 修改前',ours_after:'ours / v3 · 修改后'}":
        "names={simple_before:'Simple · before',simple_after:'Simple · after',ours_before:'ours / v3 · before',ours_after:'ours / v3 · after'}",
    "value?'暂停':'开始控制'": "value?'Pause':'Start control'",
    "value?'控制中 · '+names[version]:'已暂停 · '+names[version]": "value?'Playing · '+names[version]:'Paused · '+names[version]",
    "||'就绪'": "||'ready'",
    "`按键：${[...keys].join(' + ')||'无'} · t=${s.t.toFixed(2)}s · 位置 (": "`Keys: ${[...keys].join(' + ')||'none'} · t=${s.t.toFixed(2)}s · position (",
    "Error('加载失败：'+src)": "Error('Failed to load: '+src)",
    "Error('未知版本')": "Error('Unknown version')",
    "names[version]+' · 键盘试玩'": "names[version]+' · keyboard play'",
}
CODE['improve/play/player.html'] = {
    'lang="zh-CN"': 'lang="en"',
    '<title>键盘试玩</title>': '<title>Keyboard play</title>',
    '<button id="toggle" disabled>加载中…</button><button id="reset" disabled>重置</button><span id="status" role="status">读取原版代码</span>':
        '<button id="toggle" disabled>Loading…</button><button id="reset" disabled>Reset</button><span id="status" role="status">Reading the original code</span>',
    'aria-label="点击球场，然后使用键盘控制"': 'aria-label="Click the court, then control with the keyboard"',
    '<p>方向键 / WASD 移动 · J 正手 · K 反手 · L 发球 · P 暂停 · R 重置</p>':
        '<p>Arrows / WASD move · J forehand · K backhand · L serve · P pause · R reset</p>',
}
