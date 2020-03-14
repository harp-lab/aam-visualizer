import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  setFocusedGraph,
  selectNodes, unselectNodes, hoverNodes, selectEdges,
} from 'store/actions'

const TAP_EVENT = 'tap';
const SELECT_EVENT = 'select';
const UNSELECT_EVENT = 'unselect';
const MOUSEOVER_EVENT = 'mouseover';
const MOUSEOUT_EVENT = 'mouseout';

/**
 * connect cytoscape instance event handlers
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} eventData event handler data
 * @returns {Function} calls input function with disabled event handlers
 */
export default function useEventHandlers(cy, graphId, eventData) {
  const enabledRef = useRef(true);

  /**
   * toggle eventsEnabled flag to disable event handlers while executing callback
   * @param {Function} callback 
   */
  function ignoreEvents(callback) {
    enabledRef.current = false;
    callback();
    enabledRef.current = true;
  }

  useTapEvent(cy, graphId, enabledRef, eventData);
  useSelectEvent(cy, graphId, enabledRef, eventData);
  useUnselectEvent(cy, graphId, enabledRef, eventData);
  useMouseoverEvent(cy, graphId, enabledRef, eventData);
  useMouseoutEvent(cy, graphId, enabledRef, eventData);

  return ignoreEvents;
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} enabledRef event enabled flag
 * @param {Object} eventData event handler data
 */
function useTapEvent(cy, graphId, enabledRef, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(TAP_EVENT);
    cy.on(TAP_EVENT, () => dispatch(setFocusedGraph(graphId)));
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} enabledRef events enabled flag
 * @param {Object} eventData event handler data
 * @param {Function} eventData.onNodeSelect node select callback
 * @param {Function} eventData.onEdgeSelect edge select callback
 * @param {Function} eventData.edgePredicate boolean function taking edge and returning if selection allowed
 */
function useSelectEvent(cy, graphId, enabledRef, eventData) {
  const { onNodeSelect, onEdgeSelect, edgePredicate } = eventData;
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(SELECT_EVENT);
    cy.on(SELECT_EVENT, 'node', evt => {
      if (enabledRef.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(selectNodes(graphId, [nodeId]));
        if (onNodeSelect)
          onNodeSelect(nodeId);
      }
    });
    cy.on(SELECT_EVENT, 'edge', evt => {
      if (enabledRef.current) {
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
 * @param {Object} enabledRef events enabled flag
 * @param {Object} eventData event handler data
 * @param {Function} eventData.onNodeUnselect node unselect callback
 * @param {Function} eventData.onEdgeUnselect edge unselect callback
 */
function useUnselectEvent(cy, graphId, enabledRef, eventData) {
  const { onNodeUnselect, onEdgeUnselect } = eventData;
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(UNSELECT_EVENT);
    cy.on(UNSELECT_EVENT, 'node', evt => {
      if (enabledRef.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(unselectNodes(graphId, [nodeId]));
        if (onNodeUnselect)
          onNodeUnselect(nodeId);
      }
    });
    cy.on(UNSELECT_EVENT, 'edge', evt => {
      if (enabledRef.current) {
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
 * @param {Object} enabledRef events enabled flag
 * @param {Object} eventData event handler data
 */
function useMouseoverEvent(cy, graphId, enabledRef, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(MOUSEOVER_EVENT);
    cy.on(MOUSEOVER_EVENT, 'node', evt => {
      const node = evt.target;
      const nodeId = node.id();
      dispatch(hoverNodes(graphId, [nodeId]));
    });
  }, [graphId]);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 * @param {Object} enabledRef events enabled flag
 * @param {Object} eventData event handler data
 */
function useMouseoutEvent(cy, graphId, enabledRef, eventData) {
  const dispatch = useDispatch();

  useEffect(() => {
    cy.off(MOUSEOUT_EVENT);
    cy.on(MOUSEOUT_EVENT, 'node', evt => {
      dispatch(hoverNodes(graphId, []));
    });
  }, [graphId]);
}
