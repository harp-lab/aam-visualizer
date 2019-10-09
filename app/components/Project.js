import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTitle, generatePanels } from 'store-actions';
import { getCode, getData } from 'store-apis';
import { getProject, getSelectedProjectId } from 'store-selectors';

import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import CodeViewer from './CodeViewer';
import ConfigViewer from './ConfigViewer';
import EnvViewer from './EnvViewer';
import KontViewer from './KontViewer';

function Project() {
  const projectId = useSelector(getSelectedProjectId);
  const project = useSelector(getProject);
  const dispatch = useDispatch();
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    const { status, STATUSES, code, items, name } = project.data;
    dispatch(setTitle(name || projectId));
    switch (status) {
      case STATUSES.edit:
        if (code == '')
          dispatch(getCode(projectId));
        break;
      case STATUSES.done:
      case STATUSES.error:
        if (!items)
          getGraphs();
        break;
    }

    return () => {
      dispatch(setTitle(undefined));
      clearTimeout(timeout.current);
    };
  }, []);
  useEffect(() => {
    switch (project.data.status) {
      case 'process':
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
    }
  }, [project.data.status]);

  async function getGraphs() {
    const status = await dispatch(getData(projectId));
    switch (status) {
      case 200: {
        dispatch(generatePanels());
        break;
      }
      case 204: {
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
      }
      default: break;
    }
  }
  function render() {
    const { status, STATUSES, error, items } = project.data;
    let viewElement;
    switch (status) {
      case STATUSES.empty:
      case STATUSES.edit:
        viewElement = <Editor
          processOptions={{ analysis: ['0-cfa', '1-cfa', '2-cfa'] }}
          edit />;
        break;
      case STATUSES.process:
        viewElement = <Loading status='Processing' variant='circular'/>;
        break;
      case STATUSES.done:
        if (!items)
          viewElement = <Loading status='Downloading' variant='circular'/>;
        else
          viewElement = renderVisual();
        break;
      case STATUSES.error:
        viewElement = <Editor
          error
          errorContent={ error } />;
        break;
    };
    return viewElement;
  }
  function renderVisual() {

    return (
        <SplitPane vertical>
          <Pane width='40%'>
            <FunctionGraph />
          </Pane>
          <Pane width='60%'>
            <SplitPane horizontal>
              <Pane height='48%'>
                <SplitPane vertical>
                  <Pane width='48%' overflow='auto'>
                    <CodeViewer />
                  </Pane>
                  <Pane width='52%'>
                    <KontViewer />
                  </Pane>
                </SplitPane>
              </Pane>
              <Pane height='52%' overflow='auto'>
                <SplitPane>
                  <Pane width="50%" overflow='auto'>
                    <ConfigViewer />
                  </Pane>
                  <Pane width="50%" overflow='auto'>
                    <EnvViewer />
                  </Pane>
                </SplitPane>
              </Pane>
            </SplitPane>
          </Pane>
        </SplitPane>);
  }

  return render();
}
export default Project;
