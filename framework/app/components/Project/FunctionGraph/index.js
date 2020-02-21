import React from 'react';
import { useSelector } from 'react-redux';
import { Pane, SplitPane } from 'library';
import { getMainGraphId, getSubGraphId } from 'store-selectors';

import Graph from '../Graph';
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
