(function () {
  "use strict";
  // Coordinates are source-video pixels. The two sprites have no articulated limbs.
  const DOTS = [[91.96,59.82,18],[739.74,59.84,18],[127.86,59.8,5],[200.13,59.93,5],[235.76,59.8,5],[271.7,59.8,5],[343.85,59.8,5],[379.6,59.8,5],[416.0,59.8,5],[451.75,59.8,5],[487.57,59.67,5],[523.9,59.8,5],[559.84,59.8,5],[631.8,59.8,5],[668.07,59.86,5],[703.76,59.8,5],[307.89,95.99,5],[523.69,95.99,5],[739.91,95.99,5],[91.98,131.62,5],[307.89,131.51,5],[523.9,131.95,5],[631.8,131.76,5],[739.84,131.66,5],[91.94,167.84,5],[127.61,167.91,5],[163.8,167.7,5],[235.66,167.84,5],[451.75,167.7,5],[523.9,167.7,5],[559.94,167.84,5],[595.61,167.91,5],[631.8,167.7,5],[667.99,167.91,5],[199.99,203.89,5],[416.0,204.1,5],[560.09,203.89,5],[631.8,204.1,5],[91.95,239.85,5],[127.71,239.7,5],[199.83,240.0,5],[343.85,239.85,5],[452.05,239.85,5],[559.95,239.85,5],[631.8,239.85,5],[667.85,239.85,5],[703.81,239.82,5],[739.7,239.85,5],[92.09,275.81,5],[199.99,275.81,5],[560.09,275.81,5],[631.8,275.6,5],[739.91,275.81,5],[127.61,311.79,5],[163.8,312.0,5],[199.99,311.79,5],[235.66,311.86,5],[271.7,312.0,5],[308.03,311.87,5],[379.67,311.87,5],[416.0,312.0,5],[523.9,312.0,5],[560.09,311.79,5],[667.99,311.79,5],[703.66,311.86,5],[739.7,312.0,5],[631.8,347.75,5],[739.7,347.75,5],[92.09,383.71,5],[199.99,383.71,5],[307.89,383.71,5],[523.84,383.63,5],[631.73,383.71,5],[91.91,419.86,18],[739.7,419.9,18],[127.76,419.76,5],[235.95,419.9,5],[271.7,419.9,5],[308.1,419.9,5],[343.85,419.9,5],[379.6,419.9,5],[416.0,419.9,5],[487.71,419.69,5],[523.9,419.9,5],[559.94,419.76,5],[595.76,419.76,5],[631.8,419.9,5],[667.99,419.69,5],[703.95,419.9,5]];
  const X0 = 91.5, Y0 = 59.5, CELL = 36;
  const RECTS = [
    [112,80,70,70], [220,80,70,70], [328,80,178,70],
    [544,80,70,70], [652,80,70,70],
    [112,188,70,34], [220,188,34,106],
    [580,188,34,106], [652,188,70,34],
    [112,260,70,34], [652,260,70,34],
    [112,332,70,70], [220,332,70,70], [328,332,178,70],
    [544,332,70,70], [652,332,70,70]
  ];
  const CENTRAL = [[292,188],[398,188],[398,222],[326,222],
    [326,260],[508,260],[508,222],[436,222],[436,188],
    [542,188],[542,294],[292,294]];
  const WALLS = RECTS.map(r => [[r[0],r[1]],[r[0]+r[2],r[1]],
    [r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]]).concat([CENTRAL]);
  const DIR = {left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  function inside(x,y,poly) {
    let hit=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
      const a=poly[i],b=poly[j];
      if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
    }
    return hit;
  }
  function segmentDistance(x,y,a,b) {
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy);
  }
  function open(x,y) {
    if(x<X0-0.01 || x>X0+18*CELL+0.01 || y<Y0-0.01 || y>Y0+10*CELL+0.01) return false;
    for(const p of WALLS) {
      if(inside(x,y,p)) return false;
      for(let i=0;i<p.length;i++) if(segmentDistance(x,y,p[i],p[(i+1)%p.length])<14.5) return false;
    }
    return true;
  }
  function nearest(v,origin) { return origin+Math.round((v-origin)/CELL)*CELL; }
  function canTurn(p,d) {
    const x=nearest(p.x,X0),y=nearest(p.y,Y0);
    if (Math.abs(x-p.x)>2.05 || Math.abs(y-p.y)>2.05) return false;
    if(!open(x+d[0]*CELL,y+d[1]*CELL)) return false;
    // Checking the middle prevents a turn across a thin wall.
    if(!open(x+d[0]*CELL/2,y+d[1]*CELL/2)) return false;
    p.x=x;p.y=y;
    return true;
  }
  function movePlayer(s,dt) {
    const p=s.player, desired=DIR[p.queued];
    if(desired) {
      const reversing = desired[0]===-p.dx && desired[1]===-p.dy;
      if(reversing || canTurn(p,desired)) {
        if(p.dx!==desired[0] || p.dy!==desired[1]) s.events.push({type:'turn',by:'player',direction:p.queued});
        p.dx=desired[0];p.dy=desired[1];p.facing=p.queued;p.queued=null;
      }
    }
    const nx=p.x+p.dx*120*dt,ny=p.y+p.dy*120*dt;
    if(open(nx,ny)) {p.x=nx;p.y=ny;p.distance+=120*dt*(Math.abs(p.dx)+Math.abs(p.dy));}
    else {p.dx=0;p.dy=0;}
  }
  function eat(s) {
    const p=s.player;
    for(const d of s.pellets) {
      if(!d.eaten && Math.hypot(d.x-p.x,d.y-p.y)<7) {
        d.eaten=true;s.score+=d.size>10?50:10;
        s.events.push({type:d.size>10?'power':'collect',by:'player',position:[d.x,d.y]});
        if(d.size>10) {
          s.power=6;
          // The ghost reverses and briefly accelerates away from a powered player.
          s.ghost.dir=s.ghost.x>=p.x?1:-1;
          s.ghost.sprint=0.1;
        }
      }
    }
  }
  function moveGhost(s,dt) {
    const g=s.ghost;
    const frightened=s.power>0;
    let speed=g.sprint>0?360:90;
    g.sprint=Math.max(0,g.sprint-dt);
    g.x+=g.dir*speed*dt;
    const lo=frightened?X0:151.5,hi=frightened?X0+18*CELL:307.5;
    if(g.x>hi) {g.x=2*hi-g.x;g.dir=-1;}
    if(g.x<lo) {g.x=2*lo-g.x;g.dir=1;}
    if(Math.hypot(g.x-s.player.x,g.y-s.player.y)<25 && !s.contact) {
      s.contact=true;
      if(frightened) {
        s.score+=200;s.events.push({type:'capture',by:'player'});
        g.x=415.5;g.y=Y0;g.dir=1;
      } else {
        s.events.push({type:'caught',by:'ghost'});
        s.player.dx=0;s.player.dy=0;s.player.queued=null;
      }
    } else if(Math.hypot(g.x-s.player.x,g.y-s.player.y)>35) s.contact=false;
  }
  function environment() {
    const r=[{cls:'floor',rect:[0,0,832,480]},
      {cls:'wall',rect:[72,40,688,400]},
      {cls:'floor',rect:[75,43,682,394]}];
    // Thin flat wall regions preserve the hollow, rectilinear maze boundaries.
    for(const p of WALLS) for(let i=0;i<p.length;i++) {
      const a=p[i],b=p[(i+1)%p.length];
      if(a[0]===b[0]) r.push({cls:'wall',rect:[a[0]-1.8,Math.min(a[1],b[1])-1.8,3.6,Math.abs(a[1]-b[1])+3.6]});
      else r.push({cls:'wall',rect:[Math.min(a[0],b[0])-1.8,a[1]-1.8,Math.abs(a[0]-b[0])+3.6,3.6]});
    }
    return r;
  }
  window.World = {
    meta:{name:'Maze chase',source:[832,480],fps:10,dt:1/60},
    actions:[
      {id:'up',kind:'tap',keys:['ArrowUp','w'],description:'turn upward'},
      {id:'down',kind:'tap',keys:['ArrowDown','s'],description:'turn downward'},
      {id:'left',kind:'tap',keys:['ArrowLeft','a'],description:'turn left'},
      {id:'right',kind:'tap',keys:['ArrowRight','d'],description:'turn right'},
      {id:'stop',kind:'tap',keys:[' '],description:'stop moving'}
    ],
    init(rng) {
      return {t:0,elapsed:0,events:[],score:0,power:0,contact:false,
        player:{x:199.5,y:347.5,dx:0,dy:0,queued:null,facing:'left',distance:0},
        ghost:{x:163.5,y:59.5,dir:1,sprint:0},
        pellets:DOTS.map(d=>({x:d[0],y:d[1],size:d[2],eaten:false}))};
    },
    step(s,acts,dt,rng) {
      if(!s.events) s.events=[];
      for(const a of acts) {
        if(DIR[a.id]) s.player.queued=a.id;
        if(a.id==='stop') {s.player.dx=0;s.player.dy=0;s.player.queued=null;}
      }
      // Substeps keep wall contacts and queued intersection turns stable for larger dt.
      const n=Math.max(1,Math.ceil(dt/(1/60))),h=dt/n;
      for(let i=0;i<n;i++) {
        s.elapsed+=h;s.power=Math.max(0,s.power-h);
        movePlayer(s,h);eat(s);moveGhost(s,h);
      }
    },
    proxy(s) {
      const boxes=[];
      for(const d of s.pellets) if(!d.eaten) boxes.push({cls:'prop',center:[d.x,d.y],size:[d.size,d.size],z:0});
      const p=s.player;
      const angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
      boxes.push({cls:'object',center:[p.x,p.y],size:[32,32],angle:angles[p.facing],z:2});
      boxes.push({cls:'object',center:[s.ghost.x,s.ghost.y],size:[30,30],z:2});
      return {regions:environment(),figures:[],boxes:boxes,media:[]};
    },
    replay:{duration:6.1,actions:[
      {t:0.1,id:'up'},
      {t:1.6,id:'left'},
      {t:2.5,id:'up'},
      {t:3.4,id:'down'},
      {t:3.7,id:'up'},
      {t:4.0,id:'right'},
      {t:5.8,id:'down'}
    ]}
  };
})();
