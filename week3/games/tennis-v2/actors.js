'use strict';
// Each frame is a crop of the supplied recording, never a generated character.
const RECORDED_ACTIONS = [
 {idle:[0,9],left:[202,219],right:[147,168],strokeLeft:[12,23,42],strokeRight:[318,335,352]},
 {idle:[78,90],left:[99,123],right:[202,219],strokeLeft:[124,137,153],strokeRight:[299,312,327]}
];
let playerSpritesReady=false,spriteLoadError=null;
const PLAYER_IMAGES=MOTION_ATLASES.map(pages=>pages.map(src=>{const image=new Image();image.src=src;return image}));
const spritesLoaded=Promise.all(PLAYER_IMAGES.flat().map(image=>image.decode())).then(()=>{playerSpritesReady=true}).catch(e=>{spriteLoadError=String(e)});
function sourcePlaneScale(foot){
 const m=COURT_CALIBRATION.homography,u=foot[0]*2/3,v=foot[1]*2/3;
 const a=m[0][0]-u*m[2][0],b=m[0][1]-u*m[2][1],c=m[1][0]-v*m[2][0],d=m[1][1]-v*m[2][1],e=u*m[2][2]-m[0][2],f=v*m[2][2]-m[1][2],det=a*d-b*c;
 const x=(e*d-b*f)/det,y=(a*f-e*c)/det;
 return a/(m[2][0]*x+m[2][1]*y+m[2][2]);
}
function recordedStroke(who){
 const p=who===0?player:opponent;
 p.sourceAction={name:ball.x<p.x?'strokeLeft':'strokeRight',contact:clock};
}
function chooseRecordedFrame(p,actor){
 if(Number.isInteger(p.previewFrame))return Math.max(0,Math.min(MOTION_DATA.frameCount-1,p.previewFrame));
 const clips=RECORDED_ACTIONS[actor],fps=MOTION_DATA.fps;
 if(p.sourceAction){const clip=clips[p.sourceAction.name],elapsed=clock-p.sourceAction.contact;
  if(elapsed>=(clip[0]-clip[1])/fps&&elapsed<=(clip[2]-clip[1])/fps)return clamp(clip[1]+Math.floor(elapsed*fps),clip[0],clip[2]);
 }
 // Anticipate a reachable incoming ball with the recorded wind-up, then align
 // the selected source contact frame to the game's strike event.
 if(phase==='rally'&&ball.last!==actor&&Math.abs(ball.vy)>1e-4){
  const eta=(p.y-ball.y)/ball.vy;
  if(eta>=0&&eta<.45&&Math.abs(ball.x+ball.vx*eta-p.x)<2.5){
   const clip=clips[ball.x<p.x?'strokeLeft':'strokeRight'];return clamp(clip[1]-Math.round(eta*fps),clip[0],clip[1]);
  }
 }
 if(clock-(p.lastMoved??-1)<.08){
  const clip=clips[(p.moveDx??0)<0?'left':'right'];return clip[0]+Math.floor((p.travel??0)*12)%(clip[1]-clip[0]+1);
 }
 const clip=clips.idle;return clip[0]+Math.floor(clock*fps*.55)%(clip[1]-clip[0]+1);
}
function drawRecordedPlayer(p,actor){
 if(!playerSpritesReady)return;
 const frame=chooseRecordedFrame(p,actor),m=MOTION_DATA.tracks[actor][frame],image=PLAYER_IMAGES[actor][m.page],a=project(p.x,p.y);
 const scale=(2/3)*a.s/sourcePlaneScale(m.sourceFoot);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.fillStyle='#15362630';ctx.beginPath();ctx.ellipse(a.x,a.y,a.s*.29,a.s*.065,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(image,m.sx,m.sy,m.w,m.h,a.x-m.pivot[0]*scale,a.y-m.pivot[1]*scale,m.w*scale,m.h*scale);ctx.restore();
 p.renderedSourceFrame=frame;
}

function recordedWhiff(){
 const name=ball.x<player.x?'strokeLeft':'strokeRight',clip=RECORDED_ACTIONS[0][name];
 player.sourceAction={name,contact:clock+(clip[1]-clip[0])/MOTION_DATA.fps};
}
