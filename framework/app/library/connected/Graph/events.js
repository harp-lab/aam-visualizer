import {
  setFocusedGraph,
  selectNodes, unselectNodes, hoverNodes, selectEdges,
} from 'store/actions'

import { EVENTS } from './consts';

const HANDLERS = [
  addTapEvent,
  addSelectEvent,
  addUnselectEvent,
  addMouseoverEvent,
  addMouseoutEvent
];

export function refreshEventHandlers(data) {
  const { cy } = data;
  for (const event of Object.values(EVENTS)) {
    cy.off(event);
  }
  for (const handler of HANDLERS) {
    handler(data);
  }
}

function addTapEvent(data) {
  const { cy, dispatch, graphId } = data;
  cy.on(EVENTS.TAP, () => dispatch(setFocusedGraph(graphId)));
}
function addSelectEvent(data) {
  const {
    cy, eventsEnabledRef, dispatch,
    graphId,
    onNodeSelect, edgePredicate, onEdgeSelect
  } = data;
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
}
function addUnselectEvent(data) {
  const {
    cy, eventsEnabledRef, dispatch,
    graphId,
    onNodeUnselect, onEdgeUnselect
  } = data;
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
}
function addMouseoverEvent(data) {
  const { cy, dispatch, graphId } = data;
  cy.on(EVENTS.MOUSEOVER, 'node', evt => {
    const node = evt.target;
    const nodeId = node.id();
    dispatch(hoverNodes(graphId, [nodeId]));
  });
}
function addMouseoutEvent(data) {
  const { cy, dispatch, graphId } = data;
  cy.on(EVENTS.MOUSEOUT, 'node', evt => {
    dispatch(hoverNodes(graphId, []));
  });
}
