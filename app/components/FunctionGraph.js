import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { getMainGraphId, getSubGraphId } from '../redux/selectors/graphs';
import { refreshConfigs } from '../redux/actions/panels';

import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

import SplitPane from './SplitPane';
import Pane from './Pane';
import Graph from './Graph';

function FunctionGraph(props) {
  const {
    mainGraphId, subGraphId,
    refreshConfigs
  } = props;

  const subGraphElement = (
    <Fragment>
      <GraphLabel content={ subGraphId } />
      <Graph
        graphId={ subGraphId }
        onNodeSelect={ refreshConfigs }
        onNodeUnselect={ refreshConfigs } />
    </Fragment>);

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel content={ mainGraphId } />
        <Graph
          graphId={ mainGraphId } />
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
  const mainGraphId = getMainGraphId(state);
  const subGraphId = getSubGraphId(state);
  return { mainGraphId, subGraphId };
};
export default connect(
  mapStateToProps,
  { refreshConfigs }
)(FunctionGraph);