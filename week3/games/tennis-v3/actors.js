'use strict';
// Each frame is a crop of the supplied recording, never a generated character.
const RECORDED_ACTIONS = [
 {idle:[0,9],left:[202,219],right:[147,168],strokeLeft:[90,99,122],strokeRight:[9,18,42]},
 {idle:[78,90],left:[99,123],right:[202,219],strokeLeft:[124,137,153],strokeRight:[299,312,327]}
];
let playerSpritesReady=false,spriteLoadError=null;
const PLAYER_IMAGES=MOTION_ATLASES.map(pages=>pages.map(src=>{const image=new Image();image.src=src;return image}));
const spritesLoaded=Promise.all([...PLAYER_IMAGES.flat().map(image=>image.decode()),COURT_PHOTO.decode()]).then(()=>{playerSpritesReady=true}).catch(e=>{spriteLoadError=String(e)});
function sourcePlaneScale(foot){
 const m=COURT_CALIBRATION.homography,u=foot[0]*2/3,v=foot[1]*2/3;
 const a=m[0][0]-u*m[2][0],b=m[0][1]-u*m[2][1],c=m[1][0]-v*m[2][0],d=m[1][1]-v*m[2][1],e=u*m[2][2]-m[0][2],f=v*m[2][2]-m[1][2],det=a*d-b*c;
 const x=(e*d-b*f)/det,y=(a*f-e*c)/det;
 return a/(m[2][0]*x+m[2][1]*y+m[2][2]);
}
function intendedStroke(who){
 if(who===0){if(keys.has('KeyA'))return 'strokeLeft';if(keys.has('KeyD'))return 'strokeRight';}
 const p=who===0?player:opponent;return ball.x<p.x?'strokeLeft':'strokeRight';
}
function recordedStroke(who){
 const p=who===0?player:opponent,name=intendedStroke(who);
 p.sourceAction={name,contact:clock};
}
function recordedWhiff(){
 // Repeated inputs extend the game input buffer, not restart an unfinished animation.
 if(player.sourceAction){const c=RECORDED_ACTIONS[0][player.sourceAction.name];if(clock-player.sourceAction.contact<(c[2]-c[1])/MOTION_DATA.fps)return;}
 const name=intendedStroke(0),clip=RECORDED_ACTIONS[0][name];
 player.sourceAction={name,contact:clock+(clip[1]-clip[0])/MOTION_DATA.fps};
}
function chooseRecordedFrame(p,actor){
 if(Number.isInteger(p.previewFrame)){p.motionTag='preview';return clamp(p.previewFrame,0,MOTION_DATA.frameCount-1);}
 const clips=RECORDED_ACTIONS[actor],fps=MOTION_DATA.fps;
 if(p.sourceAction){const c=clips[p.sourceAction.name],elapsed=clock-p.sourceAction.contact;
  if(elapsed<=(c[2]-c[1])/fps){p.motionTag=p.sourceAction.name;return clamp(c[1]+Math.floor(elapsed*fps),c[0],c[2]);}
 }
 // There is no captured forward/backward gait: keep a stable recorded stance.
 // Do not mislabel a sideways loop as forward walking.
 let mode='idle';
 if(clock-(p.lastMoved??-100)<.14){
  if(Math.abs(p.moveDx||0)>Math.abs(p.moveDy||0)*.75)mode=(p.moveDx||0)<0?'left':'right';
  else mode='depth';
 }
 if(p.locomotionMode!==mode){p.locomotionMode=mode;p.locomotionStarted=clock;}
 p.motionTag=mode;
 if(mode==='idle'||mode==='depth')return clips.idle[0];
 const clip=clips[mode],count=clip[1]-clip[0]+1;
 return clip[0]+Math.floor((clock-p.locomotionStarted)*24)%count;
}
const TRANSITION_SECONDS=.18;
function spriteLayer(target,actor,frame){
 const m=MOTION_DATA.tracks[actor][frame],scale=(2/3)*80/sourcePlaneScale(m.sourceFoot);
 target.drawImage(PLAYER_IMAGES[actor][m.page],m.sx,m.sy,m.w,m.h,256-m.pivot[0]*scale,440-m.pivot[1]*scale,m.w*scale,m.h*scale);
}
function drawRecordedPlayer(p,actor){
 if(!playerSpritesReady)return;
 const frame=chooseRecordedFrame(p,actor),a=project(p.x,p.y);
 let state=p.visualMotion;
 if(!state){
  const output=document.createElement('canvas'),from=document.createElement('canvas');output.width=from.width=512;output.height=from.height=512;
  state=p.visualMotion={frame,tag:p.motionTag,start:-100,transitions:0,output,from};
  spriteLayer(output.getContext('2d'),actor,frame);
 }
 const changed=state.tag!==p.motionTag||Math.abs(frame-state.frame)>5;
 if(changed){
  // Preserve the actual composed image, including an interrupted transition.
  const previous=state.from.getContext('2d');previous.clearRect(0,0,512,512);previous.drawImage(state.output,0,0);
  state.start=clock;state.transitions++;
 }
 state.frame=frame;state.tag=p.motionTag;
 const mix=clamp((clock-state.start)/TRANSITION_SECONDS,0,1),c=state.output.getContext('2d');
 c.globalCompositeOperation='source-over';c.clearRect(0,0,512,512);c.globalAlpha=1;
 if(mix<1){c.globalAlpha=1-mix;c.drawImage(state.from,0,0);}
 c.globalCompositeOperation='lighter';c.globalAlpha=mix;spriteLayer(c,actor,frame);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 const scale=a.s/80;ctx.save();ctx.fillStyle='#15362630';ctx.beginPath();ctx.ellipse(a.x,a.y,a.s*.29,a.s*.065,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(state.output,a.x-256*scale,a.y-440*scale,512*scale,512*scale);ctx.restore();p.renderedSourceFrame=frame;
}
