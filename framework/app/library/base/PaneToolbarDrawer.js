import React, { Fragment, useContext } from 'react';
import { Drawer as MUIDrawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ErrorBoundary, PaneContext } from 'library/base';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message
}));

/**
 * toolbar drawer within Pane element
 * @param {Object} props 
 */
function PaneToolbarDrawer(props) {
  const { open, children } = props;
  const { toolbarWidth } = useContext(PaneContext);

  // TODO: make toolbar and drawers local to panel (nested within)
  // TODO: implement user draggable drawer width

  return (
    <MUIDrawer
      anchor='right'
      variant='persistent'
      open={ open }
      PaperProps={{
        style: {
          width: '50vw',
          marginRight: toolbarWidth
        }
      }} >
      <DrawerPadding />
      <ErrorBoundary>
        { children }
      </ErrorBoundary>
    </MUIDrawer>);
}

function DrawerPadding() {
  const classes = useStyles();
  return (
    <Fragment>
      { (process.env.NODE_ENV == 'development' && <div className={ classes.message }/>) }
      <div className={ classes.appbar } />
    </Fragment>);
}

export default PaneToolbarDrawer;
