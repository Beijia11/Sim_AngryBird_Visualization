/* Humanoid stair locomotion. Source coordinates are 1920 by 1080.
   Torso clips are short COCO measurements; feet and roots are simulated. */
(function () {
  'use strict';
  const CLIPS = {"climb":[[0.0,{"nose":[-63.85,-481.7],"left_eye":[-54.25,-491.3],"right_eye":[-61.95,-487.4],"left_ear":[-42.85,-485.5],"right_ear":[-48.55,-479.8],"left_shoulder":[-75.25,-424.6],"right_shoulder":[-46.65,-426.5],"left_elbow":[-82.85,-340.8],"right_elbow":[-50.45,-340.8],"left_wrist":[-48.55,-257.0],"right_wrist":[-35.25,-253.2],"left_hip":[-69.55,-247.5],"right_hip":[-63.85,-245.6],"left_knee":[-65.75,-144.7],"right_knee":[-39.05,-144.7],"left_ankle":[-46.65,0.0],"right_ankle":[46.65,-22.8]}],[0.04,{"nose":[-81.25,-474.6],"left_eye":[-75.75,-485.5],"right_eye":[-64.85,-483.7],"left_ear":[-62.95,-481.9],"right_ear":[-30.15,-474.6],"left_shoulder":[-84.85,-421.6],"right_shoulder":[-33.75,-419.8],"left_elbow":[-108.65,-337.7],"right_elbow":[-37.45,-332.2],"left_wrist":[-119.55,-282.9],"right_wrist":[-39.25,-253.7],"left_hip":[-73.95,-246.4],"right_hip":[-50.25,-244.6],"left_knee":[-72.15,-136.9],"right_knee":[-44.75,-142.4],"left_ankle":[-26.45,0.0],"right_ankle":[26.45,-21.9]}],[0.08,{"nose":[-19.4,-488.3],"left_eye":[-23.5,-502.6],"right_eye":[-31.7,-498.5],"left_ear":[-19.4,-494.4],"right_ear":[-41.9,-496.4],"left_shoulder":[-29.6,-435.1],"right_shoulder":[-66.4,-443.3],"left_elbow":[-58.2,-322.8],"right_elbow":[-113.4,-335.0],"left_wrist":[-23.5,-251.3],"right_wrist":[-74.6,-251.3],"left_hip":[-39.8,-212.5],"right_hip":[-58.2,-212.5],"left_knee":[17.4,-20.4],"right_knee":[-33.7,-8.2],"left_ankle":[5.1,-14.3],"right_ankle":[-5.1,0.0]}],[0.12,{"nose":[56.65,-564.2],"left_eye":[54.45,-581.9],"right_eye":[54.45,-579.7],"left_ear":[52.15,-575.3],"right_ear":[32.15,-575.3],"left_shoulder":[41.05,-506.4],"right_shoulder":[-1.15,-522.0],"left_elbow":[14.45,-388.7],"right_elbow":[-52.25,-419.8],"left_wrist":[49.95,-319.9],"right_wrist":[-43.35,-377.6],"left_hip":[21.05,-277.7],"right_hip":[5.55,-273.2],"left_knee":[81.05,-117.8],"right_knee":[96.65,-120.0],"left_ankle":[16.65,0.0],"right_ankle":[-16.65,-15.6]}],[0.16,{"nose":[43.5,-571.3],"left_eye":[41.5,-587.1],"right_eye":[41.5,-587.1],"left_ear":[33.6,-583.1],"right_ear":[15.8,-581.1],"left_shoulder":[29.7,-504.0],"right_shoulder":[-19.7,-525.8],"left_elbow":[-5.9,-385.4],"right_elbow":[-73.1,-415.1],"left_wrist":[43.5,-330.1],"right_wrist":[-45.4,-367.6],"left_hip":[0.0,-284.6],"right_hip":[-15.8,-280.7],"left_knee":[67.2,-134.4],"right_knee":[116.7,-152.2],"left_ankle":[0.0,0.0],"right_ankle":[0.0,-65.2]}],[0.2,{"nose":[-17.05,-605.3],"left_eye":[-18.85,-618.5],"right_eye":[-33.95,-618.5],"left_ear":[-20.75,-609.0],"right_ear":[-39.65,-609.0],"left_shoulder":[-28.35,-535.5],"right_shoulder":[-73.55,-556.2],"left_elbow":[-52.85,-411.1],"right_elbow":[-128.25,-441.2],"left_wrist":[11.25,-360.2],"right_wrist":[-90.55,-396.0],"left_hip":[-50.95,-297.9],"right_hip":[-62.25,-296.1],"left_knee":[-3.85,-128.3],"right_knee":[82.95,-194.2],"left_ankle":[-5.65,0.0],"right_ankle":[5.65,-101.9]}],[0.24,{"nose":[-28.65,-566.0],"left_eye":[-24.45,-578.8],"right_eye":[-45.75,-576.6],"left_ear":[-26.55,-568.1],"right_ear":[-60.65,-574.5],"left_shoulder":[-35.05,-493.7],"right_shoulder":[-88.25,-519.2],"left_elbow":[-45.75,-363.9],"right_elbow":[-145.75,-397.9],"left_wrist":[33.05,-334.1],"right_wrist":[-92.55,-338.3],"left_hip":[-60.65,-263.8],"right_hip":[-66.95,-266.0],"left_knee":[-22.35,-102.1],"right_knee":[79.85,-168.1],"left_ankle":[-30.85,0.0],"right_ankle":[30.85,-19.1]}],[0.28,{"nose":[-33.2,-544.2],"left_eye":[-28.9,-554.9],"right_eye":[-50.3,-552.7],"left_ear":[-26.8,-539.9],"right_ear":[-63.2,-544.2],"left_shoulder":[-33.2,-471.3],"right_shoulder":[-82.5,-490.6],"left_elbow":[-37.5,-351.4],"right_elbow":[-138.2,-372.8],"left_wrist":[46.1,-314.9],"right_wrist":[-97.5,-321.4],"left_hip":[-48.2,-246.4],"right_hip":[-63.2,-246.4],"left_knee":[-26.8,-96.4],"right_knee":[86.8,-132.9],"left_ankle":[-31.1,-2.2],"right_ankle":[31.1,0.0]}],[0.32,{"nose":[-22.2,-532.3],"left_eye":[-17.8,-545.6],"right_eye":[-37.7,-545.6],"left_ear":[-17.8,-534.5],"right_ear":[-53.3,-541.2],"left_shoulder":[-28.9,-470.2],"right_shoulder":[-71.0,-487.9],"left_elbow":[-33.3,-354.9],"right_elbow":[-122.0,-377.0],"left_wrist":[44.3,-310.5],"right_wrist":[-106.5,-343.8],"left_hip":[-35.5,-246.2],"right_hip":[-51.0,-248.4],"left_knee":[-24.4,-124.2],"right_knee":[90.9,-124.2],"left_ankle":[-35.5,-24.4],"right_ankle":[35.5,0.0]}],[0.36,{"nose":[36.55,-567.5],"left_eye":[41.05,-580.8],"right_eye":[21.05,-580.8],"left_ear":[41.05,-571.9],"right_ear":[5.55,-578.6],"left_shoulder":[27.75,-501.0],"right_shoulder":[-16.65,-525.4],"left_elbow":[18.85,-365.8],"right_elbow":[-76.45,-407.9],"left_wrist":[98.65,-339.2],"right_wrist":[-18.85,-339.2],"left_hip":[5.55,-263.8],"right_hip":[5.55,-270.5],"left_knee":[41.05,-97.6],"right_knee":[138.55,-148.5],"left_ankle":[-80.95,0.0],"right_ankle":[80.95,-15.5]}],[0.4,{"nose":[-33.0,-506.4],"left_eye":[-30.8,-524.0],"right_eye":[-46.2,-521.8],"left_ear":[-33.0,-517.4],"right_ear":[-57.2,-521.8],"left_shoulder":[-41.8,-453.5],"right_shoulder":[-72.6,-468.9],"left_elbow":[-55.0,-325.8],"right_elbow":[-121.1,-391.9],"left_wrist":[8.8,-275.2],"right_wrist":[-132.1,-350.1],"left_hip":[-61.6,-244.4],"right_hip":[-74.8,-242.2],"left_knee":[-8.8,-145.3],"right_knee":[-50.6,-107.9],"left_ankle":[0.0,-39.7],"right_ankle":[0.0,0.0]}]],"front":[[0.0,{"nose":[-20.9,-418.7],"left_eye":[-16.7,-429.1],"right_eye":[-23.0,-422.9],"left_ear":[-41.9,-418.7],"right_ear":[6.3,-418.7],"left_shoulder":[-90.0,-341.2],"right_shoulder":[54.4,-339.1],"left_elbow":[-115.1,-255.4],"right_elbow":[75.4,-249.1],"left_wrist":[-119.3,-192.6],"right_wrist":[79.6,-198.9],"left_hip":[-41.9,-146.5],"right_hip":[16.8,-148.6],"left_knee":[-87.9,-96.3],"right_knee":[71.2,-100.5],"left_ankle":[-75.4,-6.3],"right_ankle":[75.4,0.0]}],[0.04,{"nose":[-17.75,-431.1],"left_eye":[-15.75,-439.5],"right_eye":[-11.55,-435.3],"left_ear":[-40.85,-433.2],"right_ear":[13.55,-433.2],"left_shoulder":[-82.65,-355.8],"right_shoulder":[59.65,-355.8],"left_elbow":[-109.85,-278.3],"right_elbow":[84.75,-272.1],"left_wrist":[-114.05,-209.3],"right_wrist":[91.05,-223.9],"left_hip":[-42.95,-165.3],"right_hip":[21.95,-169.5],"left_knee":[-86.85,-113.0],"right_knee":[78.45,-117.2],"left_ankle":[-82.65,0.0],"right_ankle":[82.65,-2.1]}],[0.08,{"nose":[-24.15,-447.6],"left_eye":[-11.55,-458.1],"right_eye":[-36.75,-453.9],"left_ear":[5.25,-447.6],"right_ear":[-51.45,-443.4],"left_shoulder":[55.65,-367.7],"right_shoulder":[-91.35,-363.5],"left_elbow":[80.85,-281.6],"right_elbow":[-110.35,-283.7],"left_wrist":[87.15,-227.0],"right_wrist":[-116.65,-220.6],"left_hip":[17.85,-178.6],"right_hip":[-45.15,-176.5],"left_knee":[74.55,-130.3],"right_knee":[-87.15,-132.4],"left_ankle":[85.05,-6.3],"right_ankle":[-85.05,0.0]}],[0.12,{"nose":[57.35,-456.3],"left_eye":[69.85,-466.7],"right_eye":[44.85,-462.6],"left_ear":[84.35,-456.3],"right_ear":[32.35,-452.1],"left_shoulder":[138.55,-375.0],"right_shoulder":[-9.35,-370.9],"left_elbow":[165.65,-283.4],"right_elbow":[-23.95,-283.4],"left_wrist":[167.75,-225.0],"right_wrist":[-28.15,-229.2],"left_hip":[109.45,-177.1],"right_hip":[36.45,-177.1],"left_knee":[161.45,-139.6],"right_knee":[-1.05,-139.6],"left_ankle":[-3.15,-12.5],"right_ankle":[3.15,0.0]}],[0.16,{"nose":[55.8,-454.5],"left_eye":[67.6,-464.3],"right_eye":[48.0,-460.4],"left_ear":[46.0,-456.5],"right_ear":[40.1,-452.6],"left_shoulder":[-8.8,-376.2],"right_shoulder":[138.1,-378.1],"left_elbow":[-24.5,-284.1],"right_elbow":[161.6,-284.1],"left_wrist":[-30.4,-225.3],"right_wrist":[165.5,-225.3],"left_hip":[38.2,-180.2],"right_hip":[116.5,-180.2],"left_knee":[-4.9,-137.1],"right_knee":[157.7,-141.1],"left_ankle":[-1.0,0.0],"right_ankle":[1.0,-2.0]}],[0.2,{"nose":[63.1,-453.0],"left_eye":[75.5,-461.2],"right_eye":[52.7,-459.2],"left_ear":[54.8,-455.0],"right_ear":[38.3,-453.0],"left_shoulder":[-1.0,-376.4],"right_shoulder":[145.8,-374.4],"left_elbow":[172.7,-285.4],"right_elbow":[174.8,-287.5],"left_wrist":[172.7,-231.7],"right_wrist":[-19.7,-233.7],"left_hip":[123.1,-177.9],"right_hip":[42.4,-175.8],"left_knee":[1.0,-138.6],"right_knee":[3.1,-138.6],"left_ankle":[-1.0,-6.2],"right_ankle":[1.0,0.0]}],[0.24,{"nose":[-9.55,-458.6],"left_eye":[5.25,-467.0],"right_eye":[-20.05,-464.9],"left_ear":[22.15,-460.7],"right_ear":[-32.75,-456.5],"left_shoulder":[75.05,-380.4],"right_shoulder":[-75.05,-376.2],"left_elbow":[100.35,-291.6],"right_elbow":[-89.85,-291.6],"left_wrist":[104.55,-236.7],"right_wrist":[-96.15,-243.0],"left_hip":[41.25,-181.8],"right_hip":[-26.45,-181.8],"left_knee":[87.65,-141.6],"right_knee":[-72.95,-143.7],"left_ankle":[70.75,-4.2],"right_ankle":[-70.75,0.0]}],[0.28,{"nose":[-2.15,-462.5],"left_eye":[10.55,-473.0],"right_eye":[-12.65,-470.9],"left_ear":[27.45,-464.6],"right_ear":[-27.45,-464.6],"left_shoulder":[76.05,-388.6],"right_shoulder":[-69.65,-380.1],"left_elbow":[107.65,-293.6],"right_elbow":[-80.25,-287.2],"left_wrist":[107.65,-240.8],"right_wrist":[-88.65,-236.5],"left_hip":[40.15,-192.2],"right_hip":[-23.25,-192.2],"left_knee":[90.85,-143.6],"right_knee":[-69.65,-145.7],"left_ankle":[71.75,-8.5],"right_ankle":[-71.75,0.0]}],[0.32,{"nose":[-74.45,-445.0],"left_eye":[-66.05,-453.4],"right_eye":[-78.65,-451.3],"left_ear":[-95.45,-447.1],"right_ear":[-68.15,-447.1],"left_shoulder":[-145.85,-367.3],"right_shoulder":[5.25,-365.2],"left_elbow":[-152.15,-264.5],"right_elbow":[38.85,-268.7],"left_wrist":[-160.55,-214.1],"right_wrist":[34.65,-216.2],"left_hip":[-95.45,-167.9],"right_hip":[-28.25,-167.9],"left_knee":[-143.75,-123.9],"right_knee":[17.85,-126.0],"left_ankle":[-1.05,0.0],"right_ankle":[1.05,-2.1]}],[0.36,{"nose":[3.1,-448.6],"left_eye":[13.7,-461.3],"right_eye":[-5.3,-455.0],"left_ear":[28.4,-450.7],"right_ear":[-22.1,-446.5],"left_shoulder":[79.0,-374.9],"right_shoulder":[-64.3,-362.3],"left_elbow":[114.8,-299.1],"right_elbow":[-68.5,-267.5],"left_wrist":[119.0,-244.3],"right_wrist":[-81.1,-212.7],"left_hip":[47.4,-172.7],"right_hip":[-17.9,-170.6],"left_knee":[102.1,-128.5],"right_knee":[-64.3,-136.9],"left_ankle":[79.0,0.0],"right_ankle":[-79.0,-31.6]}],[0.4,{"nose":[3.15,-459.0],"left_eye":[15.75,-467.5],"right_eye":[-5.25,-461.1],"left_ear":[28.45,-459.0],"right_ear":[-20.05,-454.8],"left_shoulder":[78.95,-383.2],"right_shoulder":[-62.15,-370.6],"left_elbow":[116.85,-317.9],"right_elbow":[-64.25,-273.7],"left_wrist":[121.05,-254.8],"right_wrist":[-76.85,-225.3],"left_hip":[45.25,-179.0],"right_hip":[-11.55,-176.9],"left_knee":[106.35,-139.0],"right_knee":[-55.85,-139.0],"left_ankle":[83.15,0.0],"right_ankle":[-83.15,0.0]}]]};

  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,u) => a+(b-a)*u;
  const smooth = u => {u=clamp(u,0,1);return u*u*(3-2*u);};
  // Height of the narrow walking lane across the four treads.
  function floorAt(x) {
    if(x<855) return 960;
    if(x<985) return 928;
    if(x<1110) return 852;
    if(x<1240) return 779;
    return 710;
  }
  const REGIONS = [
    {cls:'wall',rect:[0,0,1920,865]},
    {cls:'floor',polygon:[[0,866],[1920,817],[1920,1080],[0,1080]]},
    {cls:'structure',polygon:[[0,839],[1920,795],[1920,829],[0,880]]},
    {cls:'wall',rect:[0,0,62,835]},
    {cls:'structure',rect:[58,0,7,746]},
    {cls:'structure',rect:[8,737,77,29]},
    {cls:'structure',rect:[306,296,204,257]},
    {cls:'obstacle',rect:[331,305,167,240]},
    {cls:'wall',rect:[548,575,157,106]},
    {cls:'wall',polygon:[[960,1002],[1107,990],[1107,909],[1254,893],[1254,835],[1401,810],[1401,740],[1656,730],[1656,1040],[960,1070]]},
    {cls:'structure',polygon:[[810,834],[960,1002],[960,1070],[810,879]]},
    {cls:'platform',polygon:[[810,834],[898,822],[1107,990],[960,1002]]},
    {cls:'structure',polygon:[[898,776],[1107,909],[1107,990],[898,822]]},
    {cls:'platform',polygon:[[898,776],[998,764],[1254,893],[1107,909]]},
    {cls:'structure',polygon:[[998,724],[1254,835],[1254,893],[998,764]]},
    {cls:'platform',polygon:[[998,724],[1092,718],[1401,810],[1254,835]]},
    {cls:'structure',polygon:[[1092,675],[1401,740],[1401,810],[1092,718]]},
    {cls:'platform',polygon:[[1092,675],[1390,703],[1656,730],[1401,740]]}
  ];
  function knee(hip,ankle,dir) {
    const dx=ankle[0]-hip[0], dy=ankle[1]-hip[1];
    const d=Math.max(1,Math.hypot(dx,dy)), reach=Math.min(d,391);
    const a=(205*205-190*190+reach*reach)/(2*reach);
    const h=Math.sqrt(Math.max(0,205*205-a*a));
    return [hip[0]+dx/d*a+dy/d*h*dir,hip[1]+dy/d*a-dx/d*h*dir];
  }
  function bodyPose(s) {
    let side=SimKit.pose.sample(CLIPS.climb,(s.cycle%1)*.4);
    let front=SimKit.pose.sample(CLIPS.front,(s.cycle%1)*.4);
    // Ground-place the measured action clips, then attach the torso to the balance controller.
    side=SimKit.pose.placeAt(side,[0,0]);
    front=SimKit.pose.placeAt(front,[0,0]);
    function center(p) {
      const x=(p.left_hip[0]+p.right_hip[0])/2, y=(p.left_hip[1]+p.right_hip[1])/2;
      return SimKit.pose.translate(p,-x,-y);
    }
    side=center(side); front=center(front);
    if(Math.cos(s.yaw)<0) side=SimKit.pose.mirror(side,0);
    const broad=Math.sin(s.yaw);
    const p=SimKit.pose.lerp(side,front,broad*broad);
    // Measured head detections are stable in these two clips.
    const hipX=s.x-28*Math.cos(s.yaw);
    const result={};
    for(const n of Object.keys(p)) result[n]=[hipX+p[n][0],s.hipY+p[n][1]];
    const spread=12+61*broad;
    result.left_hip=[hipX-spread/2,s.hipY];
    result.right_hip=[hipX+spread/2,s.hipY+3];
    for(let i=0;i<2;i++) {
      const prefix=i===0?'left':'right', foot=s.feet[i];
      const ankle=[foot.x,foot.y-8];
      result[prefix+'_ankle']=ankle;
      let dir=Math.cos(s.yaw);
      // Both knees bend into the direction of travel; front view separates them.
      if(Math.abs(dir)<.2) dir=i===0?-1:1;
      else dir=dir>0?1:-1;
      result[prefix+'_knee']=knee(result[prefix+'_hip'],ankle,dir);
    }
    return result;
  }
  window.World={
    meta:{name:'Humanoid climbing and descending stairs',source:[1920,1080],fps:50,dt:1/60},
    actions:[
      {id:'right',kind:'hold',keys:['ArrowRight','d'],description:'Step toward the top of the stairs'},
      {id:'left',kind:'hold',keys:['ArrowLeft','a'],description:'Step toward the bottom of the stairs'},
      {id:'balance',kind:'hold',keys:[' '],description:'Keep stepping in place'},
      {id:'turn',kind:'tap',keys:['t'],description:'Turn around on the tread'}
    ],
    init(){return {t:0,clock:0,x:802,vx:0,hipY:586,yaw:0,turnFrom:0,turnTo:0,turnAge:2,cycle:0,
      feet:[{x:754,y:960,phase:.05,mode:'stance',sx:754,sy:960,tx:754,ty:960},
            {x:853,y:928,phase:.55,mode:'stance',sx:853,sy:928,tx:853,ty:928}],
      events:[],active:false};},
    step(s,acts,dt){
      s.clock+=dt;
      let wanted=0,active=false;
      for(const a of acts){
        if(a.id==='right'){wanted=typeof a.value==='number'?a.value:177;active=true;}
        if(a.id==='left'){wanted=-(typeof a.value==='number'?a.value:215);active=true;}
        if(a.id==='balance')active=true;
        if(a.id==='turn' && s.turnAge>=1.85){s.turnFrom=s.yaw;s.turnTo=s.yaw<Math.PI/2?Math.PI:0;s.turnAge=0;s.events.push({type:'turn',by:'robot'});}
      }
      s.active=active;
      s.vx += (wanted-s.vx)*Math.min(1,dt*12);
      s.x=clamp(s.x+s.vx*dt,650,1480);
      s.turnAge+=dt;
      s.yaw=mix(s.turnFrom,s.turnTo,smooth(s.turnAge/1.85));
      const rate=active?1.95:0;
      s.cycle+=rate*dt;
      for(let i=0;i<2;i++){
        const f=s.feet[i], old=f.phase;
        if(active || f.mode==='swing')f.phase+=1.95*dt;
        if(f.phase>=1){
          f.phase-=1;
          if(f.mode==='swing'){
            f.x=f.tx;f.y=f.ty;f.mode='stance';
            s.events.push({type:'contact',by:'robot',foot:i,surface:floorAt(f.x)<950?'stair':'floor'});
          }
        }
        if(f.phase>=.47 && f.mode==='stance' && active){
          f.mode='swing';f.sx=f.x;f.sy=f.y;
          const width=14+65*Math.sin(s.yaw);
          f.tx=clamp(s.x+s.vx*.24+(i===0?-width:width),650,1500);
          f.ty=floorAt(f.tx);
          s.events.push({type:'lift',by:'robot',foot:i});
        }
        if(f.mode==='swing'){
          const u=clamp((f.phase-.47)/.53,0,1), blend=smooth(u);
          f.x=mix(f.sx,f.tx,blend);
          const lift=active?105:55;
          f.y=mix(f.sy,f.ty,blend)-Math.sin(Math.PI*u)*lift;
        }
      }
      const ground=(floorAt(s.feet[0].x)+floorAt(s.feet[1].x))*.5;
      const bounce=active?20*Math.sin(s.cycle*Math.PI*4):0;
      const desired=ground-337+bounce;
      s.hipY+=(desired-s.hipY)*Math.min(1,dt*16);
    },
    proxy(s){
      const joints=bodyPose(s);
      const extra=s.feet.map(f=>[[f.x-28,f.y],[f.x+39,f.y+4]]);
      return {regions:REGIONS,figures:[{cls:'robot',joints,extra,thickness:22}],boxes:[],media:[]};
    },
    replay:{duration:9.5,actions:[
      {t:0,id:'right',value:175,until:3.02},
      {t:3.02,id:'right',value:79,until:3.62},
      {t:3.62,id:'balance',until:4.28},
      {t:4.28,id:'left',value:69,until:5.38},
      {t:5.38,id:'balance',until:7.38},
      {t:5.46,id:'turn'},
      {t:7.38,id:'left',value:217,until:9.5}
    ]}
  };
})();
