import React from 'react';
import { useSelector } from 'react-redux';
import { Pane, SplitPane } from 'library/base';
import { Graph } from 'library/connected';
import { getMainGraphId, getSubGraphId } from 'fext/store/selectors';

import GraphLabel from './GraphLabel';

/** FunctionGraph component */
function FunctionGraph() {
  const mainGraphId = useSelector(getMainGraphId);
  const subGraphId = useSelector(getSubGraphId);

  return  (
    <SplitPane horizontal>
      <Pane height='50%'>
        <GraphLabel graphId={ mainGraphId } />
        <Graph graphId={ mainGraphId } />
      </Pane>
      <Pane height='50%'>
        <GraphLabel graphId={ subGraphId } />
        <Graph
          graphId={ subGraphId }
          edgePredicate={ edge => {
            const style = edge.data('style');
            if (style) return style['line-style'] === 'dashed';
            return false;
          }} />
      </Pane>
    </SplitPane>);
}

export default FunctionGraph;
