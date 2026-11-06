// Repaint the broadcast panel from the court frame after all character layers.
// Preserve the filmed names, row texture, dividers and position; replace only live fields.
export const SCORE_RECT={x:116,y:568,width:309,height:88};
export function drawScore(ctx,game,background){
 const {x,y,width,height}=SCORE_RECT,s=game.score;
 if(!background)return;
 ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);
 ctx.drawImage(background,x,y,width,height,x,y,width,height);
 // The recorded BREAK POINT #2 is not the score of this new match.
 ctx.drawImage(background,120,569,9,19,120,569,149,19);
 ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.fillStyle='#486b49';ctx.font='bold 12px Arial, sans-serif';
 const receiver=s.server==='near'?'far':'near';
 const breakPoint=!s.tieBreak&&s.points[receiver]>=3&&s.points[receiver]>s.points[s.server];
 const header=s.winner?'MATCH COMPLETE':s.tieBreak?'TIE BREAK':breakPoint?'BREAK POINT':'SET 1';
 ctx.fillText(header,194,583);
 for(const [i,role] of ['near','far'].entries()){
  const rowY=592+i*32,baseline=613+i*32;
  // Clean texture from the same row removes the recorded service dot and set scores.
  ctx.drawImage(background,280,rowY,12,29,295,rowY,18,29);
  ctx.drawImage(background,280,rowY,12,29,322,rowY,70,29);
  // One-set demo: the first set column is live; future-set columns remain empty.
  ctx.fillStyle='#e0e7e6';ctx.font='18px Arial, sans-serif';
  ctx.fillText(String(s.games[role]),334,baseline);
  // Keep the original pale point-cell border, replacing its old 30 / 40.
  ctx.drawImage(background,394,rowY+1,3,27,395,rowY+1,27,27);
  ctx.fillStyle='#192c2c';ctx.font='bold 19px Arial, sans-serif';
  ctx.fillText(s.display(role),408,baseline,27);
  if(!s.winner&&s.server===role){
   ctx.fillStyle='#c9ce72';ctx.beginPath();ctx.arc(304,baseline-7,3,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}
export function drawResult(ctx,game){if(!game.reaction)return;const r=game.reaction,age=game.time-r.started,win=r.winner==='near';ctx.save();ctx.textAlign='center';ctx.fillStyle='#102e2af0';ctx.beginPath();ctx.roundRect(405,72,470,92,12);ctx.fill();ctx.fillStyle=win?'#e7f1ad':'#f3d6ad';ctx.font='600 27px system-ui';ctx.fillText(r.terminal?(win?'YOU WIN THE MATCH':'AGENT WINS THE MATCH'):(win?'YOUR POINT':'AGENT’S POINT'),640,111);ctx.fillStyle='#dce5d7';ctx.font='14px system-ui';ctx.fillText(r.terminal?'R · Play again':age<game.rules.reactionSeconds?'Point finished':game.autoServeAt!==null?'Agent serves next automatically':'S · Next point · your service game',640,144);
 const p=game.ground(r.winner);for(let i=0;i<12;i++){const angle=i*Math.PI/6,spread=Math.min(1,age/1.1),alpha=Math.max(0,1-age/2);ctx.fillStyle=`rgba(234,240,150,${alpha})`;ctx.fillRect(p[0]+Math.cos(angle)*65*spread,p[1]-95+Math.sin(angle)*40*spread,4,7);}ctx.restore();}
