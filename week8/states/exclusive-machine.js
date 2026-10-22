// One active leaf within one parent. Unknown is an annotation gap, not a node.
export function videoAt(model, time) {
  const t = Math.max(0, Math.min(time, model.meta.duration - 1e-6));
  const index = model.primarySegments.findIndex(s => s.start <= t && t < s.end);
  const state = model.primarySegments[index];
  const transition = model.transitions.find(r => r.toSegment === state.id) || null;
  // Continue to show the behaviour entry through its internal phase boundaries.
  let entry = index;
  while (entry > 0 && model.primarySegments[entry-1].behavior === state.behavior &&
         model.primarySegments[entry-1].quality === state.quality) entry--;
  const entryTransition = model.transitions.find(r => r.toSegment === model.primarySegments[entry].id) || null;
  return {state, transition, entryTransition};
}
