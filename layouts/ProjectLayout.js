import React from 'react';
import { CodeViewer, ConfigViewer, EnvViewer, FunctionGraph, StackViewer } from 'viewers';
import { Pane, SplitPane } from 'library/base';

function ProjectLayout() {
  return (
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
    </SplitPane>);
}

export default ProjectLayout;
