export async function create(config,context={}) {
  let atlas=null;
  if(typeof Image!=='undefined')atlas=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Player sprite atlas failed to load'));im.src=new URL(config.atlas,context.baseURL);});
  function player(ctx,row,frame,x,y,height) {
    if(!atlas)return;
    const w=atlas.width/config.columns,h=atlas.height/config.rows;
    const box=config.cells?.[row*config.columns+frame] || [0,0,w,h];
    const scale=height/box[3],width=box[2]*scale;
    ctx.drawImage(atlas,frame*w+box[0],row*h+box[1],box[2],box[3],x-width/2,y-height,width,height);
  }
  return {config,draw(ctx,state,scene) {
    const nearX=scene.config.center_x+state.player.x*scene.config.near_half_width;
    const farFrame=state.phase==='countdown'&&state.wait<25?2:state.phase==='incoming'&&state.phaseTick<18?3:0;
    player(ctx,1,farFrame,scene.config.center_x,277,163);
    const frame={ready:0,step:1,prepare:2,swing:3}[state.player.pose]??0;
    player(ctx,0,frame,nearX,600,255);
  }};
}
