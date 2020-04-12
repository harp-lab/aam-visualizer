import React, { useContext } from 'react';
import { Paper, Fade } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ErrorBoundary, PaneContext } from 'library/base';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message,
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: theme.zIndex.drawer
  }
}));

/**
 * toolbar drawer within Pane element
 * @param {Object} props 
 */
function PaneToolbarDrawer(props) {
  const { open, children } = props;
  const { toolbarWidth } = useContext(PaneContext);
  const classes = useStyles();

  return (
    <Fade in={ open }>
      <Paper
        square
        classes={{ root: classes.drawer }} 
        style={{
          width: `calc(100% - ${toolbarWidth}px)`,
          height: '100%',
          marginRight: toolbarWidth
        }}>
        <ErrorBoundary>
          { children }
        </ErrorBoundary>
      </Paper>
    </Fade>);
}

export default PaneToolbarDrawer;
