import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setFocusedGraph,
  selectNodes, unselectNodes, hoverNodes, selectEdges,
} from 'store/actions'

import { EVENTS } from './consts';

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 */
function useTapEvent(cy, graphId, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(EVENTS.TAP);
    cy.on(EVENTS.TAP, () => dispatch(setFocusedGraph(graphId)));
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 * @param {Object} eventData.eventsEnabledRef events enabled flag
 * @param {Function} eventData.onNodeSelect node select callback
 * @param {Function} eventData.onEdgeSelect edge select callback
 * @param {Function} eventData.edgePredicate boolean function taking edge and returning if selection allowed
 */
function useSelectEvent(cy, graphId, eventData) {
  const {
    eventsEnabledRef,
    onNodeSelect, onEdgeSelect,
    edgePredicate
  } = eventData;
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(EVENTS.SELECT);
    cy.on(EVENTS.SELECT, 'node', evt => {
      if (eventsEnabledRef.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(selectNodes(graphId, [nodeId]));
        if (onNodeSelect)
          onNodeSelect(nodeId);
      }
    });
    cy.on(EVENTS.SELECT, 'edge', evt => {
      if (eventsEnabledRef.current) {
        const edge = evt.target;
        if (edgePredicate(edge)) {
          const edgeId = edge.id();
          dispatch(selectEdges(graphId, [edgeId]));
          if (onEdgeSelect)
            onEdgeSelect(edgeId);
        } else
          edge.unselect();
      }
    });
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 * @param {Object} eventData.eventsEnabledRef events enabled flag
 * @param {Function} eventData.onNodeUnselect node unselect callback
 * @param {Function} eventData.onEdgeUnselect edge unselect callback
 */
function useUnselectEvent(cy, graphId, eventData) {
  const {
    eventsEnabledRef,
    onNodeUnselect, onEdgeUnselect
  } = eventData;
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(EVENTS.UNSELECT);
    cy.on(EVENTS.UNSELECT, 'node', evt => {
      if (eventsEnabledRef.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(unselectNodes(graphId, [nodeId]));
        if (onNodeUnselect)
          onNodeUnselect(nodeId);
      }
    });
    cy.on(EVENTS.UNSELECT, 'edge', evt => {
      if (eventsEnabledRef.current) {
        const edge = evt.target;
        const edgeId = edge.id();
        dispatch(selectEdges(graphId, []));
        if (onEdgeUnselect)
          onEdgeUnselect(edgeId);
      }
    });
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 */
function useMouseoverEvent(cy, graphId, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(EVENTS.MOUSEOVER);
    cy.on(EVENTS.MOUSEOVER, 'node', evt => {
      const node = evt.target;
      const nodeId = node.id();
      dispatch(hoverNodes(graphId, [nodeId]));
    });
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 */
function useMouseoutEvent(cy, graphId, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(EVENTS.MOUSEOUT);
    cy.on(EVENTS.MOUSEOUT, 'node', evt => {
      dispatch(hoverNodes(graphId, []));
    });
  }, [graphId]);
}

/**
 * refresh cytoscape instance event handlers
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 */
export default function useEventHandlers(cy, graphId, eventData) {
  useTapEvent(cy, graphId, eventData);
  useSelectEvent(cy, graphId, eventData);
  useUnselectEvent(cy, graphId, eventData);
  useMouseoverEvent(cy, graphId, eventData);
  useMouseoutEvent(cy, graphId, eventData);
}
