"""Extract evidence exclusively from the supplied recording, excluding browser chrome.
Dependencies: numpy, opencv-python-headless. Camera correction is approximate.
"""
from pathlib import Path
import cv2, numpy as np, json
R=Path(__file__).resolve().parent
SOURCE=R.parent/'Screen Recording 2026-09-10 at 10.12.32.mov'
cap=cv2.VideoCapture(str(SOURCE));fps=cap.get(cv2.CAP_PROP_FPS)
# Fixed gameplay viewport, measured visually in the recording.
x0,y0,w,h=60,239,1248,697
writer=cv2.VideoWriter(str(R/'reference.webm'),cv2.VideoWriter_fourcc(*'VP80'),fps/2,(960,536))
trace=[];prev=None;cam_x=0;frame_index=0
while True:
 ok,raw=cap.read()
 if not ok:break
 crop=raw[y0:y0+h,x0:x0+w]
 if frame_index%2==0:writer.write(cv2.resize(crop,(960,536)))
 if frame_index%6==0:
  gray=cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY)
  shift=0;matches=0
  if prev is not None:
   # Track static scenery above the grass. Median flow suppresses moving sprites.
   mask=np.zeros_like(prev);mask[120:560,30:1190]=255
   pts=cv2.goodFeaturesToTrack(prev,300,.01,10,mask=mask)
   if pts is not None:
    nxt,status,_=cv2.calcOpticalFlowPyrLK(prev,gray,pts,None)
    if nxt is not None:
     delta=(nxt-pts).reshape(-1,2)[status.ravel()==1];delta=delta[np.abs(delta[:,1])<4]
     matches=len(delta)
     if matches>=10:shift=float(np.median(delta[:,0]))
  cam_x-=shift;prev=gray
  hsv=cv2.cvtColor(crop,cv2.COLOR_BGR2HSV)
  mask=(((hsv[:,:,0]<12)|(hsv[:,:,0]>170))&(hsv[:,:,1]>140)&(hsv[:,:,2]>90)).astype('uint8')
  count,labels,stats,centers=cv2.connectedComponentsWithStats(mask)
  candidates=[]
  for k in range(1,count):
   x,y,bw,bh,area=map(int,stats[k]);cx,cy=centers[k]
   if 65<area<2500 and 9<bw<95 and 8<bh<95 and cy<610:
    candidates.append({'x':round(float(cx),2),'y':round(float(cy),2),'area':area})
  trace.append({'frame':frame_index,'time':round(frame_index/fps,4),'camera_x_estimate':round(cam_x,2),'flow_matches':matches,'red_candidates':candidates})
 frame_index+=1
writer.release();cap.release()
result={'source':SOURCE.name,'crop':[x0,y0,w,h],'fps':fps,'frames':frame_index,'duration':frame_index/fps,'method':'HSV red candidates and median optical-flow camera estimate. Candidates are not guaranteed identities.','samples':trace,
'events':[{'time':0,'event':'Tower visible: wooden frame, inner blue supports, one green target.'},{'time':1.2,'event':'Camera pans from the tower toward the launcher.'},{'time':4.4,'event':'Loaded character pulled backward and downward.'},{'time':6.9,'event':'Release followed by free flight; camera follows.'},{'time':8.25,'event':'Impact near upper tower and target; structure starts breaking.'},{'time':8.3,'event':'Green 5000-point popup visible; target no longer intact.'},{'time':9.4,'event':'Tower continues rotating and collapsing.'},{'time':10.6,'event':'Visible score reaches 9560; no end-of-level screen shown.'}]}
(R/'evidence/inferred.json').write_text(json.dumps(result,indent=2))
# Crop selected already-extracted frames for visual comparison.
for name in ['frame_00000.png','frame_00276.png','frame_00449.png','frame_00483.png','frame_00621.png']:
 f=cv2.imread(str(R/'evidence'/name));cv2.imwrite(str(R/'evidence'/('crop_'+name)),f[y0:y0+h,x0:x0+w])
print('Extracted',len(trace),'motion samples and browser-playable cropped reference video.')
