import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getGraphMetadata } from 'store/selectors';

export default function useMetadata(cy, graphId, ignoreEvents) {
  const {
    selectedNodes = [],
    selectedEdges = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = useSelector(state => getGraphMetadata(state, graphId));
  /**
   * @param {Array<String>} elemIds cytoscape element ids
   */
  function select(elemIds) {
    elemIds.forEach(elemId => cy.$id(elemId).select());
  }

  /**
   * @param {Array<String>} elemIds cytoscape element ids
   */
  function unselect(elemIds) {
    elemIds.forEach(elemId => cy.$id(elemId).unselect())
  }

  /**
   * @param {Array<String>} nodeIds cytoscape node ids
   * @param {String} className class to add
   */
  function addClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        const node = cy.getElementById(nodeId);
        node.addClass(className);
      }
    });
  }

  /**
   * @param {Array<String>} nodeIds cytoscape node ids
   * @param {String} className class to remove
   */
  function removeClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        const node = cy.getElementById(nodeId);
        node.removeClass(className);
      }
    });
  }

  // mark nodes
  useEffect(() => {
    ignoreEvents(() => select([...selectedNodes, ...selectedEdges]));
    return () => {
      ignoreEvents(() => unselect([...selectedNodes, selectedEdges]))
    };
  }, [selectedNodes, selectedEdges]);
  useEffect(() => {
    ignoreEvents(() => addClass(suggestedNodes, 'suggested'));
    return () => {
      ignoreEvents(() => removeClass(suggestedNodes, 'suggested'));
    };
  }, [suggestedNodes]);
  useEffect(() => {
    ignoreEvents(() => addClass(hoveredNodes, 'hovered'));
    return () => {
      ignoreEvents(() => removeClass(hoveredNodes, 'hovered'));
    };
  }, [hoveredNodes]);
}
