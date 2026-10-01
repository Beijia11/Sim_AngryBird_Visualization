(function () {
  'use strict';
  // The source frames are 1920 x 1080; measurements below were taken on
  // the supplied one-third-size overview frames and converted at entry.
  const S = 3;
  const pt = (x, y) => [x * S, y * S];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = u => u * u * (3 - 2 * u);
  const polygon = (cls, points) => ({ cls, polygon: points.map(p => pt(p[0], p[1])) });
  const rect = (cls, x, y, w, h) => ({ cls, rect: [x*S, y*S, w*S, h*S] });
  const scene = [
    rect('wall', 0, 0, 640, 360),
    polygon('floor', [[0,306],[484,330],[640,339],[640,360],[0,360]]),
    polygon('structure', [[0,0],[301,0],[300,85],[0,69]]),
    polygon('other', [[314,0],[524,0],[511,102],[312,82]]),
    polygon('structure', [[0,95],[640,132],[640,177],[0,140]]),
    polygon('wall', [[0,99],[640,137],[640,167],[0,132]]),
    polygon('platform', [[53,172],[179,187],[181,209],[42,194]]),
    polygon('platform', [[285,201],[405,214],[408,237],[265,224]]),
    polygon('structure', [[322,183],[369,187],[373,216],[312,213]]),
    polygon('table', [[0,201],[151,199],[184,206],[100,317],[0,303]]),
    polygon('structure', [[0,301],[101,307],[100,360],[0,360]]),
    polygon('table', [[209,215],[468,242],[498,360],[115,360],[109,335]]),
    polygon('platform', [[612,239],[640,243],[640,360],[577,360]]),
    // The stationary camera support at the right edge.
    polygon('obstacle', [[620,149],[625,151],[540,360],[534,360]]),
    polygon('obstacle', [[621,147],[625,146],[638,357],[634,360]]),
    polygon('obstacle', [[614,145],[618,144],[584,360],[579,360]]),
    polygon('structure', [[609,123],[636,126],[636,166],[609,161]]),
    polygon('obstacle', [[35,279],[90,259],[109,350],[101,360],[43,360]]),
    polygon('structure', [[34,276],[83,256],[100,265],[50,293]])
  ];
  for (const x of [115,151,188,473,516,558]) {
    scene.push(rect('other',x,116+x*.055,22,18));
  }
  const stationaryProps = [
    {cls:'prop',center:pt(24,200),size:pt(18,48),z:600},
    {cls:'prop',corners:[[43,226],[87,233],[103,218],[60,210],[43,192],[87,199],[103,184],[60,176]].map(p=>pt(...p)),z:700},
    {cls:'tool',center:pt(96,237),size:pt(62,7),angle:-.65,z:740},
    {cls:'tool',center:pt(56,264),size:pt(95,5),angle:-.16,z:800},
    {cls:'tool',center:pt(37,266),size:pt(70,5),angle:-.34,z:805},
    {cls:'prop',center:pt(28,241),size:pt(35,16),z:735}
  ];
  function command(s, x, y, duration, yaw) {
    s.motion = {from:s.tool.slice(), to:[x,y], elapsed:0,
      duration:Math.max(.05,duration), fromYaw:s.yaw,
      toYaw: yaw === undefined ? s.yaw : yaw};
  }
  function resetObject(s, value) {
    const v = value || {};
    s.held = false;
    s.box = {x:v.x === undefined ? 1206 : v.x,
      y:v.y === undefined ? 936 : v.y,
      floor:v.y === undefined ? 936 : v.y,
      vx:0,vy:0,angle:v.angle === undefined ? -.42 : v.angle};
    s.tool = pt(194,228);
    s.yaw = 0;
    s.motion = null;
    s.gap = 31*S;
    s.gapTarget = 31*S;
    s.events.push({type:'reset_object'});
  }
  function boxCorners(b) {
    const c = Math.cos(b.angle), sn = Math.sin(b.angle);
    const a = [22.5*S*c, 22.5*S*sn*.65];
    const d = [-17*S*sn,17*S*c*.65];
    const bottom = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v]) =>
      [b.x + u*a[0] + v*d[0], b.y+9*S+u*a[1]+v*d[1]]);
    return bottom.concat(bottom.map(p=>[p[0],p[1]-18*S]));
  }
  window.World = {
    meta:{name:'Robot arm tabletop grasp and transfer',source:[1920,1080],fps:56.32299741602067,dt:1/60},
    actions:[
      {id:'move',kind:'drag',description:'Move the gripper to the pointer release position'},
      {id:'left',kind:'hold',keys:['ArrowLeft','a'],description:'Move gripper left'},
      {id:'right',kind:'hold',keys:['ArrowRight','d'],description:'Move gripper right'},
      {id:'up',kind:'hold',keys:['ArrowUp','w'],description:'Lift gripper'},
      {id:'down',kind:'hold',keys:['ArrowDown','s'],description:'Lower gripper'},
      {id:'grasp',kind:'tap',keys:[' '],description:'Close fingers and grasp on contact'},
      {id:'release',kind:'tap',keys:['o'],description:'Open fingers and release'},
      {id:'home',kind:'tap',keys:['h'],description:'Return to raised left position'},
      {id:'reset_object',kind:'tap',keys:['n'],description:'Set up the next object trial'}
    ],
    init() {
      return {t:0,tool:pt(194,228),yaw:0,motion:null,gap:31*S,gapTarget:31*S,
        held:false,offset:[0,0],box:{x:412*S,y:308*S,floor:308*S,vx:0,vy:0,angle:-.43},events:[]};
    },
    step(s, acts, dt) {
      if (!s.events) s.events=[];
      for (const a of acts) {
        const v = a.value || {};
        if(a.id==='move') {
          const x=clamp((v.x === undefined ? s.tool[0] : v.x)+(v.dx||0),450,1380);
          const y=clamp((v.y === undefined ? s.tool[1] : v.y)+(v.dy||0),570,990);
          command(s,x,y,v.duration || Math.hypot(x-s.tool[0],y-s.tool[1])/780,v.yaw);
        }
        if(a.id==='home') command(s,194*S,228*S,.4,0);
        if(a.id==='reset_object') resetObject(s,v);
        if(a.id==='grasp') s.gapTarget=16*S;
        if(a.id==='release') {
          s.gapTarget=36*S;
          if(s.held) {
            s.held=false;
            s.box.floor=Math.max(s.box.y,302*S);
            s.box.vy=0;
            s.events.push({type:'release',by:'robot'});
          }
        }
        const delta={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[a.id];
        if(delta) {
          s.motion=null;
          s.tool[0]=clamp(s.tool[0]+delta[0]*540*dt,450,1380);
          s.tool[1]=clamp(s.tool[1]+delta[1]*420*dt,570,990);
        }
      }
      if(s.motion) {
        const m=s.motion;
        m.elapsed=Math.min(m.duration,m.elapsed+dt);
        const u=smooth(m.elapsed/m.duration);
        s.tool=[mix(m.from[0],m.to[0],u),mix(m.from[1],m.to[1],u)];
        s.yaw=mix(m.fromYaw,m.toYaw,u);
        if(m.elapsed>=m.duration) s.motion=null;
      }
      s.gap += clamp(s.gapTarget-s.gap,-200*dt,200*dt);
      // A closing parallel gripper catches the object only at the fingertips.
      if(!s.held && s.gapTarget<60 && s.gap<72 &&
          Math.abs(s.tool[0]-s.box.x)<64 && Math.abs(s.tool[1]-s.box.y)<65) {
        s.held=true;
        s.offset=[s.box.x-s.tool[0],s.box.y-s.tool[1]];
        s.events.push({type:'grasp',by:'robot',object:'box'});
      }
      if(s.held) {
        s.box.x=s.tool[0]+s.offset[0];
        s.box.y=s.tool[1]+s.offset[1];
        s.box.angle += (-.14-s.box.angle)*Math.min(1,dt*6);
        s.box.vx=0;s.box.vy=0;
      } else if(s.box.y<s.box.floor || Math.abs(s.box.vy)>.1) {
        s.box.vy+=1800*dt;
        s.box.y+=s.box.vy*dt;
        s.box.x+=s.box.vx*dt;
        if(s.box.y>=s.box.floor) {
          s.box.y=s.box.floor;s.box.vy=0;s.box.vx=0;
          s.events.push({type:'contact',object:'box',with:'table'});
        }
      }
    },
    proxy(s) {
      const tx=s.tool[0]/S, ty=s.tool[1]/S;
      const right=clamp((tx-194)/224,0,1);
      const low=clamp((ty-238)/72,0,1);
      // Projected shoulder, elbow and wrist of the six-axis arm. The depth
      // swivel shortens the forearm as the tool reaches the right-hand side.
      const elbow=pt(373+17*right-17*low*(1-right),48+8*low*(1-right));
      const wrist=pt(tx+7+9*s.yaw,ty-165);
      const swivel=pt(wrist[0]/S+31-96*right,wrist[1]/S+3);
      const palm=pt(tx+2+4*s.yaw,ty-76);
      const gap=s.gap/S;
      const fingers=[];
      for(const sign of [-1,1]) {
        const root=pt(tx+sign*24+4*s.yaw,ty-62);
        const knuckle=pt(tx+sign*(gap*.65+5)-sign*3*s.yaw,ty-31);
        const tip=pt(tx+sign*gap*.5,ty);
        fingers.push([root,knuckle],[knuckle,tip]);
        fingers.push([pt(tx+sign*gap*.5,ty),pt(tx+sign*(gap*.5-5),ty+1)]);
      }
      const figures=[
        {cls:'robot',chain:[pt(106,167),pt(92,144),pt(86,31),pt(-20,29)],thickness:31*S,z:580},
        {cls:'robot',chain:[pt(100,164),pt(101,164.5)],thickness:43*S,z:581},
        {cls:'robot',chain:[pt(86,29),pt(86,30)],thickness:44*S,z:582},
        {cls:'robot',chain:[pt(340,211),pt(343,181),elbow,swivel,wrist,pt(wrist[0]/S,ty-112)],thickness:29*S,z:690},
        {cls:'robot',chain:[elbow,[elbow[0]+1,elbow[1]+1]],thickness:49*S,z:691},
        {cls:'robot',chain:[pt(343,181),pt(344,182)],thickness:48*S,z:692},
        {cls:'robot',chain:[wrist,[wrist[0]+1,wrist[1]+1]],thickness:39*S,z:700},
        {cls:'robot',chain:[pt(wrist[0]/S,ty-112),palm],thickness:37*S,z:850},
        {cls:'robot',chain:[pt(palm[0]/S-14,palm[1]/S),pt(palm[0]/S+14,palm[1]/S)],thickness:42*S,z:1000},
        {cls:'robot',chain:[],fingers,thickness:20*S,z:1100}
      ];
      return {regions:scene,figures,
        boxes:stationaryProps.concat([{cls:'object',corners:boxCorners(s.box),z:1050}]),media:[]};
    },
    replay:{duration:9.52,actions:[
      {t:.30,id:'move',value:{x:1032,y:720,duration:.20,yaw:0}},
      {t:.52,id:'move',value:{x:1236,y:717,duration:.46,yaw:1}},
      {t:.91,id:'release'},
      {t:1.04,id:'move',value:{x:1224,y:927,duration:.43,yaw:0}},
      {t:1.48,id:'grasp'},
      {t:1.67,id:'move',value:{x:1194,y:723,duration:.17,yaw:0}},
      {t:1.84,id:'move',value:{x:603,y:708,duration:.43,yaw:0}},
      {t:2.28,id:'move',value:{x:588,y:906,duration:.18,yaw:0}},
      {t:2.51,id:'release'},
      {t:2.70,id:'reset_object',value:{x:1191,y:894,angle:.05}},
      {t:3.16,id:'move',value:{x:846,y:717,duration:.32,yaw:0}},
      {t:3.51,id:'move',value:{x:1032,y:720,duration:.37,yaw:0}},
      {t:4.00,id:'release'},
      {t:4.01,id:'move',value:{x:1194,y:894,duration:.43,yaw:0}},
      {t:4.44,id:'grasp'},
      {t:4.60,id:'move',value:{x:1185,y:705,duration:.16,yaw:0}},
      {t:4.76,id:'move',value:{x:594,y:708,duration:.40,yaw:0}},
      {t:5.18,id:'move',value:{x:588,y:888,duration:.25,yaw:0}},
      {t:5.49,id:'release'},
      {t:5.64,id:'reset_object',value:{x:1206,y:924,angle:-.49}},
      {t:6.11,id:'move',value:{x:744,y:708,duration:.31,yaw:0}},
      {t:6.44,id:'move',value:{x:1032,y:720,duration:.40,yaw:0}},
      {t:7.03,id:'release'},
      {t:7.07,id:'move',value:{x:1227,y:933,duration:.36,yaw:.14}},
      {t:7.44,id:'grasp'},
      {t:7.62,id:'move',value:{x:1188,y:720,duration:.18,yaw:0}},
      {t:7.81,id:'move',value:{x:603,y:708,duration:.43,yaw:0}},
      {t:8.24,id:'move',value:{x:588,y:903,duration:.22,yaw:0}},
      {t:8.51,id:'release'},
      {t:8.67,id:'reset_object',value:{x:1209,y:1032,angle:-.38}}
    ]}
  };
})();
