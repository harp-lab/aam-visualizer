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

/**
 * Shorten 'straight-line' graph edges
 * @param {Object} items 
 * @param {Object} items.graphs 
 * @param {Object} items.configs 
 */
function shortenPaths(items) {
  const { graphs, configs } = items;

  for (const [graphId, graphData] of Object.entries(graphs)) {
    const { graph, start } = graphData;
    if (graphId == 'states') {

      // add all entry points to data
      const data = {};
      for (const nodeId of start) {
        data[nodeId] = { start: true }
      }
      const queue = start;

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
      const pathStarts = new Set();
      for (const [nodeId, nodeData] of Object.entries(data)) {
        if (nodeData.start)
          pathStarts.add(nodeId);
      }
      
      console.log(pathStarts);
      // init bubble hash
      // iterate through pathStarts
      // create bubble class
      // follow path from pathStart
      // if node is a pathstart, stop path and add edge to another bubble class
      // otherwise, add node to bubble class

    }

  }
}

//TODO state graph bubbles
class Bubble {
  constructor() {

  }
}