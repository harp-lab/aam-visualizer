import React from 'react';
import { Pane, PaneContent, PaneToolbar, SplitPane } from 'library/base';
import { DebugDrawer, GraphDrawer } from 'drawers';
import { CodeViewer, ConfigViewer, EnvViewer, FunctionGraph, StackViewer } from 'viewers';

function ProjectLayout() {
  return (
    <Pane>
      <PaneContent>
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
      </PaneContent>
      <PaneToolbar>
        <GraphDrawer />
        <DebugDrawer />
      </PaneToolbar>
    </Pane>);
}

export default ProjectLayout;
