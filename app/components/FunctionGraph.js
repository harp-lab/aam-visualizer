import React from 'react';
import Pane from './Pane';
import SplitPane from './SplitPane';
import Graph from './Graph';
import Typography from '@material-ui/core/Typography';

function FunctionGraph(props) {
  const project = props.project;

  // render main graph
  const mainGraph = project.mainGraph;
  const mainGraphElement = <Graph
    projectId={ props.projectId }
    graphId={ project.mainGraphId }
    data={ mainGraph.export() }
    metadata={ mainGraph.metadata }
    onNodeSelect={ props.onMainNodeSelect }
    onNodeUnselect={ nodeId => props.onMainNodeSelect(undefined) }
    onSave={ props.onSave } />;

  // render subgraph
  let subGraphElement;
  const subGraphId = project.subGraphId;
  if (subGraphId) {
    const subGraph = project.graphs[subGraphId];
    subGraphElement = <Graph
      projectId={ props.projectId }
      graphId={ subGraphId }
      data={ subGraph.export() }
      metadata={ subGraph.metadata }
      onNodeSelect={ nodeId => props.onNodeSelect(subGraphId, nodeId) }
      onNodeUnselect={ nodeId => props.onNodeUnselect(subGraphid, nodeId) }
      onEdgeSelect={ edgeId => {
          const edge = subGraph.edges[edgeId];
          if (!edgeId || edge.calls)
            props.onEdgeSelect(subGraphId, edgeId);
      }}
      onSave={ props.onSave } />;
  } else {
    // placeholder if no subgraph
    subGraphElement = (
      <Typography variant='h6'>
        No subgraph available
      </Typography>);
  }

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        { mainGraphElement }
      </Pane>
      <Pane
        height='50%'
        style={{
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        { subGraphElement }
      </Pane>
    </SplitPane>);
}

export default FunctionGraph;