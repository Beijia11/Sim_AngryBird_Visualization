export async function create(config,context={}) {
  let background=null;
  if(typeof Image!=='undefined') {
    background=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Court background failed to load'));im.src=new URL(config.background,context.baseURL);});
  }
  const project=(x,y,z=0)=>({x:config.center_x+x*(config.near_half_width+(config.far_half_width-config.near_half_width)*y),
    y:config.near_y+(config.far_y-config.near_y)*y-z*config.height_scale});
  return {config,project,draw(ctx) {
    if(background)ctx.drawImage(background,0,0,1280,720);else{ctx.fillStyle='#7c343b';ctx.fillRect(0,0,1280,720);}
    // Rebuild the tabletop over legacy background-removal artifacts.
    const corners=[project(-1,0),project(1,0),project(1,1),project(-1,1)];
    ctx.fillStyle='#183953';ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='#e4e9ec';ctx.lineWidth=3;ctx.stroke();
    const a=project(0,0),b=project(0,1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.fillStyle='#182936';ctx.fillRect(corners[0].x,corners[0].y+3,corners[1].x-corners[0].x,24);
    const n1=project(-1.1,.5),n2=project(1.1,.5);ctx.fillStyle='rgba(194,220,234,.45)';ctx.fillRect(n1.x,n1.y-22,n2.x-n1.x,22);
    ctx.strokeStyle='#e6f1f5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(n1.x,n1.y-22);ctx.lineTo(n2.x,n2.y-22);ctx.stroke();
  }};
}
