"""Copy Astra results into this static summary and regenerate their presentation.
Uses the Python standard library. Source reconstruction folders are not modified.
"""
from pathlib import Path
import shutil,html,re
ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
if not (WORK/"Sim_AngryBird").is_dir() and (WORK.parent/"Sim_AngryBird").is_dir():
    WORK=WORK.parent

def inline(text):
    tokens=[]
    def save(m):
        tokens.append('<code>'+html.escape(m.group(1))+'</code>');return f'\x00{len(tokens)-1}\x00'
    text=re.sub(r'`([^`]+)`',save,text)
    text=html.escape(text)
    text=re.sub(r'\[([^\]]+)\]\((https://[^\s)]+)\)',r'<a href="\2" target="_blank" rel="noopener">\1</a>',text)
    text=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',text)
    for i,value in enumerate(tokens):text=text.replace(f'\x00{i}\x00',value)
    return text

def markdown(text):
    lines=text.splitlines();out=[];i=0
    while i<len(lines):
        line=lines[i]
        if not line.strip():i+=1;continue
        if line.startswith('```'):
            i+=1;code=[]
            while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
            out.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>');i+=1;continue
        if line.startswith('#'):
            m=re.match(r'(#+)\s+(.*)',line);level=min(4,len(m[1])+1);out.append(f'<h{level}>{inline(m[2])}</h{level}>');i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                cells=[x.strip() for x in lines[i].strip('|').split('|')]
                if not all(re.fullmatch(r'[:\- ]+',x) for x in cells):rows.append(cells)
                i+=1
            out.append('<div class="astra-table-wrap"><table><thead><tr>'+''.join('<th>'+inline(x)+'</th>' for x in rows[0])+'</tr></thead><tbody>')
            out.extend('<tr>'+''.join('<td>'+inline(x)+'</td>' for x in row)+'</tr>' for row in rows[1:]);out.append('</tbody></table></div>');continue
        if re.match(r'(- |\d+\. )',line):
            ordered=bool(re.match(r'\d+\.',line));tag='ol' if ordered else 'ul';out.append('<'+tag+'>')
            while i<len(lines) and re.match(r'(- |\d+\. )',lines[i]):out.append('<li>'+inline(re.sub(r'^(- |\d+\. )','',lines[i]))+'</li>');i+=1
            out.append('</'+tag+'>');continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'(#|\||```|- |\d+\. )',lines[i]):paragraph.append(lines[i]);i+=1
        out.append('<p>'+inline(' '.join(paragraph))+'</p>')
    return '\n'.join(out)

CASES=[{
 'id':'pacman','source':'Sim_AngryBird/pacman_altas_build','title':'Pac-Man / White Line Maze','meta':'6.1 s · 61 frames · 832 × 480','video':'reference.mp4','poster':'evidence/frame_0000.png',
 'desc':'A fixed maze, four-direction movement, collectible dots, and a temporary power state reconstructed from one short clip.',
 'prompt':'Read the video ep0000_style_1_classic_bw.mp4. Assume you do not know what game it is beforehand. Based only on the video, can you infer the agent’s action latents or some of the game mechanics, then write a program that recreates the game so I can play it?',
 'promptnote':'English translation of the original request; the input path is shortened to its filename. The name is visible in the path, so this is a requested constraint, not a claim of name-blind evaluation.',
 'videonote':'Original supplied gameplay clip, unchanged.',
 'findings':['Action: ↑ / ↓ / ← / →','19 × 11 grid','89 visible dots','~2.4 s state change'],
 'files':['game.js','data.js','evidence/inferred.json','analyze_video.py'],
 'datanote':'data.js contains the extracted initial dot positions and observed trajectories. inferred.json provides the structured measurements.',
 'playnote':'Arrow keys or WASD to move. Space pauses; R restarts. Touch controls are included.',
 'limit':'Scoring, collision outcomes, the win condition, and the chasing policy include explicit reconstruction assumptions.'
},{
 'id':'angry-birds','source':'Sim_AngryBird/angrybird_atlas_build','title':'Angry Birds / Timber & Flight','meta':'11.2 s · 657 frames · 1920 × 1080 source','video':'reference.webm','poster':'evidence/crop_frame_00000.png',
 'desc':'A two-dimensional pull-and-release action, projectile flight, and a collapsing structure reconstructed from a screen recording.',
 'prompt':'Great. Do the same for this video: Screen Recording 2026-09-10 at 10.12.32.mov.',
 'promptnote':'English translation of the follow-up request. “Do the same” inherits the task above: infer actions and mechanics from the supplied video, then build a playable recreation. The English-interface preference also carries over.',
 'videonote':'Gameplay-only crop of the supplied screen recording, re-encoded as WebM without audio. The original includes browser chrome; the game camera pans and zooms.',
 'findings':['Action: pull vector + release','3 visible birds','Wood + blue supports','5,000-point target popup'],
 'files':['game.js','evidence/inferred.json','evidence/action_latents.json','analyze_video.py'],
 'datanote':'This result has no data.js. Its recorded data is in inferred.json and action_latents.json; the level geometry is defined in game.js.',
 'playnote':'Drag the red bird backward, then release. Or use the angle and strength sliders. “Try a sample shot” demonstrates the physics.',
 'limit':'Gravity, material durability, individual destruction rewards, and end conditions are tuned assumptions. The sample shot is not a source-trajectory replay.'
}]

