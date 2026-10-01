(function () {
  'use strict';
  // World-space units are the 640-wide observation images; output is source pixels.
  const S = 1.5, G = 255, sling = { x: -380, y: 233 };
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,u) => a+(b-a)*u;
  function key(k,t) {
    if(t<=k[0][0]) return k[0][1];
    for(let i=1;i<k.length;i++) if(t<=k[i][0]) return mix(k[i-1][1],k[i][1],(t-k[i-1][0])/(k[i][0]-k[i-1][0]));
    return k[k.length-1][1];
  }
  function body(x,y,w,h,vx,vy,a,spin,kind) { return {x,y,w,h,vx:vx||0,vy:vy||0,a:a||0,spin:spin||0,kind:kind||'prop',life:30}; }
  function burst(s,x,y,n,rng) {
    for(let i=0;i<n;i++) {
      const a=rng()*Math.PI*2, v=35+rng()*115;
      let b=body(x,y,3+rng()*11,2+rng()*4,Math.cos(a)*v,Math.sin(a)*v-50,rng()*6,(rng()-.5)*12);
      b.life=1.1+rng()*1.8; s.bits.push(b);
    }
    s.puffs.push({x,y,r:10,life:.45});
  }
  function impact(s,rng) {
    s.broken=true; s.collapse=0; s.omega=.30;
    s.events.push({type:'hit',by:'bird',target:'tower'});
    burst(s,310,133,19,rng);
    s.loose.push(body(338,52,12,28,43,-137,0,.7));
    s.loose.push(body(335,72,56,11,157,-113,0,.3));
    s.loose.push(body(362,132,12,112,67,-35,0,1.2));
    s.bird.vx=36; s.bird.vy=65; s.bird.a=.2;
  }
  function integrate(b,dt,floor) {
    b.vy+=G*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.a+=b.spin*dt;
    const extent=(Math.abs(Math.sin(b.a))*b.w+Math.abs(Math.cos(b.a))*b.h)/2;
    if(b.y+extent>floor) {
      b.y=floor-extent;
      if(b.vy>0) b.vy=-b.vy*.20;
      b.vx*=Math.exp(-5*dt); b.spin*=Math.exp(-6*dt);
      if(Math.abs(b.vy)<9) b.vy=0;
    }
    b.life-=dt;
  }
  window.World = {
    meta:{name:'Slingshot and collapsing tower',source:[960,536],fps:29.287,dt:1/60},
    actions:[
      {id:'aim',kind:'hold',keys:['ArrowLeft','a'],description:'draw the slingshot back'},
      {id:'raise',kind:'hold',keys:['ArrowUp','w'],description:'raise launch angle'},
      {id:'lower',kind:'hold',keys:['ArrowDown','s'],description:'lower launch angle'},
      {id:'release',kind:'tap',keys:[' '],description:'release the bird'},
      {id:'pull',kind:'drag',description:'pull and release the slingshot'}
    ],
    init(rng) {
      return {time:0,events:[],draw:0,aimY:36,mode:'loaded',launchedAt:null,
        bird:body(sling.x,sling.y,27,27,0,0,0,0,'projectile'),
        broken:false,collapse:0,theta:0,omega:0,pig:true,pigDelay:0,
        loose:[],bits:[],puffs:[],trail:[],trailClock:0,glassBroken:false,
        camera:{left:0,zoom:1,ground:350}};
    },
    step(s,acts,dt,rng) {
      s.time+=dt;
      let fire=false;
      for(const act of acts) {
        if(s.mode!=='loaded') continue;
        if(act.id==='aim') s.draw=clamp(s.draw+dt*4,0,1);
        if(act.id==='raise') s.aimY=clamp(s.aimY+dt*20,8,62);
        if(act.id==='lower') s.aimY=clamp(s.aimY-dt*20,8,62);
        if(act.id==='release') { s.draw=Math.max(s.draw,.9);fire=true; }
        if(act.id==='pull') {
          const v=act.value||{dx:-102,dy:54};
          s.draw=clamp(-v.dx/S/68,.2,1.25);s.aimY=clamp(v.dy/S,5,70);fire=true;
        }
      }
      if(s.mode==='loaded') {
        s.bird.x=sling.x-68*s.draw;s.bird.y=sling.y+s.aimY*s.draw;
        if(fire) {
          s.mode='flight';s.launchedAt=s.time;s.bird.vx=68*s.draw*7.7;s.bird.vy=-s.aimY*s.draw*7.7;
          s.events.push({type:'release',by:'slingshot'});
        }
      }
      if(s.mode==='flight') {
        s.bird.vy+=G*dt;s.bird.x+=s.bird.vx*dt;s.bird.y+=s.bird.vy*dt;
        s.bird.a=Math.atan2(s.bird.vy,s.bird.vx)*.3;
        s.trailClock+=dt;
        if(!s.broken && s.trailClock>.07) {s.trailClock=0;s.trail.push([s.bird.x,s.bird.y]);}
        if(!s.broken && s.bird.x+13>=304 && s.bird.x<373 && s.bird.y>60 && s.bird.y<196) impact(s,rng);
        if(s.broken) {
          const roofY=310-116*Math.cos(s.theta)-20;
          if(s.bird.y+12>=roofY && s.bird.x>275 && s.bird.x<500) {
            s.bird.y=roofY-12;s.bird.vy=0;s.bird.vx=14+18*Math.sin(s.theta);
          }
        }
        if(s.bird.y>336) {s.bird.y=336;s.bird.vy=0;s.bird.vx*=Math.exp(-5*dt);}
      }
      if(s.broken) {
        s.collapse+=dt;s.omega+=.25*dt;
        s.theta=Math.min(1.18,s.theta+s.omega*dt);
        if(s.collapse>.16 && s.pig) {
          s.pig=false;burst(s,338,157,9,rng);s.events.push({type:'destroy',target:'pig'});
        }
        if(s.collapse>1.85 && !s.glassBroken) {
          s.glassBroken=true;burst(s,383,266,15,rng);s.events.push({type:'break',target:'inner_support'});
          s.loose.push(body(448,273,110,11,63,10,-.35,.75));
        }
      }
      for(const b of s.loose) integrate(b,dt,344);
      for(const b of s.bits) integrate(b,dt,344);
      s.bits=s.bits.filter(b=>b.life>0);
      for(const p of s.puffs) {p.life-=dt;p.r+=30*dt;p.y-=15*dt;}
      s.puffs=s.puffs.filter(p=>p.life>0);
      if(s.launchedAt===null) {
        let u=clamp((s.time-.854)/.65,0,1);
        s.camera.left=-566*u;s.camera.zoom=1+.18*u*u;s.camera.ground=350-12*u;
      } else {
        const a=s.time-s.launchedAt;
        s.camera.left=key([[0,-566],[.24,-490],[.75,-235],[1.26,-70],[1.7,0]],a);
        s.camera.zoom=key([[0,1.18],[.3,1.055],[.65,.94],[1.3,.99],[1.7,1]],a);
        s.camera.ground=key([[0,338],[.65,326],[1.3,343],[1.7,350]],a);
      }
    },
    proxy(s) {
      const regions=[],boxes=[],figures=[],media=[];
      const c=s.camera;
      const P=(x,y)=>[(x-c.left)*c.zoom*S,(c.ground+(y-350)*c.zoom)*S];
      const poly=(cls,pts)=>regions.push({cls,polygon:pts.map(p=>P(p[0],p[1]))});
      const rect=(cls,x,y,w,h)=>poly(cls,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
      const box=(x,y,w,h,a,cls)=>boxes.push({cls:cls||'prop',center:P(x,y),size:[w*c.zoom*S,h*c.zoom*S],angle:a||0});
      const beam=(x1,y1,x2,y2,w,cls)=>box((x1+x2)/2,(y1+y2)/2,Math.hypot(x2-x1,y2-y1),w,Math.atan2(y2-y1,x2-x1),cls);
      regions.push({cls:'sky',rect:[0,0,960,536]});
      // Low rolling horizon and sparse large vegetation silhouettes.
      poly('other',[[-1000,322],[-1000,302],[-740,292],[-530,271],[-300,295],[-100,263],[80,296],[260,268],[500,296],[780,269],[1000,300],[1500,291],[1500,350]]);
      for(const x of [-920,-635,-348,-70,176,527,790,1100]) {
        const h=115+38*Math.sin(x*1.7),y=350;
        poly('vegetation',[[x-17,y],[x-9,y-h],[x+13,y-h-3],[x+24,y]]);
        for(let j=0;j<3;j++) {
          const yy=y-h+20+j*31;
          poly('vegetation',[[x,yy+18],[x-32,yy+8],[x-49,yy-18],[x-46,yy-35],[x-27,yy-11],[x-22,yy-30],[x-13,yy+3]]);
          poly('vegetation',[[x+8,yy+28],[x+34,yy+14],[x+43,yy-5],[x+30,yy+1],[x+31,yy-19],[x+20,yy-8]]);
        }
      }
      rect('ground',-1800,348,4200,180);
      rect('vegetation',-1800,342,4200,7);
      for(let i=-85;i<100;i++) {
        const x=i*17,h=10+17*(.5+.5*Math.sin(i*4.71));
        poly('vegetation',[[x,345],[x-4,345-h],[x+3,337],[x+10,323-h*.3],[x+7,345]]);
      }
      // Fixed trestle platform under the tower.
      rect('platform',207,312,246,9);
      for(let x=217;x<450;x+=29) {
        rect('structure',x,321,6,27);
        poly('platform',[[x+4,322],[x+27,341],[x+23,345],[x,326]]);
        poly('platform',[[x+25,322],[x+3,341],[x+6,345],[x+29,326]]);
      }
      box(224,298,12,28,0,'static');box(443,298,12,28,0,'static');
      // The fork is fixed, while the two elastic segments follow the pocket.
      poly('structure',[[-385,345],[-374,345],[-377,289],[-365,271],[-359,244],[-360,218],[-369,218],[-370,246],[-379,270],[-386,251],[-391,213],[-402,213],[-399,249],[-394,273],[-384,293]]);
      const pocket=s.mode==='loaded'?[s.bird.x,s.bird.y]:[sling.x+3*Math.sin((s.time-s.launchedAt)*30)*Math.exp(-(s.time-s.launchedAt)*8),sling.y];
      beam(-397,231,pocket[0],pocket[1],3,'tool');beam(-365,237,pocket[0],pocket[1],3,'tool');
      // These round game animals have no visible articulated limbs in the reference.
      function animal(x,y,r) {figures.push({cls:'animal',joints:{nose:P(x,y)},thickness:r*c.zoom*S/0.9});}
      animal(-215,333-Math.max(0,Math.sin(s.time*4))*2,13);
      animal(-170,333-Math.max(0,Math.sin(s.time*3.5+1))*2,13);
      animal(s.bird.x,s.bird.y,13);
      const th=s.theta,dx=116*Math.sin(th),dy=116*Math.cos(th);
      beam(284,309,284+dx,309-dy,12);
      beam(382,309,382+dx,309-dy,12);
      box(335+dx,309-dy,113,12,.04*Math.sin(th));
      box(334,302,55,12,0);
      if(!s.glassBroken) {
        const gd=59*Math.sin(th),gy=59*Math.cos(th);
        beam(315,295,315+gd,295-gy,11,'object');
        beam(354,295,354+gd,295-gy,11,'object');
        box(334+gd,295-gy-3,55,12,.06*Math.sin(th));
      }
      box(336+dx,295-dy,28,11,.1*Math.sin(th));
      if(!s.broken) {
        box(310,132,12,112,0);box(362,132,12,112,0);
        box(335,72,56,11,0);box(338,52,12,28,0);
      }
      if(s.pig) animal(336+dx,158,15);
      for(const b of s.loose.concat(s.bits)) box(b.x,b.y,b.w,b.h,b.a,b.kind);
      // Sparse lingering ballistic trail, generated only by actual flight.
      for(const p of s.trail) box(p[0],p[1],2,2,0,'projectile');
      if(s.puffs.length) {
        const gw=60,gh=34,cell=16,density=Array(gw*gh).fill(0);
        for(const puff of s.puffs) {
          const q=P(puff.x,puff.y),r=puff.r*S;
          for(let j=Math.max(0,Math.floor((q[1]-r)/cell));j<Math.min(gh,Math.ceil((q[1]+r)/cell));j++)
            for(let i=Math.max(0,Math.floor((q[0]-r)/cell));i<Math.min(gw,Math.ceil((q[0]+r)/cell));i++)
              density[j*gw+i]=Math.min(1,density[j*gw+i]+Math.max(0,1-Math.hypot(i*cell-q[0],j*cell-q[1])/r)*puff.life);
        }
        media.push({cls:'dust',origin:[0,0],cell,grid_size:[gw,gh],density});
      }
      return {regions,figures,boxes,media};
    },
    replay:{duration:10.89,actions:[{t:4.36,id:'aim',until:4.70},{t:6.931,id:'release'}]}
  };
})();
