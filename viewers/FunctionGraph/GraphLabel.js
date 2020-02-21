import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Toolbar, Typography } from '@material-ui/core';
import { BubbleChart } from '@material-ui/icons';
import { useTheme } from '@material-ui/styles';
import { IconToggle, Spacer } from 'library/base';
import { toggleBubbling } from 'store/actions';
import { getBubbling } from 'store/selectors';

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

  // check if bubbling available
  if (bubbled === undefined)
    return null;

  return <IconToggle
    icon={ <BubbleChart /> }
    tooltip='bubbling'
    enabled={ bubbled }
    onToggle={ () => dispatch(toggleBubbling(graphId)) }
    style={{ padding: 0 }} />;
}

export default GraphLabel;
