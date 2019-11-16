import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { Drawer as MUIDrawer, MenuItem, Select } from '@material-ui/core';
import { BugReport } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { IconButton } from 'library';
import { getGraphIds } from 'store-selectors';

import Graph from './Graph';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message,
  drawer: {
    marginRight: 30
  }
}));

function Drawer() {
  const [debug, setDebug] = useState(false);

  return (
    <Fragment>
      <DebugDrawer open={ debug } />
      <MUIDrawer
        anchor='right'
        variant='permanent'
        open={ true }>
          <DrawerPadding />
          <IconButton
            icon={ <BugReport /> }
            tooltip='Show debug drawer'
            onClick={ () => setDebug(!debug) } />
      </MUIDrawer>
    </Fragment>);
}

function DebugDrawer(props) {
  const { open } = props;
  const graphs = useSelector(getGraphIds);
  const classes = useStyles();
  const [graph, setGraph] = useState(graphs[0]);

  const graphItems = graphs.map(graphId => {
    return (
    <MenuItem
      key={ graphId }
      value={ graphId }>
      { graphId }
    </MenuItem>);
  });

  return (
    <MUIDrawer
      anchor='right'
      variant='persistent'
      open={ open }
      classes={{ paper: classes.drawer }}>
      <DrawerPadding />
      <Select
        value={ graph }
        onChange={ evt => setGraph(evt.target.value) }>
        { graphItems }
      </Select>
      <Graph
        graphId={ graph }
        style={{ width: '50vw' }}/>
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

export default Drawer;
