(function () {
  'use strict';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,u) => a+(b-a)*u;
  const ease = u => { u=clamp(u,0,1); return u*u*(3-2*u); };
  // Coordinates are in the 700 x 480 source frame. The foreground assembly
  // is attached to the operator, while the concrete channel is camera-relative.
  const rim = [
    [-.53,-.28],[-.40,-.36],[-.27,-.49],[-.13,-.58],[.02,-.61],
    [.17,-.57],[.31,-.47],[.44,-.34],[.55,-.28],[.57,.26],
    [.47,.38],[.34,.41],[.19,.32],[.04,.26],[-.10,.27],
    [-.26,.36],[-.40,.43],[-.51,.36],[-.55,.22],[-.53,-.28]
  ];
  function segment(boxes,a,b,width,z) {
    boxes.push({cls:'tool',center:[(a[0]+b[0])/2,(a[1]+b[1])/2],
      size:[Math.hypot(b[0]-a[0],b[1]-a[1]),width],
      angle:Math.atan2(b[1]-a[1],b[0]-a[0]),z:z});
  }
  function rectPoly(x,y,w,h) { return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]; }
  window.World = {
    meta:{name:'Channel scope aiming',source:[700,480],fps:16,dt:1/60},
    actions:[
      {id:'aim',kind:'hold',keys:[' '],description:'raise and hold the scope'},
      {id:'turn',kind:'continuous',keys:['ArrowLeft','ArrowRight'],min:-1,max:1,description:'turn the view'},
      {id:'pitch',kind:'continuous',keys:['ArrowUp','ArrowDown'],min:-1,max:1,description:'tilt the view'},
      {id:'forward',kind:'hold',keys:['w'],description:'walk forward'},
      {id:'look',kind:'drag',description:'drag to change aim'}
    ],
    init(rng) {
      const rubble=[];
      for(let i=0;i<32;i++) {
        const x=rng()*215, y=286+rng()*39;
        rubble.push({x:x,y:y,w:5+rng()*19,h:3+rng()*9});
      }
      return {time:0,t:0,events:[],aim:0,aimHeld:false,yaw:0,pitch:0,
        turnVelocity:0,pitchVelocity:0,walk:0,walkPhase:0,
        swayX:0,swayY:0,rubble:rubble};
    },
    step(s,acts,dt,rng) {
      s.time+=dt;
      let aiming=false, turn=0, pitch=0, moving=false;
      for(const a of acts) {
        if(a.id==='aim') aiming=true;
        if(a.id==='turn') turn+=a.value===undefined?1:a.value;
        if(a.id==='pitch') pitch+=a.value===undefined?1:a.value;
        if(a.id==='forward') moving=true;
        if(a.id==='look' && a.value) {
          s.yaw=clamp(s.yaw+a.value.dx/440,-1.5,2.2);
          s.pitch=clamp(s.pitch+a.value.dy*.16,-85,85);
        }
      }
      if(aiming!==s.aimHeld) {
        s.events.push({type:aiming?'raise_scope':'lower_scope',by:'operator'});
        s.aimHeld=aiming;
      }
      s.aim=clamp(s.aim+(aiming?1:-1)*dt/(aiming?.34:.34),0,1);
      const response=1-Math.exp(-dt*13);
      s.turnVelocity=mix(s.turnVelocity,turn*.86,response);
      s.pitchVelocity=mix(s.pitchVelocity,pitch*32,response);
      s.yaw=clamp(s.yaw+s.turnVelocity*dt,-1.5,2.2);
      s.pitch=clamp(s.pitch+s.pitchVelocity*dt,-85,85);
      if(moving) { s.walk+=dt*8; s.walkPhase+=dt*9; }
      const breathing=Math.sin(s.time*2.6);
      s.swayX=mix(s.swayX,Math.sin(s.time*3.4)*2.1-s.turnVelocity*11,response);
      s.swayY=mix(s.swayY,breathing*2.3+(moving?Math.sin(s.walkPhase)*5:0),response);
    },
    proxy(s) {
      const regions=[{cls:'sky',rect:[0,0,700,480]}],boxes=[],figures=[];
      const u=ease(s.aim), yaw=s.yaw;
      // The horizon slides left as the operator turns toward the right bank.
      const pan=325*yaw;
      const zoom=1+1.35*u+s.walk*.002;
      const camera=p=>[(p[0]-350-pan)*zoom+350,
        (p[1]-285+s.pitch)*zoom+285];
      const region=(cls,p)=>regions.push({cls:cls,polygon:p.map(camera)});
      const vp=120-pan*.1;
      region('floor',[[-1200,295],[1300,345],[1500,1000],[-1200,1000]]);
      region('road',[[-1200,315],[52,308],[193,480],[-1200,650]]);
      // Distant industrial buildings and elevated crossways.
      region('structure',rectPoly(-100,91,261,146));
      region('wall',[[150,225],[310,40],[365,51],[365,250]]);
      region('structure',[[297,44],[341,24],[429,49],[429,214],[299,249]]);
      region('wall',[[361,68],[442,12],[515,30],[515,178],[361,238]]);
      region('structure',[[470,34],[497,-17],[590,-4],[590,168],[470,214]]);
      region('wall',[[589,-12],[770,-62],[1250,-120],[1250,170],[589,191]]);
      region('structure',[[-260,93],[211,123],[204,161],[-260,125]]);
      region('obstacle',[[-260,100],[210,128],[210,139],[-260,111]]);
      region('structure',rectPoly(178,157,14,96));
      region('structure',rectPoly(-80,217,239,40));
      region('wall',rectPoly(-90,255,226,42));
      region('screen',rectPoly(36,267,48,27));
      // Right retaining wall: the sloped bank and its low vertical toe.
      const top=x=>236-.315*(x-145);
      const shoulder=x=>266-.235*(x-145);
      const toe=x=>302+.070*(x-145);
      region('wall',[[145,top(145)],[1700,top(1700)],[1700,shoulder(1700)],[145,shoulder(145)]]);
      region('obstacle',[[145,shoulder(145)],[1700,shoulder(1700)],[1700,toe(1700)],[145,toe(145)]]);
      region('wall',[[145,toe(145)],[1700,toe(1700)],[1700,toe(1700)+32],[145,toe(145)+8]]);
      region('line',[[145,top(145)-3],[1700,top(1700)-3],[1700,top(1700)+2],[145,top(145)+2]]);
      // Fence panels sit on the upper edge, getting wider toward the camera.
      let x=152;
      for(let i=0;i<17;i++) {
        const w=18+i*6.2, h=27+i*5;
        region('structure',[[x,top(x)-h],[x+w,top(x+w)-h-3],[x+w,top(x+w)-5],[x,top(x)-5]]);
        region('wall',[[x+w,top(x+w)-h-7],[x+w+6,top(x+w+6)-h-8],[x+w+6,top(x+w+6)],[x+w,top(x+w)]]);
        x+=w+7;
      }
      // Expansion joints convey the slope without reproducing painted detail.
      for(let i=0;i<8;i++) {
        const x=187+i*180;
        region('wall',[[x,shoulder(x)],[x+2,shoulder(x+2)],[x-55,toe(x-55)],[x-57,toe(x-57)]]);
      }
      for(const r of s.rubble) {
        region('obstacle',[[r.x,r.y],[r.x+r.w*.3,r.y-r.h],[r.x+r.w*.8,r.y-r.h*.7],[r.x+r.w,r.y+2]]);
      }
      for(let i=0;i<7;i++) {
        const x=180+i*73;
        region('vegetation',[[x,toe(x)+16],[x+3,toe(x)+6],[x+7,toe(x)+15],[x+10,toe(x)+8],[x+12,toe(x)+20]]);
      }
      // A goggle-like optic is a rigid assembly of narrow rim pieces. Its
      // dimensions grow during the raise action, independently of world zoom.
      const settle=Math.sin(s.time*2.7)*3.2*u;
      const cx=mix(614,350,u)+s.swayX;
      const cy=mix(367,286,u)+s.swayY+settle;
      const w=mix(224,708,u), h=mix(137,373,u);
      const angle=mix(-.08,0,u);
      const c=Math.cos(angle),sn=Math.sin(angle);
      const gun=(x,y)=>[cx+x*c-y*sn,cy+x*sn+y*c];
      const localBox=(x,y,bw,bh,a,z)=>boxes.push({cls:'tool',center:gun(x,y),size:[bw,bh],angle:a+angle,z:z||800});
      // Receiver, long barrel, muzzle collars and stock remain one mechanism.
      if(u<.98) {
        const k=1+u*1.5;
        const barrelA=gun(-211*k,-29*k),barrelB=gun(-128*k,137*k);
        segment(boxes,barrelA,barrelB,24*k,740);
        segment(boxes,gun(-181*k,23*k),gun(-99*k,181*k),44*k,745);
        for(let i=0;i<4;i++) localBox((-204+i*13)*k,(-13+i*26)*k,36*k,10*k,1.10,750);
        localBox(-128*k,47*k,43*k,85*k,-.33,754);
        localBox(-42*k,131*k,91*k,103*k,-.38,756);
        localBox(-197*k,40*k,13*k,57*k,.16,758);
        // Only the operator's support forearm enters the image.
        figures.push({cls:'human',chain:[gun(-117*k,204*k),gun(-150*k,131*k),gun(-176*k,61*k)],thickness:17*k,z:748});
      }
      localBox(-w*.06,-h*.51,w*.73,h*.16,0,790);
      localBox(-w*.21,-h*.64,w*.16,h*.20,-.06,795);
      localBox(-w*.19,-h*.76,w*.055,h*.065,0,796);
      localBox(w*.45,-h*.50,w*.12,h*.12,0,798);
      localBox(-w*.47,-h*.18,w*.10,h*.25,0,799);
      // The copper conduit and small sight posts are physical gun parts.
      segment(boxes,gun(-w*.43,-h*.43),gun(-w*.34,-h*.65),mix(7,18,u),802);
      segment(boxes,gun(-w*.34,-h*.65),gun(-w*.23,-h*.69),mix(7,18,u),802);
      localBox(-w*.095,-h*.68,w*.03,h*.10,0,803);
      localBox(w*.085,-h*.68,w*.03,h*.10,0,803);
      for(let i=1;i<rim.length;i++) {
        segment(boxes,gun(rim[i-1][0]*w,rim[i-1][1]*h),gun(rim[i][0]*w,rim[i][1]*h),mix(10,23,u),820);
      }
      // Rear support arch below the optic aperture.
      segment(boxes,gun(-w*.18,h*.35),gun(-w*.10,h*.49),mix(12,26,u),810);
      segment(boxes,gun(w*.16,h*.34),gun(w*.24,h*.49),mix(12,26,u),810);
      localBox(w*.025,h*.51,w*.31,h*.075,0,811);
      return {regions:regions,figures:figures,boxes:boxes,media:[]};
    },
    replay:{duration:5.0625,actions:[
      {t:0,id:'forward',until:.69},
      {t:.8125,id:'aim',until:3.5625},
      {t:1.625,id:'pitch',value:.28,until:1.9375},
      {t:2.5625,id:'pitch',value:-.20,until:3.0625},
      {t:3.9375,id:'turn',value:1,until:4.6875},
      {t:4.0625,id:'forward',until:4.625}
    ]}
  };
})();
