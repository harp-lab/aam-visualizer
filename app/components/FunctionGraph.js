import React from 'react';
import { connect } from 'react-redux';
import { getMainGraphId, getSubGraphId } from '../redux/selectors/graphs';

import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

import SplitPane from './SplitPane';
import Pane from './Pane';
import Graph from './Graph';

function FunctionGraph(props) {
  const { mainGraphId, subGraphId } = props;

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel content={ mainGraphId } />
        <Graph
          graphId={ mainGraphId }
          edgePredicate={ edge => false } />
      </Pane>
      <Pane height='50%'>
        <GraphLabel content={ subGraphId } />
        <Graph
          graphId={ subGraphId }
          edgePredicate={ edge => {
            const style = edge.data('style');
            if (style)
              return style['line-style'] === 'dashed';
            return false;
          } } />
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
  mapStateToProps
)(FunctionGraph);