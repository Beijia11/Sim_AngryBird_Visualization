(function(){
'use strict';
const DATA={"pellets": [[92, 60, 1], [740, 60, 1], [128, 60, 0], [200, 60, 0], [236, 60, 0], [272, 60, 0], [344, 60, 0], [380, 60, 0], [416, 60, 0], [452, 60, 0], [488, 60, 0], [524, 60, 0], [560, 60, 0], [632, 60, 0], [668, 60, 0], [704, 60, 0], [308, 96, 0], [524, 96, 0], [740, 96, 0], [92, 132, 0], [308, 132, 0], [524, 132, 0], [632, 132, 0], [740, 132, 0], [92, 168, 0], [128, 168, 0], [164, 168, 0], [236, 168, 0], [452, 168, 0], [524, 168, 0], [560, 168, 0], [596, 168, 0], [632, 168, 0], [668, 168, 0], [200, 204, 0], [416, 204, 0], [560, 204, 0], [632, 204, 0], [92, 240, 0], [128, 240, 0], [200, 240, 0], [344, 240, 0], [452, 240, 0], [560, 240, 0], [632, 240, 0], [668, 240, 0], [704, 240, 0], [740, 240, 0], [92, 276, 0], [200, 276, 0], [560, 276, 0], [632, 276, 0], [740, 276, 0], [128, 312, 0], [164, 312, 0], [200, 312, 0], [236, 312, 0], [272, 312, 0], [308, 312, 0], [380, 312, 0], [416, 312, 0], [524, 312, 0], [560, 312, 0], [668, 312, 0], [704, 312, 0], [740, 312, 0], [632, 348, 0], [740, 348, 0], [92, 384, 0], [200, 384, 0], [308, 384, 0], [524, 384, 0], [632, 384, 0], [92, 420, 1], [740, 420, 1], [128, 420, 0], [236, 420, 0], [272, 420, 0], [308, 420, 0], [344, 420, 0], [380, 420, 0], [416, 420, 0], [488, 420, 0], [524, 420, 0], [560, 420, 0], [596, 420, 0], [632, 420, 0], [668, 420, 0], [704, 420, 0], [164, 60, 0]], "nodes": {"0,0": [92, 60, {"right": "1,0", "down": "0,1"}], "1,0": [128, 60, {"right": "2,0", "left": "0,0"}], "2,0": [164, 60, {"right": "3,0", "left": "1,0"}], "3,0": [200, 60, {"right": "4,0", "left": "2,0", "down": "3,1"}], "4,0": [236, 60, {"right": "5,0", "left": "3,0"}], "5,0": [272, 60, {"right": "6,0", "left": "4,0"}], "6,0": [308, 60, {"right": "7,0", "left": "5,0", "down": "6,1"}], "7,0": [344, 60, {"right": "8,0", "left": "6,0"}], "8,0": [380, 60, {"right": "9,0", "left": "7,0"}], "9,0": [416, 60, {"right": "10,0", "left": "8,0"}], "10,0": [452, 60, {"right": "11,0", "left": "9,0"}], "11,0": [488, 60, {"right": "12,0", "left": "10,0"}], "12,0": [524, 60, {"right": "13,0", "left": "11,0", "down": "12,1"}], "13,0": [560, 60, {"right": "14,0", "left": "12,0"}], "14,0": [596, 60, {"right": "15,0", "left": "13,0"}], "15,0": [632, 60, {"right": "16,0", "left": "14,0", "down": "15,1"}], "16,0": [668, 60, {"right": "17,0", "left": "15,0"}], "17,0": [704, 60, {"right": "18,0", "left": "16,0"}], "18,0": [740, 60, {"left": "17,0", "down": "18,1"}], "0,1": [92, 96, {"up": "0,0", "down": "0,2"}], "3,1": [200, 96, {"up": "3,0", "down": "3,2"}], "6,1": [308, 96, {"up": "6,0", "down": "6,2"}], "12,1": [524, 96, {"up": "12,0", "down": "12,2"}], "15,1": [632, 96, {"up": "15,0", "down": "15,2"}], "18,1": [740, 96, {"up": "18,0", "down": "18,2"}], "0,2": [92, 132, {"up": "0,1", "down": "0,3"}], "3,2": [200, 132, {"up": "3,1", "down": "3,3"}], "6,2": [308, 132, {"up": "6,1", "down": "6,3"}], "12,2": [524, 132, {"up": "12,1", "down": "12,3"}], "15,2": [632, 132, {"up": "15,1", "down": "15,3"}], "18,2": [740, 132, {"up": "18,1", "down": "18,3"}], "0,3": [92, 168, {"right": "1,3", "up": "0,2", "down": "0,4"}], "1,3": [128, 168, {"right": "2,3", "left": "0,3"}], "2,3": [164, 168, {"right": "3,3", "left": "1,3"}], "3,3": [200, 168, {"right": "4,3", "left": "2,3", "up": "3,2", "down": "3,4"}], "4,3": [236, 168, {"right": "5,3", "left": "3,3"}], "5,3": [272, 168, {"right": "6,3", "left": "4,3", "down": "5,4"}], "6,3": [308, 168, {"right": "7,3", "left": "5,3", "up": "6,2"}], "7,3": [344, 168, {"right": "8,3", "left": "6,3"}], "8,3": [380, 168, {"right": "9,3", "left": "7,3"}], "9,3": [416, 168, {"right": "10,3", "left": "8,3", "down": "9,4"}], "10,3": [452, 168, {"right": "11,3", "left": "9,3"}], "11,3": [488, 168, {"right": "12,3", "left": "10,3"}], "12,3": [524, 168, {"right": "13,3", "left": "11,3", "up": "12,2"}], "13,3": [560, 168, {"right": "14,3", "left": "12,3", "down": "13,4"}], "14,3": [596, 168, {"right": "15,3", "left": "13,3"}], "15,3": [632, 168, {"right": "16,3", "left": "14,3", "up": "15,2", "down": "15,4"}], "16,3": [668, 168, {"right": "17,3", "left": "15,3"}], "17,3": [704, 168, {"right": "18,3", "left": "16,3"}], "18,3": [740, 168, {"left": "17,3", "up": "18,2", "down": "18,4"}], "0,4": [92, 204, {"up": "0,3", "down": "0,5"}], "3,4": [200, 204, {"up": "3,3", "down": "3,5"}], "5,4": [272, 204, {"up": "5,3", "down": "5,5"}], "9,4": [416, 204, {"up": "9,3", "down": "9,5"}], "13,4": [560, 204, {"up": "13,3", "down": "13,5"}], "15,4": [632, 204, {"up": "15,3", "down": "15,5"}], "18,4": [740, 204, {"up": "18,3", "down": "18,5"}], "0,5": [92, 240, {"right": "1,5", "up": "0,4", "down": "0,6"}], "1,5": [128, 240, {"right": "2,5", "left": "0,5"}], "2,5": [164, 240, {"right": "3,5", "left": "1,5"}], "3,5": [200, 240, {"left": "2,5", "up": "3,4", "down": "3,6"}], "5,5": [272, 240, {"up": "5,4", "down": "5,6"}], "7,5": [344, 240, {"right": "8,5"}], "8,5": [380, 240, {"right": "9,5", "left": "7,5"}], "9,5": [416, 240, {"right": "10,5", "left": "8,5", "up": "9,4"}], "10,5": [452, 240, {"right": "11,5", "left": "9,5"}], "11,5": [488, 240, {"left": "10,5"}], "13,5": [560, 240, {"up": "13,4", "down": "13,6"}], "15,5": [632, 240, {"right": "16,5", "up": "15,4", "down": "15,6"}], "16,5": [668, 240, {"right": "17,5", "left": "15,5"}], "17,5": [704, 240, {"right": "18,5", "left": "16,5"}], "18,5": [740, 240, {"left": "17,5", "up": "18,4", "down": "18,6"}], "0,6": [92, 276, {"up": "0,5", "down": "0,7"}], "3,6": [200, 276, {"up": "3,5", "down": "3,7"}], "5,6": [272, 276, {"up": "5,5", "down": "5,7"}], "13,6": [560, 276, {"up": "13,5", "down": "13,7"}], "15,6": [632, 276, {"up": "15,5", "down": "15,7"}], "18,6": [740, 276, {"up": "18,5", "down": "18,7"}], "0,7": [92, 312, {"right": "1,7", "up": "0,6", "down": "0,8"}], "1,7": [128, 312, {"right": "2,7", "left": "0,7"}], "2,7": [164, 312, {"right": "3,7", "left": "1,7"}], "3,7": [200, 312, {"right": "4,7", "left": "2,7", "up": "3,6", "down": "3,8"}], "4,7": [236, 312, {"right": "5,7", "left": "3,7"}], "5,7": [272, 312, {"right": "6,7", "left": "4,7", "up": "5,6"}], "6,7": [308, 312, {"right": "7,7", "left": "5,7", "down": "6,8"}], "7,7": [344, 312, {"right": "8,7", "left": "6,7"}], "8,7": [380, 312, {"right": "9,7", "left": "7,7"}], "9,7": [416, 312, {"right": "10,7", "left": "8,7"}], "10,7": [452, 312, {"right": "11,7", "left": "9,7"}], "11,7": [488, 312, {"right": "12,7", "left": "10,7"}], "12,7": [524, 312, {"right": "13,7", "left": "11,7", "down": "12,8"}], "13,7": [560, 312, {"right": "14,7", "left": "12,7", "up": "13,6"}], "14,7": [596, 312, {"right": "15,7", "left": "13,7"}], "15,7": [632, 312, {"right": "16,7", "left": "14,7", "up": "15,6", "down": "15,8"}], "16,7": [668, 312, {"right": "17,7", "left": "15,7"}], "17,7": [704, 312, {"right": "18,7", "left": "16,7"}], "18,7": [740, 312, {"left": "17,7", "up": "18,6", "down": "18,8"}], "0,8": [92, 348, {"up": "0,7", "down": "0,9"}], "3,8": [200, 348, {"up": "3,7", "down": "3,9"}], "6,8": [308, 348, {"up": "6,7", "down": "6,9"}], "12,8": [524, 348, {"up": "12,7", "down": "12,9"}], "15,8": [632, 348, {"up": "15,7", "down": "15,9"}], "18,8": [740, 348, {"up": "18,7", "down": "18,9"}], "0,9": [92, 384, {"up": "0,8", "down": "0,10"}], "3,9": [200, 384, {"up": "3,8", "down": "3,10"}], "6,9": [308, 384, {"up": "6,8", "down": "6,10"}], "12,9": [524, 384, {"up": "12,8", "down": "12,10"}], "15,9": [632, 384, {"up": "15,8", "down": "15,10"}], "18,9": [740, 384, {"up": "18,8", "down": "18,10"}], "0,10": [92, 420, {"right": "1,10", "up": "0,9"}], "1,10": [128, 420, {"right": "2,10", "left": "0,10"}], "2,10": [164, 420, {"right": "3,10", "left": "1,10"}], "3,10": [200, 420, {"right": "4,10", "left": "2,10", "up": "3,9"}], "4,10": [236, 420, {"right": "5,10", "left": "3,10"}], "5,10": [272, 420, {"right": "6,10", "left": "4,10"}], "6,10": [308, 420, {"right": "7,10", "left": "5,10", "up": "6,9"}], "7,10": [344, 420, {"right": "8,10", "left": "6,10"}], "8,10": [380, 420, {"right": "9,10", "left": "7,10"}], "9,10": [416, 420, {"right": "10,10", "left": "8,10"}], "10,10": [452, 420, {"right": "11,10", "left": "9,10"}], "11,10": [488, 420, {"right": "12,10", "left": "10,10"}], "12,10": [524, 420, {"right": "13,10", "left": "11,10", "up": "12,9"}], "13,10": [560, 420, {"right": "14,10", "left": "12,10"}], "14,10": [596, 420, {"right": "15,10", "left": "13,10"}], "15,10": [632, 420, {"right": "16,10", "left": "14,10", "up": "15,9"}], "16,10": [668, 420, {"right": "17,10", "left": "15,10"}], "17,10": [704, 420, {"right": "18,10", "left": "16,10"}], "18,10": [740, 420, {"left": "17,10", "up": "18,9"}]}};
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const opposite={up:'down',down:'up',left:'right',right:'left'};
function key(x,y){return Math.round((x-92)/36)+','+Math.round((y-60)/36)}
function centered(p){return Math.abs((p.x-92)/36-Math.round((p.x-92)/36))<.0001&&Math.abs((p.y-60)/36-Math.round((p.y-60)/36))<.0001}
function move(p,amount){
 while(amount>1e-7){
  if(centered(p)){
   const node=DATA.nodes[key(p.x,p.y)];
   if(!node){p.dir=null;return;}
   if(p.want&&node[2][p.want])p.dir=p.want;
   if(!p.dir||!node[2][p.dir]){p.dir=null;return;}
  }else if(p.want===opposite[p.dir])p.dir=p.want;
  const d=dirs[p.dir];if(!d)return;
  p.face=p.dir;
  const coord=d[0]?p.x-92:p.y-60,sign=d[0]||d[1];
  let rem=sign>0?36-((coord%36+36)%36):((coord%36+36)%36);
  if(rem<1e-6)rem=36;
  const dist=Math.min(amount,rem);p.x+=d[0]*dist;p.y+=d[1]*dist;amount-=dist;
  if(Math.abs(p.x-Math.round(p.x))<1e-7)p.x=Math.round(p.x);
  if(Math.abs(p.y-Math.round(p.y))<1e-7)p.y=Math.round(p.y);
 }
}
// Graph distances make enemy decisions depend on the live player, including
// counterfactual routes. Equal length routes favor the dominant approach axis.
function ghostHeading(s){
 const g=s.g, node=DATA.nodes[key(g.x,g.y)];
 if(!node)return g.heading;
 const choices=Object.keys(node[2]);
 if(choices.length===1)return choices[0];
 // During recovery the enemy keeps moving, rather than circling a vanished target.
 if(s.dead>0||s.respawn>0){
  if(node[2][g.heading])return g.heading;
  return choices.find(d=>d!==opposite[g.heading])||choices[0];
 }
 const target=key(s.p.x,s.p.y), distances={[target]:0}, queue=[target];
 for(let i=0;i<queue.length;i++){
  const at=queue[i], n=DATA.nodes[at];if(!n)continue;
  for(const next of Object.values(n[2]))if(distances[next]===undefined){distances[next]=distances[at]+1;queue.push(next);}
 }
 const dx=s.p.x-g.x,dy=s.p.y-g.y;
 const horizontal=Math.abs(dx)+36>=Math.abs(dy);
 const preferred=horizontal?(dx<0?'left':'right'):(dy<0?'up':'down');
 if(s.powered>0){
  // Keep fleeing along the current lane until its next corner.
  if(node[2][g.heading])return g.heading;
  return choices.sort((a,b)=>(distances[node[2][b]]||0)-(distances[node[2][a]]||0))[0];
 }
 return choices.sort((a,b)=>{
  const da=distances[node[2][a]]??1000,db=distances[node[2][b]]??1000;
  return da-db || (a===preferred?-1:b===preferred?1:0) || (a===g.heading?-1:b===g.heading?1:0);
 })[0];
}
function ghostAdvance(s,distance){
 const g=s.g;
 while(distance>1e-7){
  if(centered(g)){
   const node=DATA.nodes[key(g.x,g.y)];
   // Intercept an approaching player; pursue a stationary or receding one.
   if(g.leg===0&&node?.[2].down&&s.p.y>g.y+36&&s.p.dir!=='up'){
    g.leg=1;g.heading='down';
   }else if(g.leg!==0)g.heading=ghostHeading(s);
  }
  const d=dirs[g.heading];if(!d)return;
  const coord=d[0]?g.x-92:g.y-60,sign=d[0]||d[1];
  let rem=sign>0?36-((coord%36+36)%36):((coord%36+36)%36);
  if(rem<1e-6)rem=36;
  const n=Math.min(distance,rem);g.x+=d[0]*n;g.y+=d[1]*n;distance-=n;
  if(d[0])g.dir=d[0];
  if(g.leg===0&&g.x>=308){g.x=308;g.leg=1;g.heading=ghostHeading(s);g.dir=dirs[g.heading][0]||g.dir;}
 }
}
window.World={
 meta:{name:'Monochrome Maze',source:[832,480],fps:10,dt:1/60},
 actions:Object.keys(dirs).map(id=>({id,kind:'hold',keys:[{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[id],{up:'w',down:'s',left:'a',right:'d'}[id]],description:'Move '+id})),
 assets:{maze:'assets/maze.png',dot:'assets/dot.png',power:'assets/power.png',pac:'assets/pac.png',ghost:'assets/ghost.png'},
 init(){return {t:0,clock:0,p:{x:200,y:348,dir:null,want:null,face:'left'},g:{x:164,y:60,dir:1,heading:'right',leg:0,tick:0},pellets:DATA.pellets.map(p=>({x:p[0],y:p[1],power:p[2],alive:true})),powered:0,score:0,dead:0,respawn:0,invulnerable:0,events:[]};},
 step(s,acts,dt){
  s.clock+=dt;
  for(const a of acts)if(dirs[a.id])s.p.want=a.id;
  s.powered=Math.max(0,s.powered-dt);
  s.invulnerable=Math.max(0,s.invulnerable-dt);
  s.respawn=Math.max(0,s.respawn-dt);
  const g=s.g;
  const tick=Math.ceil(s.clock*7.5-1e-8);
  if(g.burst>1e-8){
   const used=Math.min(dt,g.burst);ghostAdvance(s,360*used);g.burst=Math.max(0,g.burst-dt);
  }else for(let k=g.tick;k<tick;k++)ghostAdvance(s,12);
  g.tick=tick;
  if(s.dead>0){
   s.dead=Math.max(0,s.dead-dt);
   if(s.dead===0){
    const want=s.p.want;
    s.p={x:200,y:348,dir:null,want,face:'left'};
    s.respawn=.25;s.invulnerable=1;
   }
   return;
  }
  if(s.respawn>0)return;
  move(s.p,120*dt);
  for(const p of s.pellets)if(p.alive&&Math.hypot(p.x-s.p.x,p.y-s.p.y)<(p.power?12.01:1)){
   p.alive=false;s.score+=p.power?50:10;s.events.push({type:p.power?'power':'pellet',x:p.x,y:p.y});
   if(p.power){s.powered=2.5;g.heading=opposite[g.heading];g.dir=dirs[g.heading][0]||g.dir;g.leg=2;g.burst=.1;}
  }
  if(s.invulnerable===0&&Math.hypot(g.x-s.p.x,g.y-s.p.y)<22){
   if(s.powered>0){g.heading=opposite[g.heading];g.dir=-g.dir;g.burst=.2;s.invulnerable=.7;s.score+=200;s.events.push({type:'ghost_eaten'});}
   else {s.dead=.8;s.events.push({type:'caught'});}
  }
 },
 render(ctx,s,img){
  ctx.fillStyle='#000';ctx.fillRect(0,0,832,480);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img.maze,0,0);
  for(const p of s.pellets)if(p.alive){const a=p.power?img.power:img.dot;ctx.drawImage(a,p.x-a.width/2+.5,p.y-a.height/2+.5);}
  const g=s.g, gx=g.x;
  const gp=s.powered>1e-7&&!(g.burst>1e-7)?2:g.dir<0?1:(s.clock>3.4?3:0);
  ctx.drawImage(img.ghost,gp*40,0,40,40,Math.round(gx)-20,Math.round(g.y)-20,40,40);
  {
   const p=s.p;const phase=Math.floor((s.clock+1e-6)*10)%4;
   ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
   if(s.dead>0){const visibility=Math.max(0,(s.dead-.15)/.65);ctx.globalAlpha=visibility;ctx.scale(Math.max(.05,visibility),Math.max(.05,visibility));}
   else if(s.respawn>0)ctx.globalAlpha=1-s.respawn/.25;
   ctx.rotate({up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[p.face]);
   ctx.drawImage(img.pac,phase*40,0,40,40,-20,-20,40,40);ctx.restore();
  }
 },
 replay:{duration:6.1,actions:[{t:.1,id:'up'},{t:1.6,id:'left'},{t:2.5,id:'up'},{t:3.4,id:'down'},{t:3.7,id:'up'},{t:4,id:'right'},{t:5.8,id:'down'}]}
};
})();
