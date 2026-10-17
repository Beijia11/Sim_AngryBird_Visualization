// Ball/contact/scoring are independent of the visual swing sprites.
export function create(config) {
  function feedX(seed,round) {
    const pattern=[0,-.58,.52,-.28,.68];
    return seed===0?pattern[round%5]:Math.sin((seed+round*13)*1.97)*.65;
  }
  function finish(s,success,reason,spec) {
    s.completed++;s.results.push({round:s.round,success,reason});
    if(success){s.score++;s.events.push({type:'return_scored',ball_id:s.round,score:s.score});}
    else s.events.push({type:'miss',ball_id:s.round,reason});
    s.lastResult=reason;s.phase='result';s.wait=config.between_balls_ticks;
    if(s.completed===spec.balls){s.status=s.score>=spec.required_returns?'won':'lost';s.events.push({type:'session_end',score:s.score,status:s.status});}
  }
  return {config,
    init(scene,spec,seed) {
      return {seed,status:'playing',phase:'countdown',phaseTick:0,wait:config.initial_wait_ticks,
        player:{x:0,pose:'ready'},action:{age:-1,held:false},round:0,completed:0,score:0,results:[],
        ball:null,lastResult:'ready'};
    },
    step(old,proposal,scene,spec) {
      const s=structuredClone(old);s.events=[];
      if(s.status!=='playing')return s;
      s.player={x:proposal.x,pose:proposal.pose};s.action={age:proposal.age,held:proposal.held};
      s.phaseTick++;
      if(s.phase==='countdown'||s.phase==='result'){
        s.wait--;
        if(s.wait<=0){
          const x=feedX(s.seed,s.completed);s.round=s.completed+1;
          s.ball={x,y:.95,z:.22,vx:0,vy:-config.incoming_speed,vz:.028,bounced:false,hit:false};
          s.phase='incoming';s.phaseTick=0;s.lastResult='incoming';
          s.events.push({type:'serve',ball_id:s.round,x});
        }
        return s;
      }
      const b=s.ball,oldY=b.y;
      b.x+=b.vx;b.y+=b.vy;b.vz-=config.gravity;b.z+=b.vz;
      // A true return requires a near-side bounce, spatial overlap and an active swing phase.
      if(s.phase==='incoming'&&proposal.active&&b.bounced&&!b.hit&&
         b.y>=config.hit_y_min&&b.y<=config.hit_y_max&&b.z>=.02&&b.z<=config.max_contact_height&&
         Math.abs(b.x-s.player.x)<=config.contact_radius){
        b.hit=true;b.vy=config.return_speed;b.vx=-b.x/60;b.vz=config.return_lift;
        s.phase='outgoing';s.phaseTick=0;s.lastResult='hit';
        s.events.push({type:'racket_contact',ball_id:s.round,x:b.x,y:b.y,player_x:s.player.x,swing_age:proposal.age});
      }
      if((oldY-.5)*(b.y-.5)<0&&b.z<config.net_height){finish(s,false,'net',spec);return s;}
      if(b.z<=0){
        if(Math.abs(b.x)>1||b.y<0||b.y>1){finish(s,false,'out',spec);return s;}
        if(s.phase==='outgoing'){
          if(b.hit&&b.y>.5){s.events.push({type:'table_bounce',side:'far',ball_id:s.round,x:b.x,y:b.y});finish(s,true,'valid_return',spec);}
          else finish(s,false,'short_return',spec);
          return s;
        }
        if(b.bounced||b.y>=.5){finish(s,false,'invalid_bounce',spec);return s;}
        b.bounced=true;b.z=0;b.vz=Math.abs(b.vz)*config.bounce_restitution;
        s.events.push({type:'table_bounce',side:'near',ball_id:s.round,x:b.x,y:b.y});
      }
      if(s.phase==='incoming'&&b.y<config.miss_y){finish(s,false,'missed',spec);return s;}
      if(s.phaseTick>300){finish(s,false,'timeout',spec);return s;}
      return s;
    },
    draw(ctx,s,scene) {
      if(!s.ball||s.phase==='result')return;
      const target=scene.project(s.ball.x,0);
      const aligned=Math.abs(s.ball.x-s.player.x)<=config.contact_radius;
      ctx.strokeStyle=aligned?'#74f4c2':'#ffc977';ctx.lineWidth=4;ctx.setLineDash([5,5]);
      ctx.beginPath();ctx.ellipse(target.x,570,24,8,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    },
    drawForeground(ctx,s,scene) {
      if(!s.ball||s.phase==='result')return;
      const b=s.ball,p=scene.project(b.x,b.y,b.z),shadow=scene.project(b.x,b.y,0);
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,8,3,0,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=13;ctx.shadowColor='#fff2a0';ctx.fillStyle='#fff6c5';ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(s.phase==='incoming'&&b.y<.27&&b.y>-.09){ctx.strokeStyle='#79f8c5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,17,0,Math.PI*2);ctx.stroke();}
    }
  };
}
