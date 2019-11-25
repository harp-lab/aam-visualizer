export function process(data) {
  const { items } = data;
  wrapStates(items);
  //shortenPaths(items);
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

function shortenPaths(items) {
  const { graphs, configs } = items;

  for (const [graphId, graphData] of Object.entries(graphs)) {
    const { graph, start } = graphData;
    if (graphId == 'states') {
      const data = {
        [start]: { start: true }
      };
      const queue = [start];
      while (queue.length > 0) {
        // follow path and mark nodes as visited
        const nodeId = queue.shift();
        console.log('node id', nodeId);
        const node = graph[nodeId];
        if (!data[nodeId]) data[nodeId] = {};
        data[nodeId].visited = true;
  
        const childIds = Object.keys(node);
        for (const childId of childIds) {
          if (!data[childId]) {
            // explore if not visited
            queue.push(childId);
          } else if (data[childId].visited) {
            // mark node as path-start if visited before and stop exploration
            data[childId].start = true;
          } else if (childIds.length > 1) {
            // mark node children as path-start if more than two
            data[childId].start = true;
            queue.push(childId);
          }
        }
      }
      console.log(graph);
      console.log(data);

      // follow path from start, storing path until path-start node
      const pathStarts = [];
      for (const [nodeId, nodeData] of Object.entries(data)) {
        if (nodeData.start)
          pathStarts.push(nodeId);
      }

      console.log(pathStarts);
    }

  }
}
