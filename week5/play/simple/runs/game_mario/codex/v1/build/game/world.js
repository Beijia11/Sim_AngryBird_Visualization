(function () {
  'use strict';
  const FLOOR = 644, G = 4000;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const pipes = [{x:2208,y:542,w:160},{x:3008,y:490,w:160},{x:3648,y:438,w:160},{x:4448,y:438,w:160}];
  function blocks() {
    return [{x:1248,y:438,kind:'question'}, ...[0,1,2,3,4].map(i=>({x:1568+i*80,y:438,kind:(i===1||i===3)?'question':'brick'})),{x:1728,y:232,kind:'question'}].map(b=>({...b,w:80,h:50,used:false,bump:0}));
  }
  // Joint proportions are measured from the pixel character; the detector supplied no poses.
  function character(x,y,h,phase,air,face) {
    const stride = air ? 0.8 : Math.sin(phase), f=face;
    const p={
      nose:[f*10,-h*.84],left_eye:[f*7-4,-h*.88],right_eye:[f*7+4,-h*.88],
      left_ear:[-9,-h*.85],right_ear:[9,-h*.85],
      left_shoulder:[-12,-h*.64],right_shoulder:[12,-h*.64],
      left_elbow:[-15-f*stride*10,-h*(air?.68:.43)],right_elbow:[15+f*stride*10,-h*(air?.80:.43)],
      left_wrist:[-12-f*stride*20,-h*(air?.45:.32)],right_wrist:[12+f*stride*20,-h*(air?.96:.32)],
      left_hip:[-9,-h*.34],right_hip:[9,-h*.34],
      left_knee:[-10-stride*16,-h*.18],right_knee:[10+stride*16,-h*(air?.25:.18)],
      left_ankle:[-9-stride*21,0],right_ankle:[9+stride*21,air?-h*.12:0]
    };
    return {cls:'character',joints:SimKit.pose.placeAt(p,[x,y-4]),thickness:h>70?16:11,z:y};
  }
  function bump(s,b) {
    b.bump=.18;
    s.events.push({type:'block_hit',x:b.x});
    if(b.kind==='question'&&!b.used) {
      b.used=true;
      if(b.x===1648) s.power={x:b.x+40,y:b.y+24,vy:0,emerge:1.02,alive:true};
      else s.coins.push({x:b.x+40,y:b.y-16,vy:-600,life:.55});
    } else if(b.kind==='brick'&&s.player.big) {
      b.broken=true;
      for(let i=0;i<4;i++) s.debris.push({x:b.x+20+(i%2)*40,y:b.y+12+Math.floor(i/2)*25,vx:(i%2?1:-1)*180,vy:-500-Math.floor(i/2)*180,life:1.2});
    }
  }
  window.World={
    meta:{name:'Scrolling platform jumps and power-up',source:[1280,720],fps:59.94005994005994,dt:1/60},
    actions:[
      {id:'move',kind:'continuous',keys:['ArrowLeft','ArrowRight'],min:-1,max:1,description:'Run left or right'},
      {id:'jump',kind:'tap',keys:[' ','ArrowUp'],description:'Jump; strike blocks or clear pipes'}
    ],
    init() {
      return {elapsed:0,cam:0,events:[],player:{x:457,y:506,vx:0,vy:480,ground:false,big:false,face:1,phase:0,freeze:0},blocks:blocks(),power:null,coins:[],debris:[],
        enemies:[{x:1838,y:FLOOR,vx:-145,alive:true,squash:0},{x:3420,y:FLOOR,vx:-78,alive:true,squash:0},{x:4220,y:FLOOR,vx:-90,alive:true,squash:0}]};
    },
    step(s,acts,dt) {
      s.elapsed+=dt;
      const p=s.player;
      let move=0,jump=false,strength=1150;
      for(const a of acts) {if(a.id==='move')move=clamp(a.value===undefined?1:a.value,-1,1);if(a.id==='jump'){jump=true;if(typeof a.value==='number')strength=clamp(a.value,600,1500);}}
      for(const b of s.blocks)b.bump=Math.max(0,b.bump-dt);
      for(const c of s.coins){c.vy+=G*dt;c.y+=c.vy*dt;c.life-=dt;}
      s.coins=s.coins.filter(c=>c.life>0);
      for(const d of s.debris){d.vy+=G*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.life-=dt;}
      s.debris=s.debris.filter(d=>d.life>0);
      if(p.freeze>0){p.freeze=Math.max(0,p.freeze-dt);if(p.freeze===0){p.big=true;s.events.push({type:'grow'});}return;}
      p.vx=move*720;
      if(move)p.face=Math.sign(move);
      if(jump&&p.ground){p.vy=-strength;p.ground=false;s.events.push({type:'jump'});}
      const oldX=p.x,oldY=p.y,h=p.big?100:50;
      p.x+=p.vx*dt;
      p.vy+=G*dt;p.y+=p.vy*dt;p.ground=false;
      const solids=s.blocks.filter(b=>!b.broken).concat(pipes.map(b=>({...b,h:FLOOR-b.y,pipe:true})));
      for(const b of solids){
        if(p.x+26<=b.x||p.x-26>=b.x+b.w)continue;
        if(p.vy>=0&&oldY<=b.y+3&&p.y>=b.y){p.y=b.y;p.vy=0;p.ground=true;}
        else if(!b.pipe&&p.vy<0&&oldY-h>=b.y+b.h-2&&p.y-h<=b.y+b.h){p.y=b.y+b.h+h;p.vy=110;bump(s,b);}
        else if(b.pipe&&p.y>b.y+5&&p.y-h<FLOOR){if(oldX+26<=b.x+3){p.x=b.x-26;p.vx=0;}else if(oldX-26>=b.x+b.w-3){p.x=b.x+b.w+26;p.vx=0;}}
      }
      if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.ground=true;}
      p.phase+=Math.abs(p.vx)*dt*.06;
      for(const e of s.enemies){
        if(!e.alive){e.squash=Math.max(0,e.squash-dt);continue;}
        // Distant enemies begin walking as they enter the camera's active area.
        if(e.x-s.cam<1400)e.x+=e.vx*dt;
        for(const pipe of pipes)if(e.x+31>pipe.x&&e.x-31<pipe.x+pipe.w){e.x=e.vx<0?pipe.x+pipe.w+32:pipe.x-32;e.vx=-e.vx;}
        if(Math.abs(e.x-p.x)<55&&p.y>e.y-52&&p.y-h<e.y){
          if(p.vy>0&&oldY<e.y-22){e.alive=false;e.squash=.25;p.y=e.y-40;p.vy=-650;p.ground=false;s.events.push({type:'stomp'});}
          else if(p.big){p.big=false;e.alive=false;e.squash=.2;s.events.push({type:'contact'});}
          else {e.alive=false;e.squash=.2;s.events.push({type:'contact'});}
        }
      }
      const m=s.power;
      if(m&&m.alive){
        if(m.emerge>0){m.emerge=Math.max(0,m.emerge-dt);m.y=414+48*m.emerge/1.02;}
        else {
          const oy=m.y;m.x+=300*dt;m.vy+=G*dt;m.y+=m.vy*dt;
          for(const b of solids)if(m.x+28>b.x&&m.x-28<b.x+b.w&&oy+24<=b.y+4&&m.y+24>=b.y&&m.vy>=0){m.y=b.y-24;m.vy=0;}
          if(m.y+24>FLOOR){m.y=FLOOR-24;m.vy=0;}
          if(Math.abs(m.x-p.x)<58&&m.y+24>p.y-h&&m.y-24<p.y){m.alive=false;p.freeze=.88;s.events.push({type:'power_up'});}
        }
      }
      const anchor=Math.min(608,457+s.elapsed*210);
      s.cam=Math.max(s.cam,p.x-anchor);
    },
    proxy(s) {
      const c=s.cam,p=s.player,regions=[{cls:'sky',rect:[0,0,1280,720]}],boxes=[],figures=[];
      function poly(cls,points){regions.push({cls,polygon:points.map(q=>[q[0]-c,q[1]])});}
      // Sparse silhouettes retain the level's spatial landmarks, without pixel textures.
      for(const hill of [{x:170,w:400,h:114},{x:1250,w:400,h:64},{x:2690,w:290,h:55},{x:4100,w:440,h:110}])
        poly('vegetation',[[hill.x-hill.w/2,FLOOR],[hill.x-40,FLOOR-hill.h],[hill.x+5,FLOOR-hill.h-4],[hill.x+hill.w/2,FLOOR]]);
      for(const b of [{x:1050,w:340},{x:1900,w:180},{x:3400,w:240},{x:3930,w:190}]){
        const pts=[[b.x-b.w/2,FLOOR]];
        for(let i=0;i<=12;i++){const x=b.x-b.w/2+i*b.w/12;pts.push([x,FLOOR-22-30*Math.abs(Math.sin(i*1.15))]);}
        pts.push([b.x+b.w/2,FLOOR]);poly('vegetation',pts);
      }
      const clouds=[{x:730,y:170,w:155},{x:1690,y:120,w:150},{x:2420,y:170,w:315},{x:3260,y:115,w:235},{x:4520,y:145,w:220}];
      for(const cloud of clouds){
        const {x,y,w}=cloud;poly('other',[[x-w/2,y+15],[x-w*.43,y-1],[x-w*.29,y-9],[x-w*.23,y-28],[x-w*.11,y-30],[x,y-17],[x+w*.13,y-27],[x+w*.25,y-22],[x+w*.3,y-4],[x+w*.44,y+1],[x+w/2,y+21],[x+w*.33,y+28],[x+w*.13,y+24],[x,y+28],[x-w*.23,y+27]]);
      }
      regions.push({cls:'ground',rect:[0,FLOOR,1280,76]});
      // Ground tile boundaries are geometric lines rather than artwork.
      for(let x=Math.floor(c/80)*80;x<c+1360;x+=80){regions.push({cls:'line',rect:[x-c,FLOOR,2,76]});}
      regions.push({cls:'line',rect:[0,682,1280,2]});
      for(const pipe of pipes)if(pipe.x-c<1300&&pipe.x+pipe.w-c>-20){
        regions.push({cls:'obstacle',rect:[pipe.x+14-c,pipe.y+44,pipe.w-28,FLOOR-pipe.y-44]});
        regions.push({cls:'platform',rect:[pipe.x-c,pipe.y,pipe.w,44]});
      }
      for(const b of s.blocks)if(!b.broken&&b.x-c>-90&&b.x-c<1300){
        const dy=b.bump>0?-14*Math.sin(b.bump/.18*Math.PI):0;
        boxes.push({cls:b.used?'static':'object',center:[b.x+40-c,b.y+25+dy],size:[80,50]});
      }
      const m=s.power;
      if(m&&m.alive)boxes.push({cls:'object',center:[m.x-c,m.y],size:[76,m.emerge>0?Math.max(8,48*(1-m.emerge/1.02)):48],z:440});
      for(const coin of s.coins)boxes.push({cls:'object',center:[coin.x-c,coin.y],size:[18,34]});
      for(const d of s.debris)boxes.push({cls:'object',center:[d.x-c,d.y],size:[30,20],angle:s.elapsed*7});
      for(const e of s.enemies){if(e.x-c<-100||e.x-c>1380||(!e.alive&&e.squash<=0))continue;
        if(!e.alive){boxes.push({cls:'object',center:[e.x-c,FLOOR-6],size:[70,12]});continue;}
        const x=e.x-c,w=Math.sin(s.elapsed*14)*9;
        figures.push({cls:'character',joints:{nose:[x,FLOOR-36],left_shoulder:[x-17,FLOOR-28],right_shoulder:[x+17,FLOOR-28],left_hip:[x-14,FLOOR-17],right_hip:[x+14,FLOOR-17],left_knee:[x-21,FLOOR-10],right_knee:[x+21,FLOOR-10],left_ankle:[x-25-w,FLOOR-3],right_ankle:[x+25+w,FLOOR-3]},thickness:16});
      }
      let height=p.big?100:50;
      if(p.freeze>0)height=Math.floor(p.freeze*14)%2?100:50;
      figures.push(character(p.x-c,p.y,height,p.phase,!p.ground,p.face));
      return {regions,figures,boxes,media:[]};
    },
    replay:{duration:10.21,actions:[
      {t:0,id:'move',value:.64,until:.34},
      {t:.34,id:'jump'},
      {t:.34,id:'move',value:.92,until:1.05},
      {t:1.05,id:'move',value:.68,until:1.50},
      {t:1.50,id:'move',value:.20,until:2.02},
      {t:2.02,id:'move',value:.50,until:2.50},
      {t:2.07,id:'jump',value:1080},
      {t:2.50,id:'move',value:.54,until:3.02},
      {t:2.94,id:'jump'},
      {t:3.02,id:'move',value:.12,until:3.20},
      {t:3.20,id:'move',value:-.16,until:4.45},
      {t:3.39,id:'jump'},
      {t:4.05,id:'jump',value:1100},
      {t:4.73,id:'move',value:.93,until:5.05},
      {t:5.05,id:'move',value:.67,until:5.57},
      {t:5.57,id:'jump'},
      {t:5.57,id:'move',value:.24,until:5.82},
      {t:6.80,id:'move',value:.28,until:7.40},
      {t:7.28,id:'jump',value:1110},
      {t:7.40,id:'move',value:.40,until:8.05},
      {t:8.05,id:'move',value:.99,until:8.60},
      {t:8.60,id:'move',value:.78,until:9.05},
      {t:9.05,id:'jump',value:1370},
      {t:9.05,id:'move',value:.22,until:9.58},
      {t:9.58,id:'move',value:.91,until:10.21},
      {t:9.70,id:'jump',value:1370}
    ]}
  };
})();
