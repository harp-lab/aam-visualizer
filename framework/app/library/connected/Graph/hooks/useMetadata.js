import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedNodes, getSelectedEdges, getHoveredNodes, getSuggestedNodes } from 'store/selectors';

export default function useMetadata(cy, graphId, ignoreEvents) {
  const selectedNodes = useSelector(state => getSelectedNodes(state, graphId));
  const selectedEdges = useSelector(state => getSelectedEdges(state, graphId));
  const hoveredNodes = useSelector(state => getHoveredNodes(state, graphId));
  const suggestedNodes = useSelector(state => getSuggestedNodes(state, graphId));

  /**
   * @param {Array<String>} elemIds cytoscape element ids
   */
  async function select(elemIds) {
    cy.batch(() => {
      for (const elemId of elemIds) {
        cy.getElementById(elemId)
          .select();
      }
    });
  }

  /**
   * @param {Array<String>} elemIds cytoscape element ids
   */
  async function unselect(elemIds) {
    cy.batch(() => {
      for (const elemId of elemIds) {
        cy.getElementById(elemId)
          .unselect();
      }
    });
  }

  /**
   * @param {Array<String>} nodeIds cytoscape node ids
   * @param {String} className class to add
   */
  async function addClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        cy.getElementById(nodeId)
          .addClass(className);
      }
    });
  }

  /**
   * @param {Array<String>} nodeIds cytoscape node ids
   * @param {String} className class to remove
   */
  async function removeClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        cy.getElementById(nodeId)
          .removeClass(className);
      }
    });
  }

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
