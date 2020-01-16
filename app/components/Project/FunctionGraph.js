import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Toolbar, Typography } from '@material-ui/core';
import { BubbleChart } from '@material-ui/icons';
import { useTheme } from '@material-ui/styles';
import { IconToggle, Pane, Spacer, SplitPane } from 'library';
import { toggleBubbling } from 'store-actions';
import { getMainGraphId, getSubGraphId, getBubbling } from 'store-selectors';

import Graph from './Graph';

/** FunctionGraph component */
function FunctionGraph() {
  const mainGraphId = useSelector(getMainGraphId);
  const subGraphId = useSelector(getSubGraphId);

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel graphId={ mainGraphId } />
        <Graph graphId={ mainGraphId } />
      </Pane>
      <Pane height='50%'>
        <GraphLabel graphId={ subGraphId } />
        <Graph
          graphId={ subGraphId }
          edgePredicate={ edge => {
            const style = edge.data('style');
            if (style) return style['line-style'] === 'dashed';
            return false;
          }} />
      </Pane>
    </SplitPane>);
}

/**
 * GraphLabel component
 * @param {Object} props 
 * @param {String} props.graphId graph id
 */
function GraphLabel(props) {
  const { graphId } = props;
  const theme = useTheme();

  return (
    <Toolbar
      variant='dense'
      style={{
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.text.primary,
        minHeight: 'unset'
      }}>
      <Spacer
        childrenStyle={{ marginRight: '1em' }}
        noDiv >
        <Typography>{ graphId }</Typography>
        <BubbleToggle graphId={ graphId } />
      </Spacer>
    </Toolbar>);
}

/**
 * BubbleToggle component
 * @param {Object} props 
 * @param {String} props.graphId graph id
 */
function BubbleToggle(props) {
  const { graphId } = props;
  const bubbled = useSelector(state => getBubbling(state, graphId));
  const dispatch = useDispatch();

  return <IconToggle
    icon={ <BubbleChart /> }
    tooltip='bubbling'
    enabled={ bubbled }
    onToggle={ () => dispatch(toggleBubbling(graphId)) }
    style={{ padding: 0 }} />;
}

export default FunctionGraph;
