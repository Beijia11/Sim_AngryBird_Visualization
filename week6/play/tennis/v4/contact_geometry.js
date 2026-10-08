/* Shared geometric boundary for 2D primitives and 3D contact simulation.
 * It never advances/redirects a ball. Rapier owns forces and collision response. */
(function(g){'use strict';
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const mul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
 const rotate=(v,q)=>mul(mul(q,[...v,0]),[-q[0],-q[1],-q[2],q[3]]).slice(0,3);
 function court({farLeft,farRight,nearLeft,nearRight,width,length}){
  const fw=farRight[0]-farLeft[0],nw=nearRight[0]-nearLeft[0],k=fw/nw-1;
  const fc=(farLeft[0]+farRight[0])/2,nc=(nearLeft[0]+nearRight[0])/2,fy=farLeft[1],ny=nearLeft[1];
  function ground(z){const t=(z+length/2)/length,d=1+k*t;return {x:(fc+(nc*(1+k)-fc)*t)/d,y:(fy+(ny*(1+k)-fy)*t)/d,scale:fw/width/d};}
  function project(p){const a=ground(p[2]);return [a.x+p[0]*a.scale,a.y-p[1]*a.scale];}
  function atDepth(pixel,z){const a=ground(z);return [(pixel[0]-a.x)/a.scale,(a.y-pixel[1])/a.scale,z];}
  function onGround(pixel){const t=(fy-pixel[1])/(pixel[1]*k-(ny*(1+k)-fy)),z=t*length-length/2;return atDepth(pixel,z);}
  return {ground,project,atDepth,onGround};
 }
 function racketFromScreen(rect,depth,projection,{thickness=.036,yaw=0,pitch=0}={}){
  const scale=projection.ground(depth).scale,a=-rect.angle/2;
  const qz=[0,0,Math.sin(a),Math.cos(a)],qy=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)],qx=[Math.sin(pitch/2),0,0,Math.cos(pitch/2)];
  return {position:projection.atDepth(rect.center,depth),quaternion:mul(mul(qz,qy),qx),shape:{type:'box',halfExtents:[rect.size[0]/scale/2,rect.size[1]/scale/2,thickness/2]}};
 }
 function faceCorners(body,projection){const [x,y]=body.shape.halfExtents;return [[-x,-y,0],[x,-y,0],[x,y,0],[-x,y,0]].map(p=>projection.project(add(body.position,rotate(p,body.quaternion))));}
 function sphereBoxGap(ball,box){const q=box.quaternion,local=rotate(sub(ball.position,box.position),[-q[0],-q[1],-q[2],q[3]]),e=box.shape.halfExtents;
  const excess=local.map((v,i)=>Math.abs(v)-e[i]);return Math.hypot(...excess.map(v=>Math.max(v,0)))+Math.min(Math.max(...excess),0)-ball.shape.radius;
 }
 function launchVelocity(start,arrival,seconds,gravity){if(!(seconds>0))throw Error('Positive flight time required');return start.map((x,i)=>(arrival[i]-x-.5*gravity[i]*seconds*seconds)/seconds);}
 // Frictionless infinite-mass face reference equation; diagnostic only.
 function reflectVelocity(velocity,surfaceVelocity,normal,restitution){const relative=sub(velocity,surfaceVelocity),dot=relative.reduce((s,x,i)=>s+x*normal[i],0);return velocity.map((x,i)=>x-(1+restitution)*dot*normal[i]);}
 g.ContactGeometry={court,racketFromScreen,faceCorners,sphereBoxGap,launchVelocity,reflectVelocity,rotate};
})(window);
