"""Only input: the user-provided MP4. No game code or labels are read."""
import cv2, json, pathlib, numpy as np
ROOT=pathlib.Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cosmos/datasets/pacman/videos/ep0000_style_1_classic_bw.mp4'
cap=cv2.VideoCapture(str(SOURCE)); fps=cap.get(cv2.CAP_PROP_FPS)
trace=[]; prev=np.array([200,348]); pellets=[]
for i in range(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))):
    ok,frame=cap.read()
    if not ok: break
    gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
    n,labels,stats,centers=cv2.connectedComponentsWithStats((gray>70).astype('uint8'))
    candidates=[]
    for j in range(1,n):
        x,y,w,h,area=map(int,stats[j]); cx,cy=centers[j]
        if i==0 and 35<cy<440 and ((3<=w<=9 and 3<=h<=9) or (15<=w<=20 and 15<=h<=20)):
            pellets.append([round((cx-92)/36),round((cy-60)/36),w>10])
        if 25<=w<=35 and 25<=h<=50 and area>400:
            # Bounding box centers avoid bias from the animated mouth, then snap to observed 12px substeps.
            candidates.append(np.array([92+12*round((x+w/2-92)/12),60+12*round(((y+h-16 if h>32 else y+h/2)-60)/12)]))
    p=min(candidates,key=lambda a:np.linalg.norm(a-prev)); g=max(candidates,key=lambda a:np.linalg.norm(a-p)); prev=p
    trace.append({'frame':i,'t':round(i/fps,2),'player':p.tolist(),'other':g.tolist(),'other_gray':int(gray[int(g[1]+5),int(g[0])])})
for i,row in enumerate(trace):
    d=np.array(trace[min(i+1,len(trace)-1)]['player'])-row['player']
    row['motion']='right' if d[0]>0 else 'left' if d[0]<0 else 'down' if d[1]>0 else 'up' if d[1]<0 else 'stationary'
data={'fps':fps,'width':832,'height':480,'grid':{'origin':[92,60],'spacing':36,'cols':19,'rows':11},'pellets':pellets,'trace':trace}
(ROOT/'evidence/inferred.json').write_text(json.dumps(data,indent=2))
(ROOT/'data.js').write_text('window.VIDEO_DATA = '+json.dumps(data)+';\n')
print('visible pellets:',len(pellets),'frames:',len(trace))
print('movement runs:')
last=None
for r in trace:
 if r['motion']!=last: print(r['t'],r['player'],r['motion']); last=r['motion']
print('other brightness:',[(r['t'],r['other_gray']) for r in trace[::5]])
