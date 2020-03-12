import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GraphData } from 'components/data';
import { setPositions } from 'store/actions'
import { getGraph, getGraphRefData, getGraphPositions } from 'store/selectors';

/**
 * connect cytoscape instance data
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} layout cytoscape layout config
 */
export default function useData(cy, graphId, layout) {
  const graphData = useSelector(state => getGraph(state, graphId));
  const refData = useSelector(state => getGraphRefData(state, graphId));
  const positions = useSelector(state => getGraphPositions(state, graphId));
  const dispatch = useDispatch();

  const data = GraphData(graphData, refData);
  useEffect(() => {
    cy.add(data); // load graph data

    // load graph layout
    if (positions) {
      cy.nodes()
        .positions(element => positions[element.data('id')]);
      cy.fit();
    } else
      cy.layout(layout).run();

    return () => {
      // save graph layout
      const positions = {};
      for (const node of data) {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$id(nodeId).position();
      }
      dispatch(setPositions(graphId, positions));

      cy.nodes().remove(); // clear graph data
    };
  }, [graphData]);
}
