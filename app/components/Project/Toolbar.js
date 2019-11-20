import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { Drawer as MUIDrawer, MenuItem, Select } from '@material-ui/core';
import { BugReport, Share } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { DebugItem, IconButton } from 'library';
import { getGraphIds, getProjectItems } from 'store-selectors';

import Graph from './Graph';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message,
  drawer: {
    marginRight: 30
  }
}));

const GRAPH_DRAWER = 'graph';
const DEBUG_DRAWER = 'debug';

function Toolbar() {
  const { debug } = useSelector(getProjectItems);
  const [open, setOpen] = useState(undefined);

  function toggle(drawer) {
    if (open === drawer) setOpen(undefined);
    else setOpen(drawer);
  }

  return (
    <Fragment>
      <GraphDrawer open={ open === GRAPH_DRAWER } />
      <DebugDrawer open={ open === DEBUG_DRAWER } />
      <MUIDrawer
        anchor='right'
        variant='permanent'
        open={ true }>
          <DrawerPadding />
          <IconButton
            icon={ <Share /> }
            tooltip='Show graph'
            onClick={ () => toggle(GRAPH_DRAWER)} />
          { debug ?
            <IconButton
              icon={ <BugReport /> }
              tooltip='Show debug'
              onClick={ () => toggle(DEBUG_DRAWER)} />
            : null }
      </MUIDrawer>
    </Fragment>);
}

function DebugDrawer(props) {
  const { open } = props;
  const items = useSelector(getProjectItems);
  
  return (
    <Drawer open={ open }>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          margin: '1em'
        }}>
        <DebugItem item={ items } />
      </div>
    </Drawer>);
}
function GraphDrawer(props) {
  const { open } = props;
  const graphs = useSelector(getGraphIds);
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
    <Drawer open={ open }>
      <Select
        value={ graph }
        onChange={ evt => setGraph(evt.target.value) }>
        { graphItems }
      </Select>
      <Graph
        graphId={ graph }
        style={{ width: '50vw' }}/>
    </Drawer>);
}

function Drawer(props) {
  const { open, children } = props;
  const classes = useStyles();
  return (
    <MUIDrawer
      anchor='right'
      variant='persistent'
      open={ open }
      classes={{ paper: classes.drawer }}>
      <DrawerPadding />
      { children }
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

export default Toolbar;
