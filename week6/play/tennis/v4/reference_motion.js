/* Harness motion tool: keep the supplied projected skeleton and motion style.
 * No replacement humanoid, no world-space reach goals, no physics side effects.
 * Inputs/outputs: source-local COCO joint coordinates. Phase is action-local.
 */
(function(g){
  'use strict';
  const clone=p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[...v]]));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const point=(a,b,t)=>a.map((x,i)=>lerp(x,b[i],t));
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(10+t*(-15+6*t));};
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const mid=(a,b)=>point(a,b,.5);
  const edges=[['left_hip','left_knee'],['left_knee','left_ankle'],['right_hip','right_knee'],['right_knee','right_ankle'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],['right_shoulder','right_elbow'],['right_elbow','right_wrist']];
  const stats={cycleSamples:0,poseBlends:0,locomotionSamples:0};
  function blendVector(a,b,t){
    const angle=Math.atan2(a[1],a[0]),delta=Math.atan2(Math.sin(Math.atan2(b[1],b[0])-angle),Math.cos(Math.atan2(b[1],b[0])-angle));
    const r=lerp(Math.hypot(...a),Math.hypot(...b),t),q=angle+delta*t;return [r*Math.cos(q),r*Math.sin(q)];
  }
  // Interpolate articulated segment angles, not independent bone endpoints.
  // Projected lengths interpolate between the existing poses; they are not
  // forced to a guessed 3D anatomy (foreshortening is legitimate in this input).
  function blend(a,b,weight){
    stats.poseBlends++;const t=Math.max(0,Math.min(1,weight));if(t===0)return clone(a);if(t===1)return clone(b);
    const out={};for(const k of Object.keys(a))out[k]=b[k]?point(a[k],b[k],t):[...a[k]];
    if(!a.left_hip||!b.left_hip)return out;
    const pa=mid(a.left_hip,a.right_hip),pb=mid(b.left_hip,b.right_hip),pelvis=point(pa,pb,t);
    const ca=mid(a.left_shoulder,a.right_shoulder),cb=mid(b.left_shoulder,b.right_shoulder),chest=add(pelvis,blendVector(sub(ca,pa),sub(cb,pb),t));
    for(const side of ['left','right']){
      const h=side+'_hip',s=side+'_shoulder';out[h]=add(pelvis,blendVector(sub(a[h],pa),sub(b[h],pb),t));out[s]=add(chest,blendVector(sub(a[s],ca),sub(b[s],cb),t));
    }
    for(const [parent,child] of edges)if(a[child]&&b[child])out[child]=add(out[parent],blendVector(sub(a[child],a[parent]),sub(b[child],b[parent]),t));
    for(const k of ['nose','left_eye','right_eye','left_ear','right_ear'])if(a[k]&&b[k])out[k]=add(chest,point(sub(a[k],ca),sub(b[k],cb),t));
    return out;
  }
  function sample(clip,time){
    if(!Array.isArray(clip))return clone(clip);
    if(time<=clip[0][0])return clone(clip[0][1]);
    for(let i=1;i<clip.length;i++)if(time<=clip[i][0])return blend(clip[i-1][1],clip[i][1],smooth((time-clip[i-1][0])/(clip[i][0]-clip[i-1][0])));
    return clone(clip[clip.length-1][1]);
  }
  function center(p){
    const x=(p.left_hip[0]+p.right_hip[0])/2,y=Math.max(p.left_ankle[1],p.right_ankle[1]);
    return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[v[0]-x,v[1]-y]]));
  }
  function cycle(clip,phase,options={}){
    stats.cycleSamples++;
    if(!Array.isArray(clip)||clip.length<2)throw Error('Motion cycle needs >=2 reference frames');
    const start=options.start??clip[0][0],end=options.end??clip[clip.length-1][0];
    if(!(end>start))throw Error('Motion cycle end must exceed start');
    const u=((phase%1)+1)%1,closing=options.closing??.20;
    if(!(closing>0&&closing<1))throw Error('Cycle closing must be between zero and one');
    const first=center(sample(clip,start));
    if(u<=1-closing)return center(sample(clip,lerp(start,end,u/(1-closing))));
    return blend(center(sample(clip,end)),first,smooth((u-(1-closing))/closing));
  }
  function locomotion(clip,idle,phase,amount,options={}){
    stats.locomotionSamples++;
    const rest=center(idle),stride=cycle(clip,phase,options),desired=clone(rest);
    // The locomotion channel consumes LEGS only. Recorded upper-body swings
    // cannot leak from a running clip into hold-left / hold-right actions.
    for(const k of ['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'])desired[k]=stride[k];
    const pelvis=mid(desired.left_hip,desired.right_hip),base=mid(rest.left_hip,rest.right_hip);
    const delta=sub(pelvis,base);
    for(const k of Object.keys(desired))if(!/_(hip|knee|ankle)$/.test(k))desired[k]=add(rest[k],delta);
    return blend(rest,desired,amount);
  }
  function upperBody(lower,upper,weight){
    const a=clone(lower),b=clone(upper),lp=mid(lower.left_hip,lower.right_hip),up=mid(upper.left_hip,upper.right_hip),delta=sub(lp,up);
    for(const k of Object.keys(b))b[k]=add(b[k],delta);
    const result=blend(a,b,weight);
    for(const k of Object.keys(lower))if(/_(hip|knee|ankle)$/.test(k))result[k]=[...lower[k]];
    return result;
  }
  function boundedCorrection(reference,corrected,maxPixels){
    let maximum=0;for(const k of Object.keys(reference))if(corrected[k])maximum=Math.max(maximum,Math.hypot(...sub(corrected[k],reference[k])));
    // Whole correction is rejected if it would erase the existing pose style.
    return {pose:clone(maximum<=maxPixels?corrected:reference),accepted:maximum<=maxPixels,maximum};
  }
  g.ReferenceMotion={blend,sample,cycle,locomotion,upperBody,center,boundedCorrection,stats};
})(window);
