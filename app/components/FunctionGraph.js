import React, { Fragment } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

import Pane from './Pane';
import SplitPane from './SplitPane';
import Graph from './Graph';

function FunctionGraph(props) {
  const theme = props.theme;
  const project = props.project;

  // render main graph
  const mainGraph = project.mainGraph;
  const mainGraphElement = <Graph
    projectId={ props.projectId }
    graphId={ project.mainGraphId }
    data={ mainGraph.export() }
    metadata={ mainGraph.metadata }
    onNodeSelect={ props.onMainNodeSelect }
    onNodeUnselect={ props.onMainNodeUnselect }
    onSave={ props.onSave } />;

  // render subgraph
  let subGraphElement;
  const subGraphId = project.subGraphId;
  if (subGraphId) {
    const subGraphLabel = (
      <Toolbar
        variant='dense'
        style={{
          backgroundColor: theme.palette.grey[300],
          color: theme.palette.text.primary,
          width: '100%',
          minHeight: 'unset'
        }}>
        <Typography>{ subGraphId }</Typography>
      </Toolbar>);
    const subGraph = project.graphs[subGraphId];
    subGraphElement = (
      <Fragment>
        { subGraphLabel }
        <Graph
          projectId={ props.projectId }
          graphId={ subGraphId }
          data={ subGraph.export() }
          metadata={ subGraph.metadata }
          onNodeSelect={ nodeId => props.onNodeSelect(subGraphId, nodeId) }
          onNodeUnselect={ nodeId => props.onNodeUnselect(subGraphId, nodeId) }
          onEdgeSelect={ edgeId => {
              const edge = subGraph.edges[edgeId];
              if (!edge || edge.calls)
                props.onEdgeSelect(subGraphId, edgeId);
          }}
          onSave={ props.onSave } />
      </Fragment>);
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
FunctionGraph = withTheme(FunctionGraph);

export default FunctionGraph;