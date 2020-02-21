import React, { Fragment, useState, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { Drawer as MUIDrawer, MenuItem, Select } from '@material-ui/core';
import { BugReport, Share } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { DebugItem, ErrorBoundary, IconButton } from 'library/base';
import { Graph } from 'library/connected';
import { getGraphIds, getProjectItems } from 'store-selectors';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message,
  drawer: {
    marginRight: 30
  }
}));

const GRAPH_DRAWER = 'graph';
const DEBUG_DRAWER = 'debug';

function Toolbar(props, ref) {
  const { debug } = useSelector(getProjectItems);
  const [open, setOpen] = useState(undefined);

  function toggle(drawer) {
    if (open === drawer) setOpen(undefined);
    else setOpen(drawer);
  }

  let debugButton;
  if (debug)
    debugButton = <IconButton
      icon={ <BugReport /> }
      tooltip='Show debug'
      onClick={ () => toggle(DEBUG_DRAWER)} />;

  return (
    <Fragment>
      <GraphDrawer open={ open === GRAPH_DRAWER } />
      <DebugDrawer open={ open === DEBUG_DRAWER } />
      <MUIDrawer
        ref={ ref }
        anchor='right'
        variant='permanent'
        open={ true }>
          <DrawerPadding />
          <IconButton
            icon={ <Share /> }
            tooltip='Show graph'
            onClick={ () => toggle(GRAPH_DRAWER)} />
          { debugButton }
      </MUIDrawer>
    </Fragment>);
}
export default forwardRef(Toolbar);

function DebugDrawer(props) {
  const { open } = props;
  const items = useSelector(getProjectItems);
  
  return (
    <Drawer open={ open }>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
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
      <Graph graphId={ graph } external style={{ height: '100%' }}/>
    </Drawer>);
}

function Drawer(props) {
  const { open, children } = props;
  const classes = useStyles();

  // TODO: implement user draggable drawer width

  return (
    <MUIDrawer
      anchor='right'
      variant='persistent'
      open={ open }
      classes={{ paper: classes.drawer }}
      PaperProps={{
        style: { width: '50vw' }
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
