import React, { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Loading, Pane } from 'library/base';
import { downloadProject } from 'store/apis';
import { getSelectedProjectId, getProjectServerStatus, getProjectClientStatus } from 'store/selectors';
import {
  EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS,
  CLIENT_DOWNLOADED_STATUS, CLIENT_LOCAL_STATUS
} from 'store/consts';

import { ProjectLayout } from 'fext/layouts';

import Editor from './Editor';
import Toolbar from './Toolbar';

function Project() {
  const projectId = useSelector(getSelectedProjectId);
  const serverStatus = useSelector(getProjectServerStatus);
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
    switch (serverStatus) {
      case PROCESS_STATUS:
      case COMPLETE_STATUS:
        download();
        break;
    }
  }, [serverStatus]);

  async function download() {
    const refresh = await dispatch(downloadProject(projectId));
    if (refresh) timeout.current = setTimeout(download, 1000);
  }

  let viewElement;
  switch (serverStatus) {
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
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const test = useCallback(node => {
    if (node)
      setToolbarWidth(node.children[0].offsetWidth);
  }, []);

  let view;
  switch (clientStatus) {
    case CLIENT_DOWNLOADED_STATUS:
    case CLIENT_LOCAL_STATUS:
      view = (
        <Fragment>
          <Pane style={{width: `calc(100% - ${toolbarWidth}px)`}} >
            <ProjectLayout />
          </Pane>
          <Toolbar ref={ test } />
        </Fragment>);
      break;
    default:
      view = <Loading status='Downloading' />;
      break;
  }

  return view;
}

export default Project;
