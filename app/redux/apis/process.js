export function process(data) {
  const { items } = data;
  wrapStates(items);
  bubblePaths(items);
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
 * Bubble 'straight-line' graph edges
 * @param {Object} items 
 * @param {Object} items.graphs 
 * @param {Object} items.configs 
 */
function bubblePaths(items) {
  const { graphs, configs } = items;
  const counter = new BubbleCounter();

  for (const [graphId, graphData] of Object.entries(graphs)) {
    console.log(graphId);
    switch (graphId) {
      case 'states': {
        const pathStarts = getPathStarts(graphData);
        const bubbles = getBubbles(counter, pathStarts, graphData);

        const bubbleGraph = getGraph(bubbles);
        graphs[graphId] = bubbleGraph;
  
        bubbleConfigs(bubbles, configs);
        break;
      }
      case 'func-7': {
        const pathStarts = getPathStarts(graphData);
        console.log('path starts', pathStarts);
        const bubbles = getBubbles(counter, pathStarts, graphData);
        console.log('bubbles', bubbles);

        const spreadIds = {};
        for (const [bubbleId, bubble] of Object.entries(bubbles)) {
          if (bubble.nodes.length === 2) { // spread bubble into 2 single config bubbles
            const spreadBubbleId = counter.getId();
            const spreadBubble = new BubbleData(bubble.nodes[1]);
            spreadBubble.edges = bubble.edges;
            bubbles[spreadBubbleId] = spreadBubble;

            bubble.nodes = [bubble.nodes[0]];
            bubble.edges = [spreadBubble.nodes[0]];
          } else if (bubble.nodes.length > 2) {
            // create spread bubble for each state in first config
            const configId = bubble.nodes[0];
            const { states } = configs[configId];
            const spreadBubbles = [];
            for (const stateId of states) {
              const spreadBubbleId = counter.getId();
              spreadBubbles.push(spreadBubbleId);
              bubbles[spreadBubbleId] = new BubbleData(stateId);
            }

            // for rest of configs excluding last
            for (const configId of bubble.nodes.slice(1, -1)) {
              // add state to corresponding spread bubble (assumes config states are ordered)
              const { states } = configs[configId];
              states.forEach((stateId, index) => {
                const spreadBubbleId = spreadBubbles[index];
                bubbles[spreadBubbleId].addNode(stateId);
              });
            }
            // turn each spread bubble that contains sequential states into a single config bubble
            // generate new config for each spread bubble

            // create new bubble with last config and outbound edges
            const lastSpreadBubbleId = counter.getId();
            const lastSpreadBubble = new BubbleData();
            lastSpreadBubble.nodes = bubble.nodes.slice(-1);
            lastSpreadBubble.edges = bubble.edges;
            bubbles[lastSpreadBubbleId] = lastSpreadBubble;


            // add outbound edges from all spread bubbles to ending bubble
            // store spread bubbleIds into hash
          }
        }
        // for bubble in hash
        // go through bubbles and change outbound edges to original bubble to spread bubbles
        break;
      }
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
    data[nodeId].visited = true;

    const childIds = Object.keys(node);
    for (const childId of childIds) {
      if (!data[childId]) data[childId] = {};

      if (!data[childId].visited) { // queue if not visited
        queue.push(childId);
        if (childIds.length > 1) // mark as start if multiple
          data[childId].start = true;
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
 * @param {BubbleCounter} counter bubble counter object, used for generating new unique bubble ids
 * @param {Object} pathStarts path start node ids
 * @param {Object} graphData 
 * @param {Object} graphData.graph graph adjacency list
 */
function getBubbles(counter, pathStarts, graphData) {
  const { graph, start } = graphData;
  const bubbles = {};

  for (const pathStart of Object.keys(pathStarts)) {
    // generate bubble id
    const bubbleId = counter.getId();

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

  return bubbles;
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
 * Bubble configs
 * @param {Object} bubbles 
 * @param {Object} configs 
 */
function bubbleConfigs(bubbles, configs) {
  for (const [bubbleId, bubble] of Object.entries(bubbles)) {
    let states = [];
    let astLink = [];
    for (const configId of bubble.nodes) {
      const config = configs[configId];
      states = states.concat(config.states);
      astLink = astLink.concat(config.astLink);
    }
    configs[bubbleId] = { states, astLink };
  }
}


/** Counter of bubbles and generates unique bubble ids */
class BubbleCounter {
  constructor() {
    this.count = 0;
  }
  getId() {
    this.count += 1;
    return `bubble-${this.count}`;
  }
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
