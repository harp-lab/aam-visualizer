import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormGroup, FormControlLabel, Switch, Toolbar, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { Pane, SplitPane } from 'library';
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

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            checked={ bubbled }
            onChange={ () => dispatch(toggleBubbling(graphId)) }
            size='small' />
        }
        label='bubbling'/>
    </FormGroup>
  );
}

export default FunctionGraph;
