import React, { Fragment } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

import SplitPane from './SplitPane';
import Pane from './Pane';
import PaneMessage from './PaneMessage';
import Graph from './Graph';

function FunctionGraph(props) {
  const { projectId, project } = props;

  // render main graph
  const mainGraphId = project.mainGraphId;
  const mainGraph = project.mainGraph;
  const mainGraphElement = <Graph
    projectId={ projectId }
    graphId={ mainGraphId }
    data={ mainGraph.export() }
    metadata={ mainGraph.metadata }
    onNodeSelect={ props.onMainNodeSelect }
    onNodeUnselect={ props.onMainNodeUnselect }
    onSave={ props.onSave } />;

  // render subgraph
  let subGraphElement;
  const subGraphId = project.subGraphId;
  if (subGraphId) {
    const subGraph = project.graphs[subGraphId];
    subGraphElement = (
      <Fragment>
        <GraphLabel content={ subGraphId} />
        <Graph
          projectId={ projectId }
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
  } else
    subGraphElement = <PaneMessage content='No subgraph available' />;

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel content={ mainGraphId } />
        { mainGraphElement }
      </Pane>
      <Pane height='50%'>
        { subGraphElement }
      </Pane>
    </SplitPane>);
}

function GraphLabel(props) {
  const { content, theme } = props;
  return (
    <Toolbar
      variant='dense'
      style={{
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.text.primary,
        width: '100%',
        minHeight: 'unset'
      }}>
      <Typography>{ content }</Typography>
    </Toolbar>);
}
GraphLabel = withTheme(GraphLabel);

export default FunctionGraph;