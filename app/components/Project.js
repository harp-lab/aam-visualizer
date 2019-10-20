import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { downloadProject } from 'store-apis';
import { getSelectedProjectId, getProjectServerStatus, getProjectClientStatus } from 'store-selectors';
import { EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS } from 'store-consts';

import { Loading, Pane, SplitPane } from 'library';
import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import { CodeViewer, ConfigViewer, EnvViewer, KontViewer } from './viewers';

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
        timeout.current = setTimeout(download, 5000);
        break;
    }
  }, [status]);
  const download = () => dispatch(downloadProject(projectId));

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

  let view = <Loading status='Downloading' />;
  if (clientStatus.items)
    view = (
      <SplitPane vertical>
        <Pane width='40%'><FunctionGraph /></Pane>
        <Pane>
          <SplitPane horizontal>
            <Pane height='48%'>
              <SplitPane vertical>
                <Pane width='48%' overflow='auto'><CodeViewer /></Pane>
                <Pane><KontViewer /></Pane>
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
      </SplitPane>);

  return view;
}

export default Project;
