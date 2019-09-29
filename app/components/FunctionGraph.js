import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { setMainGraphId } from '../redux/actions';
import { getSelectedProjectId } from '../redux/selectors/projects'
import { getMainGraphId, getSubGraphId } from '../redux/selectors/graphs';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

import SplitPane from './SplitPane';
import Pane from './Pane';
import PaneMessage from './PaneMessage';
import Graph from './Graph';

import GraphData from './data/Graph';

function FunctionGraph(props) {
  const {
    projectId, mainGraphId, subGraphId, focused
  } = props;

  const mainGraphElement = <Graph
    projectId={ projectId }
    graphId={ mainGraphId } />;
  const subGraphElement = (
    <Fragment>
      <GraphLabel content={ subGraphId } />
      <Graph
        projectId={ projectId }
        graphId={ subGraphId } />
    </Fragment>);

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
const mapStateToProps = state => {
  const projectId = getSelectedProjectId(state);
  const mainGraphId = getMainGraphId(state);
  const subGraphId = getSubGraphId(state);
  return { projectId, mainGraphId, subGraphId };
};
export default connect(
  mapStateToProps,
  { setMainGraphId }
)(FunctionGraph);