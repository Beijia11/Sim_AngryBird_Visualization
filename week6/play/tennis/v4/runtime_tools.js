/* Harness-owned adapters for actual third-party solvers. No tennis/game logic. */
(function(g){
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const v3=a=>({x:a[0],y:a[1],z:a[2]});
  const arr=v=>[v.x,v.y,v.z];
  const quat=a=>({x:a[0],y:a[1],z:a[2],w:a[3]});
  const qa=q=>[q.x,q.y,q.z,q.w];
  const stats={physicsSteps:0,ikSolves:0};
  const cache=new WeakMap(),live=new Set();
  function release(c){c.queue.free();c.world.free();live.delete(c);c.released=true;}
  function engine(state){
    const R=g.RAPIER;if(!R)throw Error('Rapier not loaded: await __toolsReady');
    const signature=JSON.stringify(Object.entries(state.bodies).map(([id,b])=>[id,b.type,b.shape.type==='box'?{type:'box'}:b.shape,b.mass]));
    let c=cache.get(state);if(c&&!c.released&&c.signature===signature)return c;
    if(c&&!c.released)release(c);
    const world=new R.World(v3(state.gravity)),queue=new R.EventQueue(true),bodies={},colliders={},handles=new Map();
    for(const [id,b] of Object.entries(state.bodies)){
      const desc=b.type==='fixed'?R.RigidBodyDesc.fixed():b.type==='kinematic'?R.RigidBodyDesc.kinematicPositionBased():R.RigidBodyDesc.dynamic();
      desc.setTranslation(...b.position).setRotation(quat(b.quaternion)).setCanSleep(false);
      if(b.type==='dynamic')desc.setCcdEnabled(true);
      const body=world.createRigidBody(desc),s=b.shape;
      let cd;if(s.type==='sphere')cd=R.ColliderDesc.ball(s.radius);
      else if(s.type==='box')cd=R.ColliderDesc.cuboid(...s.halfExtents);
      else if(s.type==='capsule')cd=R.ColliderDesc.capsule(s.halfHeight,s.radius);
      else throw Error('Unsupported collider '+s.type);
      cd.setFriction(b.friction??.4).setRestitution(b.restitution??.5);
      cd.setRestitutionCombineRule(R.CoefficientCombineRule.Max);
      if(b.type==='dynamic')cd.setMass(b.mass??1);
      cd.setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
      const collider=world.createCollider(cd,body);handles.set(collider.handle,id);bodies[id]=body;colliders[id]=collider;
    }
    c={world,queue,bodies,colliders,handles,signature};live.add(c);cache.set(state,c);return c;
  }
  const physics={
    create(spec){
      const state=clone({gravity:spec.gravity||[0,-9.81,0],bodies:spec.bodies,contacts:[],time:0});
      for(const b of Object.values(state.bodies)){
        b.type=b.type||'dynamic';b.position=b.position||[0,0,0];b.velocity=b.velocity||[0,0,0];
        b.quaternion=b.quaternion||[0,0,0,1];b.angularVelocity=b.angularVelocity||[0,0,0];
      }
      engine(state);return state;
    },
    step(state,dt,targets={}){
      if(!(dt>0&&dt<=.1))throw Error('physics dt must be in (0,.1]');
      const c=engine(state),R=g.RAPIER;c.world.gravity=v3(state.gravity);state.contacts=[];
      for(const [id,b] of Object.entries(state.bodies)){
        const rb=c.bodies[id];
        if(b.shape.type==='box'){const extent=targets[id]?.shape?.halfExtents||b.shape.halfExtents;b.shape.halfExtents=[...extent];c.colliders[id].setHalfExtents(v3(extent));}
        rb.setTranslation(v3(b.position),true);rb.setRotation(quat(b.quaternion),true);
        if(b.type==='dynamic'){rb.setLinvel(v3(b.velocity),true);rb.setAngvel(v3(b.angularVelocity),true);}
      }
      const n=Math.max(1,Math.ceil(dt/(1/240))),h=dt/n;c.world.timestep=h;
      const seen=new Set();
      for(let i=1;i<=n;i++){
        for(const [id,b] of Object.entries(state.bodies))if(b.type==='kinematic'){
          const to=targets[id]||{position:b.position,quaternion:b.quaternion},f=i/n;
          const p=b.position.map((x,k)=>x+((to.position||b.position)[k]-x)*f);
          let q=to.quaternion||b.quaternion;
          if(q.reduce((v,x,k)=>v+x*b.quaternion[k],0)<0)q=q.map(x=>-x);
          q=b.quaternion.map((x,k)=>x+(q[k]-x)*f);const norm=Math.hypot(...q)||1;
          c.bodies[id].setNextKinematicTranslation(v3(p));c.bodies[id].setNextKinematicRotation(quat(q.map(x=>x/norm)));
        }
        const before=Object.fromEntries(Object.entries(c.bodies).map(([id,rb])=>[id,arr(rb.linvel())]));
        c.world.step(c.queue);stats.physicsSteps++;
        c.queue.drainCollisionEvents((a,b,started)=>{
          const ids=[c.handles.get(a),c.handles.get(b)],key=ids.join('|');
          if(started&&!seen.has(key)){state.contacts.push({a:ids[0],b:ids[1],time:state.time+i*h,bodies:Object.fromEntries(ids.map(id=>[id,{position:arr(c.bodies[id].translation()),beforeVelocity:before[id],afterVelocity:arr(c.bodies[id].linvel())}]))});seen.add(key);}
        });
      }
      for(const [id,b] of Object.entries(state.bodies)){
        const rb=c.bodies[id];b.position=arr(rb.translation());b.velocity=arr(rb.linvel());
        b.quaternion=qa(rb.rotation());b.angularVelocity=arr(rb.angvel());
      }
      state.time+=dt;return state.contacts;
    },
    dispose(state){const c=cache.get(state);if(c){release(c);cache.delete(state);}},
    disposeAll(){for(const c of [...live])release(c);},
  };
  const ik={
    // All inputs/outputs are JSON. The third-party chain is a short-lived solver.
    solve(spec){
      const F=g.FIK;if(!F)throw Error('Fullik was not selected/loaded');
      if(!spec.lengths?.length||spec.directions.length!==spec.lengths.length)throw Error('IK lengths/directions mismatch');
      const V=a=>new F.V3(...a),chain=new F.Chain3D();
      chain.setMaxIterationAttempts(spec.iterations||24);chain.setSolveDistanceThreshold(spec.tolerance??.001);
      chain.addBone(new F.Bone3D(V(spec.root),undefined,V(spec.directions[0]),spec.lengths[0]));
      for(let i=1;i<spec.lengths.length;i++){
        const joint=(spec.joints||[])[i]||{};
        if(joint.hinge)chain.addConsecutiveHingedBone(V(spec.directions[i]),spec.lengths[i],joint.space||'global',V(joint.axis),joint.clockwiseDeg??150,joint.anticlockwiseDeg??0,V(joint.referenceAxis));
        else chain.addConsecutiveRotorConstrainedBone(V(spec.directions[i]),spec.lengths[i],joint.maxDeg??155);
      }
      if(spec.baseConstraint){const b=spec.baseConstraint;
        if(b.hinge)chain.setHingeBaseboneConstraint(b.space||'global',V(b.axis),b.clockwiseDeg??180,b.anticlockwiseDeg??180,V(b.referenceAxis));
        else chain.setRotorBaseboneConstraint('global',V(b.axis),b.maxDeg??170);
      }
      chain.setBaseLocation(V(spec.root));const error=chain.solveForTarget(V(spec.target));stats.ikSolves++;
      return {points:[arr(chain.bones[0].start),...chain.bones.map(b=>arr(b.end))],error};
    }
  };
  g.RuntimeTools={physics,ik,stats};
})(window);
