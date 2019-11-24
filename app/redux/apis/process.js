export function process(data) {
  const { items } = data;
  wrapStates(items);
}

/**
 * Generate configs wrapping individual states
 * @param {Object} items project items
 * @param {Object} items.states states
 * @param {Object} items.configs configs
 */
function wrapStates(items) {
  const { states, configs } = items;

  for (const [stateId, state] of Object.entries(states)) {
    const { form, expr } = state;
    configs[stateId] = {
      form,
      states: [stateId],
      astLink: [expr]
    };
  }
}