embed_css='''<style>
html,body{margin:0!important;min-height:0!important;height:auto!important}main{max-width:none!important;margin:0!important;padding:12px!important}header,footer,.intro,main>details,.bottom-grid,.layout>section>details{display:none!important}.layout{display:block!important;margin:0!important}.layout>aside{display:none!important}.layout>section{margin:0!important}.stats{margin:0 0 12px!important}.toolbar,.controls{margin:12px 0!important}.toolbar a{display:none!important}.embed-aim{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0 20px!important;margin:0!important}.embed-aim .btn{grid-column:1/-1!important;width:100%!important}.embed-pad{display:flex!important;margin:10px 0!important;gap:8px!important}.embed-pad button{min-width:44px!important}.note,.hint{margin:8px 0!important}.overlay{text-align:center;padding:12px!important}.overlay strong{max-width:100%;font-size:clamp(17px,3vw,25px)!important}.overlay p{max-width:100%}
</style>'''
embed_js='''<script>
(()=>{const host=document.querySelector('.layout>section');const aim=document.querySelector('.aim'),pad=document.querySelector('.pad');if(aim){aim.classList.add('embed-aim');host.appendChild(aim);}if(pad){pad.classList.add('embed-pad');host.appendChild(pad);}let previous=0;function send(){const h=Math.ceil(document.querySelector('main').getBoundingClientRect().height)+2;if(Math.abs(h-previous)>1){previous=h;parent.postMessage({type:'astra-game-size',height:h},'*');}}new ResizeObserver(send).observe(document.querySelector('main'));window.addEventListener('load',send);send();})();
</script>'''

articles=[]
for case in CASES:
    source=WORK/case['source'];dest=ROOT/'astra'/case['id'];dest.mkdir(parents=True,exist_ok=True)
    paths=set(case['files']+['index.html','play.html','REPORT.md',case['video'],case['poster'],'evidence/browser.png'])
    if (source/'data.js').exists():paths.add('data.js')
    if (source/'vendor').exists():
        for f in (source/'vendor').rglob('*'):
            if f.is_file():paths.add(str(f.relative_to(source)))
    for name in paths:
        target=dest/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,target)
    page=(source/'index.html').read_text();page=page.replace('</style>','</style>'+embed_css,1)
    page+=embed_js;(dest/'embed.html').write_text(page)
    prefix='astra/'+case['id']+'/';cid=case['id'];files=[];tabs=[]
    for i,name in enumerate(case['files']):
        fileid=f'{cid}-file-{i}';selected='true' if i==0 else 'false';hidden='' if i==0 else ' hidden';label=Path(name).name
        tabs.append(f'<button class="astra-tab" id="{fileid}-tab" role="tab" aria-selected="{selected}" aria-controls="{fileid}" tabindex="{0 if i==0 else -1}">{label}</button>')
        content=(source/name).read_text()
        files.append(f'<div class="astra-panel" id="{fileid}" role="tabpanel" aria-labelledby="{fileid}-tab"{hidden}><div class="astra-file-tools"><span>{html.escape(name)} · {len(content.encode()):,} bytes</span><a href="{prefix+name}" download>Download file ↓</a></div><pre class="astra-code" tabindex="0"><code>{html.escape(content)}</code></pre></div>')
    articles.append(f'''
    <article class="astra-case" id="astra-{cid}">
      <div class="astra-case-head"><div><span class="astra-label">ASTRA / {'01' if cid=='pacman' else '02'}</span><h3>{html.escape(case['title'])}</h3><p>{html.escape(case['desc'])}</p></div><span class="astra-badge">Video → playable code</span></div>
      <div class="astra-body">
        <div class="astra-inputs"><div><span class="astra-block-label">INPUT / PROMPT</span><blockquote class="astra-prompt">{html.escape(case['prompt'])}</blockquote><p class="astra-note">{html.escape(case['promptnote'])}</p></div>
        <figure><span class="astra-block-label">INPUT / REFERENCE VIDEO</span><video controls playsinline preload="none" poster="{prefix+case['poster']}" src="{prefix+case['video']}"></video><figcaption><span class="cap-title">{html.escape(case['meta'])}</span><span class="cap-panes">{html.escape(case['videonote'])}</span></figcaption></figure></div>
        <div class="astra-findings">{''.join('<span>'+html.escape(t)+'</span>' for t in case['findings'])}</div>
        <details class="astra-disclosure astra-report"><summary>Read REPORT.md — observations, actions, and assumptions</summary><div class="astra-file-tools"><a href="{prefix}REPORT.md" download>Download REPORT.md ↓</a><span>Full report from this result</span></div><div class="astra-document" tabindex="0">{markdown((source/'REPORT.md').read_text())}</div></details>
        <details class="astra-disclosure astra-source"><summary>Inspect code &amp; data</summary><p class="astra-note" style="padding:0 17px">{html.escape(case['datanote'])}</p><div class="astra-tablist" role="tablist" aria-label="{html.escape(case['title'])} source files">{''.join(tabs)}</div>{''.join(files)}</details>
        <div class="astra-play"><div class="astra-play-head"><strong>OUTPUT / PLAY THE RECREATION</strong><div class="astra-play-links"><button class="astra-button astra-stop" data-stop-game hidden>Close game</button><a href="{prefix}index.html" target="_blank" rel="noopener">Open full game ↗</a><a href="{prefix}play.html" download>Download offline HTML ↓</a></div></div>
          <div class="astra-launcher"><img src="{prefix}evidence/browser.png" alt="Screenshot of the recreated {html.escape(case['title'])} game" loading="lazy"><div><p>{html.escape(case['playnote'])}</p><button class="astra-button" data-start-game>Play here →</button></div></div>
          <iframe class="astra-game-frame" title="Playable {html.escape(case['title'])}" data-src="{prefix}embed.html" src="about:blank" allow="fullscreen" hidden></iframe>
        </div><p class="astra-status" role="status" aria-live="polite">Loads only when you choose Play here.</p><p class="astra-case-foot">{html.escape(case['limit'])}</p>
      </div>
    </article>''')

