/* Bounded state-conditioned interception helpers. No ball mutation, hit event,
 * whole-body reconstruction, root teleport or hidden collider enlargement. */
(function(g){'use strict';
 const stats={forecasts:0,plans:0,armSolves:0};
 const clone=p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[...v]]));
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function forecast(ball,gravity,seconds,{floor=0,restitution=.73}={}){
  stats.forecasts++;let p=[...ball.position],v=[...ball.velocity],left=seconds;const r=ball.shape?.radius??.033;
  while(left>1e-9){const h=Math.min(left,1/240);for(let i=0;i<3;i++){p[i]+=v[i]*h+.5*gravity[i]*h*h;v[i]+=gravity[i]*h;}
   if(p[1]<floor+r&&v[1]<0){p[1]=floor+r;v[1]=-v[1]*restitution;}left-=h;}
  return {position:p,velocity:v};
 }
 function plan({ball,gravity,root,forward=-1,minTime=.14,maxTime=.65,preferredTime=.30,reach=1.55,minHeight=.35,maxHeight=2.35,minForward=-.3,maxForward=1.25,restitution=.73}){
  stats.plans++;let best=null;
  // Candidates are future action targets, not candidate programs or ball paths
  // written back into the simulator. Normal online control planning only.
  for(let t=minTime;t<=maxTime+1e-8;t+=1/120){const f=forecast(ball,gravity,t,{restitution});
   const dx=f.position[0]-root[0],front=(f.position[2]-root[2])*forward;
   if(Math.abs(dx)>reach||front<minForward||front>maxForward||f.position[1]<minHeight||f.position[1]>maxHeight)continue;
   const cost=Math.abs(t-preferredTime)+.04*Math.abs(dx)+.025*Math.abs(front-.35);
   if(!best||cost<best.cost)best={inSeconds:t,position:f.position,velocity:f.velocity,cost};
  }
  return best;
 }
 function solveArm(pose,target,{side='right',handleLength=57,maxCorrection=70,weight=1}={}){
  stats.armSolves++;const S=pose[side+'_shoulder'],E=pose[side+'_elbow'],W=pose[side+'_wrist'];
  const l1=Math.hypot(E[0]-S[0],E[1]-S[1]),forearm=Math.hypot(W[0]-E[0],W[1]-E[1]),l2=forearm+handleLength;
  const dx=target[0]-S[0],dy=target[1]-S[1],d=Math.hypot(dx,dy),out=clone(pose);
  if(l1<1e-6||l2<1e-6||d>l1+l2||d<Math.abs(l1-l2))return {pose:out,accepted:false,reason:'unreachable',error:Math.max(d-l1-l2,Math.abs(l1-l2)-d,0)};
  const angle=Math.atan2(dy,dx),bend=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
  const elbows=[angle+bend,angle-bend].map(a=>[S[0]+l1*Math.cos(a),S[1]+l1*Math.sin(a)]);
  const e=elbows.reduce((a,b)=>Math.hypot(a[0]-E[0],a[1]-E[1])<Math.hypot(b[0]-E[0],b[1]-E[1])?a:b);
  const w=[e[0]+(target[0]-e[0])*forearm/l2,e[1]+(target[1]-e[1])*forearm/l2];
  const correction=Math.max(Math.hypot(e[0]-E[0],e[1]-E[1]),Math.hypot(w[0]-W[0],w[1]-W[1]));
  if(correction>maxCorrection)return {pose:out,accepted:false,reason:'correction_limit',correction};
  const solved=clone(pose);solved[side+'_elbow']=e;solved[side+'_wrist']=w;
  const result=g.ReferenceMotion.blend(pose,solved,clamp(weight,0,1));
  return {pose:result,accepted:true,correction};
 }
 g.InterceptMotion={forecast,plan,solveArm,stats};
})(window);
