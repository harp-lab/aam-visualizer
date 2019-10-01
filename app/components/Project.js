import { connect } from 'react-redux';
import { getCode } from '../redux/api/server';
import { getProject } from '../redux/selectors/projects';
import { setProjectData } from '../redux/actions/projects';
import { generateConfigs, generateEnvs, generateKonts } from '../redux/actions/panels';

import React, { useEffect, useRef } from 'react';
import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import CodeViewer from './CodeViewer';
import ConfigViewer from './ConfigViewer';
import EnvViewer from './EnvViewer';
import KontViewer from './KontViewer';
import ItemContext from './ItemContext';

function Project(props) {
  const { userId, projectId, project, getCode, setProjectData, generateConfigs, generateEnvs, generateKonts } = props;
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    const { status, STATUSES, code, items } = project.data;
    switch (status) {
      case STATUSES.edit:
        if (code == '')
          getCode(projectId);
        break;
      case STATUSES.done:
      case STATUSES.error:
        if (!items)
          getGraphs();
        break;
    }

    return () => {
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
    const res = await fetch(`/api/${userId}/projects/${projectId}/data`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        //project.import(data);
        setProjectData(projectId, data);
        generateConfigs();
        generateEnvs();
        generateKonts();


        //save();
        break;
      case 204:
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
      case 412:
        props.onNotify('Project data request rejected');
        break;
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
      <ItemContext.Provider value={ project.items }>
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
        </SplitPane>
      </ItemContext.Provider>);
  }

  return render();
}
const mapStateToProps = state => {
  const project = getProject(state);
  return { project };
};
export default connect(
  mapStateToProps,
  { getCode, setProjectData, generateConfigs, generateEnvs, generateKonts }
)(Project);
