import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { withTheme } from '@material-ui/styles';
import { GraphData } from 'components/data';
import { PaneMessage } from 'library/base';
import {
  addGraphViewer, removeGraphViewer,
  setFocusedGraph,
  selectNodes, unselectNodes, hoverNodes, selectEdges,
  setPositions
} from 'store/actions'
import { getSelectedProjectId, getProjectAnalysisOutput, getGraph, getGraphRefData, getGraphMetadata, getFocusedGraph } from 'store/selectors';

import cytoscape from 'cytoscape';
import cyHtmlLabel from 'cytoscape-node-html-label';
cyHtmlLabel(cytoscape);

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
    edgePredicate = edge => false, onEdgeSelect, onEdgeUnselect,
    external,
    config,
    layout = { name: 'cose', directed: true },
    htmlLabels = [],
    theme, style } = props;
  const projectId = useSelector(getSelectedProjectId);
  const analOut = useSelector(getProjectAnalysisOutput);
  if (!analOut.graphs[graphId]) return <PaneMessage content={ `'${graphId}' graph undefined` } />;
  const graphData = useSelector(state => getGraph(state, graphId));
  const refData = useSelector(state => getGraphRefData(state, graphId));
  const metadata = useSelector(state => getGraphMetadata(state, graphId));
  const focusedGraph = useSelector(getFocusedGraph);
  const focused = focusedGraph === graphId;
  const dispatch = useDispatch();
  const cyElem = useRef(undefined);
  const bounds = useRef(undefined);
  const events = useRef(false);
  const data = GraphData(graphData, refData);

  const defaultConfig = {
    style: [{
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-wrap': 'wrap'
        }
      }, {
        selector: 'node[entrypoint]',
        style: {
          'shape': 'round-tag',
          'background-color': theme.palette.primary.main
        }
      }, {
        selector: 'node:selected',
        style: { 'background-color': theme.palette.select.main }
      }, {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'curve-style': 'bezier',
          'line-color': getStyle('line-color', theme.palette.grey['500']),
          'line-style': getStyle('line-style', 'solid'),
          'target-arrow-shape': 'triangle',
          'target-arrow-color': getStyle('target-arrow-color', theme.palette.grey['500'])
        }
      }, {
        selector: 'edge:selected',
        style: {
          'line-color': theme.palette.select.main,
          'target-arrow-color': theme.palette.select.main
        }
      }, {
        selector: '.suggested',
        style: { 'background-color': theme.palette.suggest.main }
      }, {
        selector: element => {
          return element.hasClass('suggested') && element.selected();
        },
        style: { 'background-color': theme.palette.suggest.dark }
      }, {
        selector: '.hovered',
        style: { 'background-color': theme.palette.hover.main }
      }
    ],
    headless: true
  };
  function getStyle(prop, defaultStyle) {
    return element => {
      const style = element.data('style');
      if (style && style[prop])
        return style[prop];
      else
        return defaultStyle;
    }
  }

  const cyRef = useRef(cytoscape(config || defaultConfig));
  const cy = cyRef.current;

  const {
    positions,
    selectedNodes = [],
    selectedEdges = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = metadata;

  
  // mount/unmount headless cytoscape
  useEffect(() => {
    cy.mount(cyElem.current);
    return () => cy.unmount();
  }, []);

  useEffect(() => {
    if (focused) {
      document.addEventListener('keydown', keyDown );
      return () => {
        document.removeEventListener('keydown', keyDown )
      }
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
    eventsEnabledRef: events,
    dispatch,
    graphId,
    onNodeSelect, onNodeUnselect,
    onEdgeSelect, onEdgeUnselect, edgePredicate,
    hoveredNodes
  };
  useEffect(() => { refreshEventHandlers(eventHandlerData); }, [graphId]);
  
  // load graph html labels
  useEffect(() => { cy.nodeHtmlLabel(htmlLabels); }, [graphId]);

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

      return () => {
        dispatch(removeGraphViewer(graphId, projectId));
      };
    }
  }, [graphId]);
  
  // marking nodes
  useEffect(() => {
    events.current = false;
    select([...selectedNodes, ...selectedEdges]);
    events.current = true;

    function select(elemIds) {
      elemIds.forEach(elemId => cy.$id(elemId).select());
    }
    function unselect(elemIds) {
      elemIds.forEach(elemId => cy.$id(elemId).unselect())
    }

    return () => {
      events.current = false;
      unselect([...selectedNodes, selectedEdges]);
      events.current = true;
    };
  }, [selectedNodes, selectedEdges]);
  useEffect(() => {
    events.current = false;
    addClass(suggestedNodes, 'suggested');
    events.current = true;
    
    return () => {
      events.current = false;
      removeClass(suggestedNodes, 'suggested');
      events.current = true;
    };
  }, [suggestedNodes]);
  useEffect(() => {
    events.current = false;
    addClass(hoveredNodes, 'hovered');
    events.current = true;

    return () => {
      events.current = false;
      removeClass(hoveredNodes, 'hovered');
      events.current = true;
    };
  }, [hoveredNodes]);

  function addClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        const node = cy.getElementById(nodeId);
        node.addClass(className);
      }
    });
  }
  function removeClass(nodeIds, className) {
    cy.batch(() => {
      for (const nodeId of nodeIds) {
        const node = cy.getElementById(nodeId);
        node.removeClass(className);
      }
    });
  }

  // resize on bound changes
  useEffect(() => {
    cy.resize();
  }, [bounds.current]);

  // update
  useEffect(() => {
    bounds.current = cyElem.current.getBoundingClientRect();
  });

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
