// Video-derived action forms; keyboard bindings live in game_spec.
export function create(config) {
  return {config,propose(state,id) {
    if(state.status!=='playing')return {x:state.player.x,age:state.action.age,held:false,pose:'ready'};
    let age=state.action.age, held=id==='racket_swing';
    if(age>=0)age++;
    if(age>=config.swing.total_ticks)age=-1;
    if(held&&!state.action.held&&age<0)age=0;
    let dx=0;
    if(id==='lateral_step_left')dx=-config.step_per_tick;
    if(id==='lateral_step_right')dx=config.step_per_tick;
    const x=Math.max(-config.move_limit,Math.min(config.move_limit,state.player.x+dx));
    const active=age>=config.swing.active_start&&age<=config.swing.active_end;
    const pose=age>=0?(age<config.swing.active_start?'prepare':'swing'):dx?'step':'ready';
    return {x,age,held,active,pose,moving:dx!==0};
  }};
}
