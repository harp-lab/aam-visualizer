import { cyNodeDataHook } from 'extensions/store/hooks';

import NodeData from './NodeData';
import EdgeData from './EdgeData';

/**
 * Converts an analysis output graph adjacency list to cytoscape data format.
 * @param {Object} graphData graph data
 * @returns {Array} cytoscape data
 */
function GraphData(graphId, graphData) {
  const { graph, start } = graphData;

  const getNodeData = cyNodeDataHook(graphId);
  const cyData = [];

  /**
   * Add converted cytoscape node data
   * @param {String} nodeId node id
   */
  function exportNode(nodeId) {
    const data = {
      entrypoint: start.includes(nodeId) ? true : undefined,
      ...getNodeData(nodeId)
    };

    cyData.push(NodeData(nodeId, data));
  }

  /**
   * Add converted cytoscape edge data
   * @param {String} parentId parent node id
   * @param {String} childId child node id
   * @param {Object} edgeData edge data
   */
  function exportEdge(parentId, childId, edgeData) {
    const edgeId = `${parentId}-${childId}`;
    cyData.push(EdgeData(edgeId, parentId, childId, edgeData));
  }

  for (const [parentId, children] of Object.entries(graph)) {
    exportNode(parentId);

    for (const [childId, edgeData] of Object.entries(children)) {
      if (!graph[childId])
        exportNode(childId);
      exportEdge(parentId, childId, edgeData);
    }
  }

  return cyData;
}

export default GraphData;
