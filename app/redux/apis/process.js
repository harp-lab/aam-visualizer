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
  const { graphs, configs, states } = items;
  const counter = new BubbleCounter();

  for (const [graphId, graphData] of Object.entries(graphs)) {
    console.log(graphId);
    switch (graphId) {
      case 'states': {
        const pathStarts = getPathStarts(graphData);
        console.log('path starts', pathStarts);
        const bubbles = getBubbles(counter, pathStarts, graphData);
        console.log('bubbles', bubbles);

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
          if (bubble instanceof BubbleData) {
            if (bubble.nodes.length === 2) { // spread bubble into 2 nodes
              const lastNodeId = bubble.nodes[1];
              bubbles[lastNodeId] = new NodeData(bubble);

              const firstNodeId = bubble.nodes[0];
              const node = new NodeData();
              node.addEdge(lastNodeId);
              bubbles[firstNodeId] = node;
              delete bubbles[bubbleId];
            } else if (bubble.nodes.length > 2) {
              // create spread bubble for each state in first config
              const configId = bubble.nodes[0];
              const { states: stateIds } = configs[configId];
              const spreadBubbleIds = [];
              for (const stateId of stateIds) {
                const bubbleId = counter.getId();
                spreadBubbleIds.push(bubbleId);
                bubbles[bubbleId] = new BubbleData(stateId);
              }

              // for rest of configs excluding last
              for (const configId of bubble.nodes.slice(1, -1)) {
                // add state to corresponding spread bubble (assumes config states are ordered)
                const { states: stateIds } = configs[configId];
                stateIds.forEach((stateId, index) => {
                  const bubbleId = spreadBubbleIds[index];
                  bubbles[bubbleId].addNode(stateId);
                });
              }

              // generate new config for each spread bubble
              for (const bubbleId of spreadBubbleIds) {
                const bubble = bubbles[bubbleId];
                const stateIds = bubble.nodes;
                console.log(stateIds);
                const astLink = stateIds.map(stateId => states[stateId].expr);
                configs[bubbleId] = { states: stateIds, astLink };

                // convert spread bubble to node
                bubbles[bubbleId] = new NodeData(bubble);
              }

              // create new bubble with last config and outbound edges
              const lastNodeId = bubble.nodes.slice(-1);
              bubbles[lastNodeId] = new NodeData(bubble);

              // add outbound edges from all spread bubbles to ending bubble
              // store spread bubbleIds into hash
            }
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

  // change singleton bubble to node
  for (const [bubbleId, bubble] of Object.entries(bubbles)) {
    if (bubble.isSingleton()) {
      const nodeId = bubble.nodes[0];
      const node = new NodeData();
      node.edges = bubble.edges;
      bubbles[nodeId] = node;
      delete bubbles[bubbleId];
    }
  }

  return bubbles;
}
/**
 * Convert bubbles to cytoscape data format
 * @param {Object} bubbles 
 */
function getGraph(bubbles) {
  // convert bubble node id edges to bubble id edges
  const graph = {};
  for (const [nodeId, bubble] of Object.entries(bubbles)) {
    bubble.linkEdges(bubbles);
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
    if (bubble instanceof BubbleData) {
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
 * Node with outgoing edges
 * @param {BubbleData} [bubble] bubble data
 */
class NodeData {
  constructor(bubble) {
    if (bubble) this.edges = bubble.edges;

    this.edges = [];
  }
  addEdge(nodeId) { this.edges.push(nodeId); }
  /**
   * Convert edges from node ids to bubble ids
   * @param {Object} bubbles 
   */
  linkEdges(bubbles) {
    this.edges = this.edges.map(nodeId => {
      for (const [bubbleId, bubble] of Object.entries(bubbles)) {
        if (bubble instanceof BubbleData && bubble.nodes.includes(nodeId))
          return bubbleId;
      }
      return nodeId;
    });
  }
  exportEdges() {
    const edges = {};
    for (const nodeId of this.edges)
      edges[nodeId] = {};

    return edges;
  }
}

/**
 * Bubble of contained nodes and outgoing edges
 * @param {String} [nodeId] node id
 */
class BubbleData extends NodeData {
  constructor(nodeId) {
    super();

    this.nodes = [];
    if (nodeId) this.addNode(nodeId);
  }
  addNode(nodeId) { this.nodes.push(nodeId); }
  isSingleton() { return this.nodes.length === 1; }
}
