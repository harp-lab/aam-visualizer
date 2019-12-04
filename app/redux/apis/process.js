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
  let bubbleCount = 0;

  for (const [graphId, graphData] of Object.entries(graphs)) {
    if (graphId == 'states') {
      const pathStarts = getPathStarts(graphData);
      console.log('path starts', pathStarts);
      
      const [newBubbleCount, bubbles] = getBubbles(bubbleCount, pathStarts, graphData);
      bubbleCount = newBubbleCount;
      console.log('bubbles', bubbles);

      const bubbleGraph = getGraph(bubbles);
      console.log('bubble graph', bubbleGraph);

      graphs['test'] = bubbleGraph;
    }
  }
}
/**
 * Get graph path start node ids
 * @param {Object} graphData 
 * @param {Object} graphData.graph graph adjacency list
 * @param {Array} graphData.start graph entry points
 * @returns {Object} path start node ids
 */
function getPathStarts(graphData) {
  let { graph, start } = graphData;
  start = [start];

  // add all entry points to data
  const data = {};
  for (const nodeId of start) {
    data[nodeId] = { start: true }
  }
  const queue = start;

  while (queue.length > 0) {
    // follow path and mark nodes as visited
    const nodeId = queue.shift();
    const node = graph[nodeId];
    if (!data[nodeId]) data[nodeId] = {};
    data[nodeId].visited = true;

    const childIds = Object.keys(node);
    for (const childId of childIds) {
      if (childIds.length > 1) { // mark children as start and queue if multiple
        if (!data[childId]) data[childId] = {};
        data[childId].start = true;
        queue.push(childId);
      } else if (!data[childId]) { // queue if not visited
        queue.push(childId);
      } else if (data[childId].visited) { // mark as start if visited
        data[childId].start = true;
      }
    }
  }

  // follow path from start, storing path until path-start node
  const pathStarts = {};
  for (const [nodeId, nodeData] of Object.entries(data)) {
    if (nodeData.start)
      pathStarts[nodeId] = undefined;
  }
  return pathStarts;
}

/**
 * Get graph bubbles
 * @param {Number} bubbleCount count of bubbles, used for generating new unique bubble ids
 * @param {Object} pathStarts path start node ids
 * @param {Object} graphData 
 * @param {Object} graphData.graph graph adjacency list
 */
function getBubbles(bubbleCount, pathStarts, graphData) {
  const { graph, start } = graphData;
  const bubbles = {};

  for (const pathStart of Object.keys(pathStarts)) {
    // generate bubble id
    bubbleCount += 1;
    const bubbleId = `bubble-${bubbleCount}`;

    // create new bubble
    pathStarts[pathStart] = bubbleId;
    const bubble = new BubbleData(pathStart);
    bubbles[bubbleId] = bubble;

    // traverse path, creating bubbles
    let currNode = pathStart;
    while (currNode) {
      const nodeData = graph[currNode];
      const childIds = Object.keys(nodeData);
      if (childIds.length > 1) { // multiple children, add edges to bubbles
        for (const childId of childIds) {
          if (pathStarts.hasOwnProperty(childId))
            bubble.addEdge(childId);
          else
            console.error('bubble processing - multiple edges without path start');
        }
        currNode = undefined;
      } else if (childIds.length === 1) { // single child
        const childId = childIds[0];
        if (pathStarts.hasOwnProperty(childId)) { // add edge to bubble
          bubble.addEdge(childId);
          currNode = undefined;
        } else { // add node to bubble
          bubble.addNode(childId);
          currNode = childId;
        }
      } else {
        currNode = undefined;
      }
    }
  }

  return [bubbleCount, bubbles];
}
/**
 * Convert bubbles to cytoscape data format
 * @param {Object} bubbles 
 */
function getGraph(bubbles) {
  // separate bubbles into single and multiple node bubbles
  const filteredBubbles = {};
  const filteredNodes = {};
  for (const [bubbleId, bubble] of Object.entries(bubbles)) {
    if (bubble.nodes.length > 1) {
      filteredBubbles[bubbleId] = bubble;
    } else {
      const nodeId = bubble.nodes[0];
      filteredNodes[nodeId] = bubble;
    }
  }

  // convert bubble node id edges to bubble id edges
  const graph = {};
  for (const [bubbleId, bubble] of Object.entries(filteredBubbles)) {
    bubble.linkEdges(filteredBubbles);
    graph[bubbleId] = bubble.exportEdges();
  }
  for (const [nodeId, bubble] of Object.entries(filteredNodes)) {
    bubble.linkEdges(filteredBubbles);
    graph[nodeId] = bubble.exportEdges();
  }

  return { graph };
}

/**
 * Bubble of contained nodes and outgoing edges to other bubbles
 * @param {String} [nodeId] node id
 */
class BubbleData {
  constructor(nodeId) {
    this.nodes = [];
    if (nodeId) this.addNode(nodeId);

    this.edges = [];
  }
  addNode(nodeId) { this.nodes.push(nodeId); }
  addEdge(nodeId) { this.edges.push(nodeId); }

  /**
   * Convert edges from node ids to bubble ids
   * @param {Object} bubbles 
   */
  linkEdges(bubbles) {
    this.edges = this.edges.map(nodeId => {
      for (const [bubbleId, bubble] of Object.entries(bubbles)) {
        if (bubble.nodes.includes(nodeId))
          return bubbleId;
      }
      return nodeId;
    });
  }
  exportEdges() {
    const bubbleEdges = {};
    for (const bubbleId of this.edges)
      bubbleEdges[bubbleId] = {};

    return bubbleEdges;
  }
}
