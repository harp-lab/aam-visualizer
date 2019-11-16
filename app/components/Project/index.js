import React, { Fragment, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Drawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { BugReport } from '@material-ui/icons';
import { CodeViewer, ConfigViewer, EnvViewer, StackViewer } from 'component-viewers';
import { Loading, IconButton, Pane, SplitPane } from 'library';
import { downloadProject } from 'store-apis';
import { getSelectedProjectId, getProjectServerStatus, getProjectClientStatus } from 'store-selectors';
import { EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS } from 'store-consts';

import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import Graph from './Graph';

const useStyles = makeStyles(theme => ({
  message: theme.mixins.message,
  appbar: theme.mixins.toolbar
}));

function Project() {
  const projectId = useSelector(getSelectedProjectId);
  const status = useSelector(getProjectServerStatus);
  const dispatch = useDispatch();
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    download();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);
  useEffect(() => {
    switch (status) {
      case PROCESS_STATUS:
        download();
        break;
    }
  }, [status]);

  async function download() {
    const refresh = await dispatch(downloadProject(projectId));
    if (refresh) timeout.current = setTimeout(download, 1000);
  }

  let viewElement;
  switch (status) {
    case EMPTY_STATUS:
    case EDIT_STATUS:
      viewElement = <Editor edit />;
      break;
    case PROCESS_STATUS:
      viewElement = <Loading status='Processing' />;
      break;
    case COMPLETE_STATUS:
      viewElement = <VisualView />;
      break;
    case ERROR_STATUS:
      viewElement = <Editor error />;
      break;
  };
  return viewElement;
}

function VisualView() {
  const [debug, setDebug] = useState(false);
  const clientStatus = useSelector(getProjectClientStatus);
  const classes = useStyles();

  let view = <Loading status='Downloading' />;
  if (clientStatus.items)
    view = (
      <Fragment>
        <SplitPane vertical>
          <Pane width='40%'><FunctionGraph /></Pane>
          <Pane>
            <SplitPane horizontal>
              <Pane height='48%'>
                <SplitPane vertical>
                  <Pane width='48%' overflow='auto'><CodeViewer /></Pane>
                  <Pane><StackViewer /></Pane>
                </SplitPane>
              </Pane>
              <Pane overflow='auto'>
                <SplitPane>
                  <Pane width="50%" overflow='auto'><ConfigViewer /></Pane>
                  <Pane overflow='auto'><EnvViewer /></Pane>
                </SplitPane>
              </Pane>
            </SplitPane>
          </Pane>
        </SplitPane>
        <Drawer
          anchor='right'
          variant='persistent'
          open={ debug }>
          <Graph
            graphId={ 'states' }
            style={{ minWidth: 400 }}/>
        </Drawer>
        <Drawer
          anchor='right'
          variant='permanent'
          open={ true }>
            { (process.env.NODE_ENV == 'development' && <div className={ classes.message }/>) }
            <div className={ classes.appbar } />
            <IconButton
              icon={ <BugReport /> }
              tooltip='Show debug drawer'
              onClick={ () => setDebug(!debug) } />
        </Drawer>
      </Fragment>);

  return view;
}

export default Project;
