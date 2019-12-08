import React, { Fragment, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CodeViewer, ConfigViewer, EnvViewer, StackViewer } from 'component-viewers';
import { Loading, Pane, SplitPane } from 'library';
import { downloadProject } from 'store-apis';
import { getSelectedProjectId, getProjectServerStatus, getProjectClientStatus } from 'store-selectors';
import { EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS, CLIENT_DOWNLOADED_STATUS } from 'store-consts';

import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import Toolbar from './Toolbar';

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
  const clientStatus = useSelector(getProjectClientStatus);
  const toolbar = useRef(undefined);
  let drawerWidth = 0;
  if (toolbar.current)
    drawerWidth = toolbar.current.children[0].offsetWidth;

  let view = <Loading status='Downloading' />;
  if (clientStatus === CLIENT_DOWNLOADED_STATUS)
    view = (
      <Fragment>
        <SplitPane
          vertical
          style={{ width: `calc(100% - ${drawerWidth}px)` }}>
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
        <Toolbar ref={ toolbar } />
      </Fragment>);

  return view;
}

export default Project;
