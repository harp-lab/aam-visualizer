import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setFocusedGraph,
  selectNodes, unselectNodes, hoverNodes, selectEdges,
  setPositions
} from 'store-actions'
import { getProjectItems, getGraphMetadata, getFocusedGraph } from 'store-selectors';

import cytoscape from 'cytoscape';
import withTheme from '@material-ui/styles/withTheme';

import GraphData from './data/Graph';

function Graph(props) {
  const cyElem = useRef(undefined);
  const bounds = useRef(undefined);
  const events = useRef(false);

  const { graphId, edgePredicate, onNodeSelect, onNodeUnselect, theme } = props;
  const items = useSelector(getProjectItems);
  const data = GraphData(graphId, items);
  const metadata = useSelector(state => getGraphMetadata(state, graphId));
  const focusedGraph = useSelector(getFocusedGraph);
  const focused = focusedGraph === graphId;
  const dispatch = useDispatch();

  const config = {
    style: [{
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-wrap': 'wrap'
        }
      }, {
        selector: 'node:selected',
        style: { 'background-color': theme.palette.select.main }
      }, {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-style': getStyle('line-style', 'solid')
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
      let output;
      if (style && style[prop])
        output = style[prop];
      else
        output = defaultStyle;
      return output;
    }
  }
  const cyRef = useRef(cytoscape(config));
  const cy = cyRef.current;

  const {
    positions,
    selectedNodes = [],
    selectedEdges = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = metadata;

  
  // mount/unmount
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

  // graph change
  useEffect(() => {
    // event handlers
    ['tap', 'select', 'unselect', 'mouseover', 'mouseout'].forEach(evt => cy.off(evt));
    cy.on('tap', () => dispatch(setFocusedGraph(graphId)));
    cy.on('select', 'node', evt => {
      if (events.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(selectNodes(graphId, [nodeId]));
        if (onNodeSelect) onNodeSelect(nodeId);
      }
    });
    cy.on('unselect', 'node', evt => {
      if (events.current) {
        const node = evt.target;
        const nodeId = node.id();
        dispatch(unselectNodes(graphId, [nodeId]));
        if (onNodeUnselect) onNodeUnselect(nodeId);
      }
    });
    cy.on('mouseover', 'node', evt => {
      const node = evt.target;
      const nodeId = node.id();
      if (hoveredNodes != [nodeId])
        dispatch(hoverNodes(graphId, [nodeId]));
    });
    cy.on('mouseout', 'node', evt => {
      dispatch(hoverNodes(graphId, []));
    });
    cy.on('select', 'edge', evt => {
      if (events.current) {
        const edge = evt.target;
        if (edgePredicate(edge)) {
          const edgeId = edge.id();
          dispatch(selectEdges(graphId, [edgeId]));
        } else
          edge.unselect();
      }
    });
    cy.on('unselect', 'edge', evt => {
      if (events.current)
        dispatch(selectEdges(graphId, []));
    });
    
    // add nodes 
    cy.add(data);

    // load node positions
    if (positions) {
      cy.nodes()
        .positions(element => positions[element.data('id')]);
      cy.fit();
    } else
      cy.layout({ name: 'cose', directed: true })
        .run();
    
    return () => {
      // save node positions
      const positions = {};
      for (const node of data) {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$id(nodeId).position();
      }
      dispatch(setPositions(graphId, positions));

      // remove nodes
      cy.nodes().remove();
    };
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
    style={{
      flex: '1 1 1%',
      display: 'block',
      minHeight: 0,
      width: '100%'
    }}
    ref={ cyElem } />;
}
Graph = withTheme(Graph);
export default Graph;
