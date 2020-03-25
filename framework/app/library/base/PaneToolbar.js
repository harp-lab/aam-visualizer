import React, { Fragment, forwardRef } from 'react';
import { Drawer as MUIDrawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message
}));

/**
 * toolbar within Pane element
 * @param {Object} props 
 * @param {Function} ref ref callback passed to Paper
 */
function PaneToolbar(props, ref) {

  // TODO: make toolbar and drawers local to panel (nested within)

  const { children } = props;

  return (
      <MUIDrawer
        anchor='right'
        variant='permanent'
        open={ true }
        PaperProps={{ ref }}>
        <DrawerPadding />
        { children }
      </MUIDrawer>);
}

export default forwardRef(PaneToolbar);

function DrawerPadding() {
  const classes = useStyles();
  return (
    <Fragment>
      { (process.env.NODE_ENV == 'development' && <div className={ classes.message }/>) }
      <div className={ classes.appbar } />
    </Fragment>);
}
