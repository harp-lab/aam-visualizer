import React, { Fragment, useState, useCallback, createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { Drawer as MUIDrawer, MenuItem, Select } from '@material-ui/core';
import { BugReport, Share } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { DebugItem, ErrorBoundary, IconButton, Pane } from 'library/base';
import { Graph } from 'library/connected';
import { getGraphIds, getProjectAnalysisOutput } from 'store/selectors';

const useStyles = makeStyles(theme => ({
  appbar: theme.mixins.toolbar,
  message: theme.mixins.message
}));

const Context = createContext(undefined);

const GRAPH_DRAWER = 'graph';
const DEBUG_DRAWER = 'debug';

function Toolbar(props) {
  const { children } = props;
  const [open, setOpen] = useState(undefined);

  const [toolbarWidth, setToolbarWidth] = useState(0);
  const test = useCallback(node => {
    if (node)
      setToolbarWidth(node.children[0].offsetWidth);
  }, []);

  function toggle(drawer) {
    if (open === drawer) setOpen(undefined);
    else setOpen(drawer);
  }

  return (
    <Context.Provider
      value={{
        toolbarWidth
      }}>
      <Pane style={{width: `calc(100% - ${toolbarWidth}px)`}} >
        { children }
      </Pane>
      <MUIDrawer
        ref={ test }
        anchor='right'
        variant='permanent'
        open={ true }>
        <DrawerPadding />
        <GraphDrawer
          open={ open === GRAPH_DRAWER }
          onClick={ () => toggle(GRAPH_DRAWER) } />
        <DebugDrawer
          open={ open === DEBUG_DRAWER }
          onClick={ () => toggle(DEBUG_DRAWER) } />
      </MUIDrawer>
    </Context.Provider>);
}
export default Toolbar;

function DebugDrawer(props) {
  const { open, onClick } = props;
  const analOut = useSelector(getProjectAnalysisOutput);
  const { debug } = analOut;
  
  let debugButton;
  if (debug)
    debugButton = <IconButton
      icon={ <BugReport /> }
      tooltip='Show debug'
      onClick={ onClick } />;
  
  return (
    <Fragment>
      { debugButton }
      <Drawer open={ open }>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            height: '100%',
            margin: '1em'
          }}>
          <DebugItem item={ analOut } />
        </div>
      </Drawer>
    </Fragment>);
}
function GraphDrawer(props) {
  const { open, onClick } = props;
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
    <Fragment>
      <IconButton
        icon={ <Share /> }
        tooltip='Show graph'
        onClick={ onClick } />
      <Drawer open={ open }>
        <Select
          value={ graph }
          onChange={ evt => setGraph(evt.target.value) }>
          { graphItems }
        </Select>
        <Graph graphId={ graph } external style={{ height: '100%' }}/>
      </Drawer>
    </Fragment>);
}

function Drawer(props) {
  const { open, children } = props;
  const { toolbarWidth } = useContext(Context);

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
