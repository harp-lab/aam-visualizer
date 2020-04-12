import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Loading } from 'library/base';
import { downloadProject } from 'store/apis';
import { getSelectedProjectId, getProjectServerStatus, getProjectClientStatus } from 'store/selectors';
import {
  EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS,
  CLIENT_DOWNLOADED_STATUS, CLIENT_LOCAL_STATUS
} from 'store/consts';

import { EditorLayout, ProjectLayout } from 'extensions/layouts';

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
      viewElement = <EditorLayout />;
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

  let view;
  switch (clientStatus) {
    case CLIENT_DOWNLOADED_STATUS:
    case CLIENT_LOCAL_STATUS:
      view = <ProjectLayout />;
      break;
    default:
      view = <Loading status='Downloading' />;
      break;
  }

  return view;
}

export default Project;
