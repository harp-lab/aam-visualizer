import React from 'react';
import Pane from './Pane';
import SplitPane from './SplitPane';
import Graph from './Graph';
import Typography from '@material-ui/core/Typography';

function FunctionGraph(props) {
  const project = props.project;

  // render main graph
  const mainGraph = project.mainGraph;
  const mainGraphElement = (
    <Pane height='50%'>
      <Graph
        projectId={ props.projectId }
        graphId={ project.mainGraphId }
        data={ mainGraph.export() }
        positions={ mainGraph.metadata.positions }
        selectedNode={ mainGraph.metadata.selectedNode }
        highlighted={ props.highlightedNodeIds }
        onNodeSelect={ props.onMainNodeSelect }
        onNodeUnselect={ nodeId => props.onMainNodeSelect(undefined) }
        onSave={ props.onSave } />
    </Pane>);

  // render subgraph
  let subGraphElement;
  const subGraphId = project.subGraphId;
  if (subGraphId) {
    const subGraph = project.graphs[subGraphId];
    subGraphElement = (
      <Pane height='50%'>
        <Graph
          projectId={ props.projectId }
          graphId={ subGraphId }
          data={ subGraph.export() }
          positions={ subGraph.metadata.positions }
          selectedNode={ subGraph.metadata.selectedNode }
          selectedEdge={ subGraph.metadata.selectedEdge }
          onNodeSelect={ nodeId => props.onNodeSelect(subGraphId, nodeId) }
          onNodeUnselect={ nodeId => props.onNodeUnselect(subGraphid, nodeId) }
          onEdgeSelect={ edgeId => {
              const edge = subGraph.edges[edgeId];
              if (!edgeId || edge.calls)
                props.onEdgeSelect(subGraphId, edgeId);
          } }
          onSave={ props.onSave } />
      </Pane>);
  }
  else {
    // placeholder if no subgraph
    subGraphElement = (
      <Pane
        height='50%'
        style={{
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Typography variant='h6'>
          No subgraph available
        </Typography>
      </Pane>);
  }

  return  (
    <SplitPane horizontal>
      { mainGraphElement }
      { subGraphElement }
    </SplitPane>);
}

export default FunctionGraph;