section='''<!-- ASTRA RESULTS START -->
  <section id="astra">
    <div class="sec-head"><span class="sec-num">(3)</span><h2>Astra: from video to a playable game</h2></div>
    <p class="astra-intro">Two video-to-code results. Astra inspected the supplied video, inferred an interpretable action representation and visible mechanics, then implemented a playable browser game. The reports distinguish observations from rules added for playability.</p>
    <div class="astra-flow" aria-label="Input video and prompt lead to inferred actions and mechanics, then code and data, then a playable game"><b>Video + prompt</b><span>→</span><b>Actions + mechanics</b><span>→</span><b>Code + data</b><span>→</span><b>Play in browser</b></div>
    <p class="astra-note">These are interactive code reconstructions from individual clips. Their action representations are explicit abstractions; they are not the trained conditioning tokens used in the Cosmos experiments above.</p>
'''+''.join(articles)+'''
  </section>
<!-- ASTRA RESULTS END -->'''
p=ROOT/'index.html';s=p.read_text()
if '<!-- ASTRA RESULTS START -->' in s:s=re.sub(r'<!-- ASTRA RESULTS START -->.*?<!-- ASTRA RESULTS END -->',lambda m:section,s,flags=re.S)
else:s=s.replace('\n  <footer>', '\n'+section+'\n\n  <footer>',1)
if 'href="astra.css"' not in s:s=s.replace('</style>','</style>\n<link rel="stylesheet" href="astra.css">',1)
if 'src="astra.js"' not in s:s+='\n<script src="astra.js"></script>\n'
s=s.replace('<title>Week 2 Condition Guidance</title>','<title>Week 2 — Condition Guidance &amp; Astra Results</title>')
s=s.replace('Every clip is 61 frames, 832&times;480, 10&nbsp;fps.', 'For the Cosmos experiments, each clip is 61 frames, 832&times;480, 10&nbsp;fps.')
if 'class="summary-nav"' not in s:s=s.replace('  </header>','''    <nav class="summary-nav" aria-label="Summary sections"><a href="#sequence">Latent sequence</a><a href="#spatial-map">Spatial-map results</a><a href="#action">Action results</a><a href="#astra">Astra: playable games ↓</a></nav>
  </header>''',1)
if not s.lstrip().lower().startswith('<!doctype'):s='<!doctype html>\n<html lang="en">\n'+s+'\n</html>\n'
p.write_text(s)
print('Updated summary with two portable Astra result bundles.')
