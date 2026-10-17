// Fixed host: input bindings are in game_spec, not in the observed action vocabulary.
export function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
export function createGame(modules, spec) {
  freeze(spec);
  const {character, scene, action, mechanism} = modules;
  let state, history, seed;
  const copy = v => structuredClone(v);
  function reset(value = 0) {
    if (!Number.isInteger(value)) throw Error('seed must be an integer');
    seed = value; history = [];
    state = freeze({...mechanism.init(scene.config, spec, seed), tick: 0, events: []});
    return copy(state);
  }
  function step(id = null, frames = 1) {
    if (id !== null && !spec.enabled_actions.includes(id)) throw Error(`Illegal action: ${id}`);
    if (!Number.isInteger(frames) || frames < 1 || frames > 36000) throw Error('Invalid frame count');
    for (let i = 0; i < frames; i++) {
      const proposal = freeze(action.propose(state, id, scene));
      const next = mechanism.step(state, proposal, scene, spec);
      state = freeze({...next, tick: state.tick + 1});
      history.push({tick: state.tick, action: id, state: copy(state)});
    }
    return copy(state);
  }
  function render(ctx) {
    ctx.save(); scene.draw(ctx, state); mechanism.draw(ctx, state, scene);
    character.draw(ctx, state, scene); mechanism.drawForeground?.(ctx,state,scene); ctx.restore();
  }
  reset(0);
  return {reset, step, render, observe: () => copy(state), events: () => copy(state.events),
    trace: () => ({seed, steps: copy(history)}), modules};
}

export async function loadGame(base, readJSON = async url => {
  const res = await fetch(url); if (!res.ok) throw Error(`Missing ${url}`); return res.json();
}) {
  const spec = await readJSON(new URL('game_spec.json', base));
  const modules = {};
  for (const name of ['character','scene','action','mechanism']) {
    const url = new URL(`modules/${name}/`, base);
    const config = freeze(await readJSON(new URL('config.json', url)));
    const impl = await import(new URL('module.mjs', url));
    modules[name] = await impl.create(config, {baseURL:url, readJSON});
  }
  return createGame(modules, spec);
}
