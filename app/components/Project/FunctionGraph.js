import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Switch, Toolbar, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { Pane, SplitPane } from 'library';
import { toggleBubbling } from 'store-actions';
import { getMainGraphId, getSubGraphId, getBubbling, getBubbledGraphId } from 'store-selectors';

import Graph from './Graph';

/** FunctionGraph component */
function FunctionGraph() {
  const mainGraphId = useSelector(getMainGraphId);
  const subGraphId = useSelector(getSubGraphId);
  const mainBubbled = useSelector(state => getBubbling(state, mainGraphId));
  const subBubbled = useSelector(state => getBubbling(state, subGraphId));

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel graphId={ mainGraphId } />
        <Graph graphId={ mainBubbled ? getBubbledGraphId(mainGraphId) : mainGraphId } />
      </Pane>
      <Pane height='50%'>
        <GraphLabel graphId={ subGraphId } />
        <Graph
          graphId={ subBubbled ? getBubbledGraphId(subGraphId) : subGraphId }
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
      <Typography>{ graphId }</Typography>
      <BubbleSwitch graphId={ graphId } />
    </Toolbar>);
}

/**
 * BubbleSwitch component
 * @param {Object} props 
 * @param {String} props.graphId graph id
 */
function BubbleSwitch(props) {
  const { graphId } = props;
  const bubbled = useSelector(state => getBubbling(state, graphId));
  const dispatch = useDispatch();

  return <Switch checked={ bubbled } onChange={ () => dispatch(toggleBubbling(graphId)) } />;
}

export default FunctionGraph;
