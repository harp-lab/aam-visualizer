import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Pane, SplitPane } from 'library/base';
import { Graph } from 'library/connected';
import { suggestNodes } from 'store/actions';
import { getGraph, getSelectedEdges } from 'store/selectors';

import { getMainGraphId, getSubGraphId } from 'fext/store/selectors';

import GraphLabel from './GraphLabel';

/** FunctionGraph component */
function FunctionGraph() {
  const mainGraphId = useSelector(getMainGraphId);
  const subGraphId = useSelector(getSubGraphId);
  const dispatch = useDispatch();

  function refresh() {
    return function(dispatch, getState) {
      const state = getState();
      const { graph } = getGraph(state, subGraphId);
      const mainGraphId = getMainGraphId(state);
      const edgeIds = getSelectedEdges(state, subGraphId);

      const suggestedNodes = new Set();
      for (const edgeId of edgeIds) {
        const [nodeId, childId] = edgeId.split('-');
        const edgeData = graph[nodeId][childId];
        const { calls } = edgeData;
        if (calls)
          for (const nodeId of calls) {
            suggestedNodes.add(nodeId);
          }
      }
      dispatch(suggestNodes(mainGraphId, [...suggestedNodes]));
    };
  }

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
          }}
          onEdgeSelect={ () => dispatch(refresh()) }
          onEdgeUnselect={ () => dispatch(refresh()) } />
      </Pane>
    </SplitPane>);
}



export default FunctionGraph;
