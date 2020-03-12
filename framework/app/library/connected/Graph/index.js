import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { withTheme } from '@material-ui/styles';
import { PaneMessage } from 'library/base';
import { addGraphViewer, removeGraphViewer } from 'store/actions'
import { getSelectedProjectId, getGraph, getGraphMetadata, isFocusedGraph } from 'store/selectors';

import cytoscape from 'cytoscape';
import cyHtmlLabel from 'cytoscape-node-html-label';
cyHtmlLabel(cytoscape);

import { cyConfig } from './configs';
import useData from './useData';
import useEventHandlers from './useEventHandlers';
import useSize from './useSize';

/**
 * @param {Object} props 
 * @param {String} props.graphId graph id
 * @param {Function} [props.edgePredicate] edge => predicate, boolean result determines edge selectability
 * @param {Function} [props.onNodeSelect] node select callback
 * @param {Function} [props.onNodeUnselect] node unselect callback
 * @param {Boolean} [props.external] disable graph id active registration
 * @param {Object} [props.config] cytoscape config
 * @param {Object} [props.layout] cytoscape layout
 * @param {Array} [props.htmlLabels] cytoscape html labels
 * @param {Object} style
 */
function Graph(props) {
  const {
    graphId,
    onNodeSelect, onNodeUnselect,
    edgePredicate = edge => false,
    onEdgeSelect, onEdgeUnselect,
    external,
    config,
    layout = { name: 'cose', directed: true },
    htmlLabels = [],
    theme, style } = props;
  const projectId = useSelector(getSelectedProjectId);
  const graphData = useSelector(state => getGraph(state, graphId));

  // check if graph data defined
  if (!graphData)
    return <PaneMessage content={ `'${graphId}' graph undefined` } />;

  const metadata = useSelector(state => getGraphMetadata(state, graphId));
  const {
    selectedNodes = [],
    selectedEdges = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = metadata;
  const focusedGraph = useSelector(state => isFocusedGraph(state, graphId));
  const focused = focusedGraph === graphId;
  const dispatch = useDispatch();
  
  const cyElemRef = useRef(undefined);
  const cyRef = useRef(cytoscape(config || cyConfig(theme)));
  const cy = cyRef.current;
  
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

  // mount/unmount headless cytoscape
  useEffect(() => {
    cy.mount(cyElemRef.current);
    return () => cy.unmount();
  }, []);

  useEffect(() => {
    if (focused) {
      document.addEventListener('keydown', keyDown );
      return () => { document.removeEventListener('keydown', keyDown ); }
    }
  }, [focused]);
  function keyDown(evt) {
    const selectedNodes = cy.$('node:selected');
    switch (evt.key) {
      case 'ArrowLeft':
        const prevNodes = selectedNodes.incomers().nodes();
        if (prevNodes.length == 1) {
          selectedNodes.unselect();
          prevNodes.select();
        }
        break;
      case 'ArrowRight':
        const nextNodes = selectedNodes.outgoers().nodes();
        if (nextNodes.length == 1) {
          selectedNodes.unselect();
          nextNodes.select();
        }
        break;
    }
  }

  // connect event handlers
  const ignoreEvents = useEventHandlers(cy, graphId, {
    onNodeSelect, onNodeUnselect,
    onEdgeSelect, onEdgeUnselect, edgePredicate
  });
  useData(cy, graphId, layout); // connect graph data
  useSize(cyElemRef, cy);
  
  useEffect(() => { cy.nodeHtmlLabel(htmlLabels); }, [graphId]); // load graph html labels
  

  // register active graph id
  useEffect(() => {
    if (!external) {
      dispatch(addGraphViewer(graphId));
      return () => { dispatch(removeGraphViewer(graphId, projectId)); };
    }
  }, [graphId]);
  
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

  return <div
    ref={ cyElemRef }
    style={{
      flex: '1 1 1%',
      display: 'block',
      minHeight: 0,
      width: '100%',
      ...style
    }} />;
}
Graph = withTheme(Graph);
export default Graph;
