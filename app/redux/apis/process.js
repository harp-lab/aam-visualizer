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
    const bubbledGraphId = `bubbled-${graphId}`;
    switch (graphId) {
      case 'states': {
        const pathStarts = getPathStarts(graphData);
        const bubbles = getBubbles(counter, pathStarts, graphData);
        bubbleConfigs(bubbles, configs);
        graphs[bubbledGraphId] = getGraph(bubbles);
        break;
      }
      default: {
        const pathStarts = getPathStarts(graphData);
        const bubbles = getBubbles(counter, pathStarts, graphData);
        spreadBubbles(counter, bubbles, graphData, items);
        graphs[bubbledGraphId] = getGraph(bubbles);
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
    const bubble = new Bubble(pathStart);
    bubbles[bubbleId] = bubble;

    // traverse path, creating bubbles
    let currNode = pathStart;
    while (currNode) {
      const nodeData = graph[currNode];
      const childIds = Object.keys(nodeData);
      if (childIds.length > 1) { // multiple children, add edges to bubbles
        for (const childId of childIds) {
          if (pathStarts.hasOwnProperty(childId))
            bubble.addEdge(childId, nodeData[childId]);
          else
            console.error('bubble processing - multiple edges without path start');
        }
        currNode = undefined;
      } else if (childIds.length === 1) { // single child
        const childId = childIds[0];
        if (pathStarts.hasOwnProperty(childId)) { // add edge to bubble
          bubble.addEdge(childId, nodeData[childId]);
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
      const node = new Node();
      node.edges = bubble.edges;
      bubbles[nodeId] = node;
      delete bubbles[bubbleId];
    }
  }

  return bubbles;
}

/**
 * Spread config bubbles
 * @param {BubbleCounter} counter bubble counter object, used for generating new unique bubble ids
 * @param {Object} bubbles 
 * @param {Object} graphData
 * @param {Object} items 
 */
function spreadBubbles(counter, bubbles, graphData, items) {
  const { graph, start } = graphData;
  const { configs, states } = items;

  const spreadIds = {};
  for (const [bubbleId, bubble] of Object.entries(bubbles)) {
    if (bubble instanceof Bubble) {
      const length = bubble.nodes.length;
      if (length === 2) { // spread bubble into 2 nodes
        const lastNodeId = bubble.nodes[1];
        bubbles[lastNodeId] = new Node(bubble);

        const firstNodeId = bubble.nodes[0];
        const node = new Node();
        const edgeData = graph[firstNodeId][lastNodeId]
        node.addEdge(lastNodeId, edgeData);
        bubbles[firstNodeId] = node;
      } else if (length > 2) {
        // create new bubble with last config and outbound edges
        const lastConfigId = bubble.nodes[length - 1];
        bubbles[lastConfigId] = new Node(bubble);

        // create spread bubble for each state in first config with outbound edge to ending node
        const configId = bubble.nodes[0];
        const { states: stateIds } = configs[configId];
        const spreadBubbleIds = [];
        const edgeData = graph[bubble.nodes[length - 2]][lastConfigId];
        for (const stateId of stateIds) {
          const bubbleId = counter.getId();
          spreadBubbleIds.push(bubbleId);
          const bubble = new Bubble(stateId);
          bubble.addEdge(lastConfigId, edgeData);
          bubbles[bubbleId] = bubble;
        }
        // store spread bubble ids
        spreadIds[configId] = spreadBubbleIds;

        // for rest of configs excluding last
        for (const configId of bubble.nodes.slice(1, -1)) {
          // add state to corresponding spread bubble (assumes config states are ordered)
          const { states: stateIds } = configs[configId];
          for (let i = 0; i < stateIds.length; i++) {
            const bubbleId = spreadBubbleIds[i];
            bubbles[bubbleId].addNode(stateIds[i]);
          }
        }

        // generate new config for each spread bubble
        for (const bubbleId of spreadBubbleIds) {
          const bubble = bubbles[bubbleId];
          const stateIds = bubble.nodes;
          const astLink = stateIds.map(stateId => states[stateId].expr);
          configs[bubbleId] = { states: stateIds, astLink };

          // convert spread bubble to node
          bubbles[bubbleId] = new Node(bubble);
        }
      }
      delete bubbles[bubbleId];
    }
  }
  
  // go through bubbles and change outbound edges to original bubble to spread bubbles
  for (const [bubbleId, bubble] of Object.entries(bubbles)) {
    bubble.spreadEdges(spreadIds);
  }
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
    graph[nodeId] = bubble.edges;
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
    if (bubble instanceof Bubble) {
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
 * @param {Bubble} [bubble] bubble data
 */
class Node {
  constructor(bubble) {
    if (bubble) this.edges = bubble.edges;
    else this.edges = {};
  }
  /**
   * Add edge
   * @param {Object} edgeData edge data
   */
  addEdge(edgeId, edgeData) { this.edges[edgeId] = edgeData; }
  /**
   * Convert edges from node ids to bubble ids
   * @param {Object} bubbles 
   */
  linkEdges(bubbles) {
    for (const [edgeId, edgeData] of Object.entries(this.edges)) {
      for (const [bubbleId, bubble] of Object.entries(bubbles)) {
        if (bubble instanceof Bubble && bubble.nodes.includes(edgeId)) {
          this.edges[bubbleId] = edgeData;
          delete this.edges[edgeId];
          break;
        }
      }
    }
  }
  /**
   * Spread edges from bubble id to spread bubble ids
   * @param {Object} bubbles hash of bubble id keys and spread bubble id list values
   */
  spreadEdges(bubbles) {
    for (const [edgeId, edgeData] of Object.entries(this.edges)) {
      for (const [bubbleId, spreadBubbleIds] of Object.entries(bubbles)) {
        if (edgeId === bubbleId) {
          for (const bubbleId of spreadBubbleIds) {
            this.edges[bubbleId] = edgeData;
          }
          delete this.edges[edgeId];
          break;
        }
      }
    }
  }
}

/**
 * Bubble of contained nodes and outgoing edges
 * @param {String} [nodeId] node id
 */
class Bubble extends Node {
  constructor(nodeId) {
    super();

    this.nodes = [];
    if (nodeId) this.addNode(nodeId);
  }
  addNode(nodeId) { this.nodes.push(nodeId); }
  isSingleton() { return this.nodes.length === 1; }
}
