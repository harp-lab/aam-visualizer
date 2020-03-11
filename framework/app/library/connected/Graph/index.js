import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { withTheme } from '@material-ui/styles';
import { GraphData } from 'components/data';
import { PaneMessage } from 'library/base';
import { addGraphViewer, removeGraphViewer, setPositions } from 'store/actions'
import { getSelectedProjectId, getGraph, getGraphRefData, getGraphMetadata, isFocusedGraph } from 'store/selectors';

import cytoscape from 'cytoscape';
import cyHtmlLabel from 'cytoscape-node-html-label';
cyHtmlLabel(cytoscape);

import { cyConfig } from './configs';
import { refreshEventHandlers } from './events';

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

  const refData = useSelector(state => getGraphRefData(state, graphId));
  const metadata = useSelector(state => getGraphMetadata(state, graphId));
  const {
    positions,
    selectedNodes = [],
    selectedEdges = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = metadata;
  const focusedGraph = useSelector(state => isFocusedGraph(state, graphId));
  const focused = focusedGraph === graphId;
  const dispatch = useDispatch();
  const bounds = useRef(undefined);
  const eventsEnabledRef = useRef(false);
  const data = GraphData(graphData, refData);
  
  const cyElem = useRef(undefined);
  const cyRef = useRef(cytoscape(config || cyConfig(theme)));
  const cy = cyRef.current;

  /**
   * toggle eventsEnabled flag to disable event handlers while executing callback
   * @param {Function} callback 
   */
  function ignoreEvents(callback) {
    eventsEnabledRef.current = false;
    callback();
    eventsEnabledRef.current = true;
  }
  
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
    cy.mount(cyElem.current);
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

  // load event handlers
  const eventHandlerData = {
    cy,
    eventsEnabledRef,
    dispatch,
    graphId,
    onNodeSelect, onNodeUnselect,
    onEdgeSelect, onEdgeUnselect, edgePredicate
  };
  useEffect(() => { refreshEventHandlers(eventHandlerData); }, [graphId]);
  
  useEffect(() => { cy.nodeHtmlLabel(htmlLabels); }, [graphId]); // load graph html labels

  // load/clear graph data
  useEffect(() => {
    cy.add(data);
    return () => { cy.nodes().remove(); };
  }, [graphId]);

  // load/save node positions
  useEffect(() => {
    if (positions) {
      cy.nodes()
        .positions(element => positions[element.data('id')]);
      cy.fit();
    } else
      cy.layout(layout).run();
    
    return () => {
      const positions = {};
      for (const node of data) {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$id(nodeId).position();
      }
      dispatch(setPositions(graphId, positions));
    };
  }, [graphId]);

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

  useEffect(() => { bounds.current = cyElem.current.getBoundingClientRect(); }); // get current bounds
  useEffect(() => { cy.resize(); }, [bounds.current]); // resize cytoscape on bound changes

  return <div
    ref={ cyElem }
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