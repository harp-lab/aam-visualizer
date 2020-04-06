import React, { forwardRef } from 'react';
import { Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  toolbar: {
    zIndex: theme.zIndex.drawer + 1
  },
}));

/**
 * toolbar within Pane element
 * @param {Object} props 
 * @param {Function} ref ref callback passed to Paper
 */
function PaneToolbar(props, ref) {
  const { children } = props;
  const classes = useStyles();

  return (
    <Paper
      square
      ref={ ref }
      classes={{ root: classes.toolbar }}>
      { children }
    </Paper>);
}

export default forwardRef(PaneToolbar);
