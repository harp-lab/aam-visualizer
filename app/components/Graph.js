import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { connect } from 'react-redux';
import { setFocusedGraph, setGraphMetadata } from '../redux/actions'
import { getProjectItems } from '../redux/selectors/projects';
import { getGraphMetadata, getFocusedGraph } from '../redux/selectors/graphs';

import cytoscape from 'cytoscape';
import withTheme from '@material-ui/styles/withTheme';

import GraphData from './data/Graph';

function Graph(props) {
  const cyElem = useRef(undefined);
  const bounds = useRef(undefined);
  const events = useRef(false);

  const {
    projectId, graphId, data, metadata, focus, theme,
    setGraphMetadata, setFocusedGraph
  } = props;

  const config = {
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-wrap': 'wrap'
        }
      },
      {
        selector: 'node:selected',
        style: { 'background-color': theme.palette.select.main }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-style': getStyle('line-style', 'solid')
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': theme.palette.select.main,
          'target-arrow-color': theme.palette.select.main
        }
      },
      {
        selector: '.suggested',
        style: { 'background-color': theme.palette.suggest.main }
      },
      {
        selector: element => {
          return element.hasClass('suggested') && element.selected();
        },
        style: { 'background-color': theme.palette.suggest.dark }
      },
      {
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
    selectedEdge = [],
    hoveredNodes = [],
    suggestedNodes = []
  } = metadata;

  
  // mount/unmount
  useEffect(() => {
    cy.mount(cyElem.current);

    return () => cy.unmount();
  }, []);

  useEffect(() => {
    if (focus) {
      document.addEventListener('keydown', keyDown );
      return () => {
        document.removeEventListener('keydown', keyDown )
      }
    }
  }, [focus]);
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
    cy.on('tap', () => setFocusedGraph(graphId));
    cy.on('select', 'node', evt => {
      if (events.current) {
        const node = evt.target;
        const nodeId = node.id();
        setGraphMetadata(projectId, graphId, {
          selectedNodes: [...selectedNodes, nodeId]
        });
      }
    });
    cy.on('unselect', 'node', evt => {
      if (events.current) {
        const node = evt.target;
        const nodeId = node.id();
        const newSelectedNodes = selectedNodes.filter(id => id !== nodeId);
        setGraphMetadata(projectId, graphId, {
          selectedNodes: newSelectedNodes
        });
      }
    });
    cy.on('mouseover', 'node', evt => {
      const node = evt.target;
      const nodeId = node.id();
      if (hoveredNodes != [nodeId])
        setGraphMetadata(projectId, graphId, {
          hoveredNodes: [nodeId]
        });
    });
    cy.on('mouseout', 'node', evt => {
      setGraphMetadata(projectId, graphId, {
        hoveredNodes: []
      });
    });
    cy.on('select', 'edge', evt => {
      if (events.current) {
        const edge = evt.target;
        const edgeId = edge.id();
        setGraphMetadata(projectId, graphId, {
          selectedEdges: [edgeId]
        });
        //edge.unselect();
        //props.onEdgeSelect(edge.id());
      }
    });
    cy.on('unselect', 'edge', evt => {
      if (events.current) {
        //props.onEdgeSelect(undefined);
        setGraphMetadata(projectId, graphId, {
          selectedEdges: []
        });
      }
    });
    /*
    if (props.onEdgeSelect) {
      cy.on('select', 'edge', evt => {
        const edge = evt.target;
        if (events.current) {
          edge.unselect();
          props.onEdgeSelect(edge.id());
        }
      });
      cy.on('unselect', 'edge', evt => {
        if (events.current)
          props.onEdgeSelect(undefined);
      });
    } else
      cy.on('select', 'edge', evt => evt.target.unselect());
    */
    
    // add nodes 
    cy.add(data);

    // load node positions
    if (positions) {
      cy.nodes().positions(element => {
        return positions[element.data('id')];
      });
      cy.fit();
    } else
      cy.layout({ name: 'cose', directed: true }).run();
    
    return () => {
      // save node positions
      const positions = {};
      data.forEach(node => {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$id(nodeId).position();
      })
      //props.onSave(graphId, 'positions', positions);
      setGraphMetadata(projectId, graphId, { positions });

      // remove nodes
      cy.nodes().remove();
    };
  }, [projectId, graphId]);
  
  // marking nodes
  useEffect(() => {
    events.current = false;
    select([...selectedNodes, selectedEdge]);
    events.current = true;

    function select(elemIds) {
      elemIds.forEach(elemId => {
        cy.$id(elemId).select();
      });
    }
    function unselect(elemIds) {
      elemIds.forEach(elemId => {
        cy.$id(elemId).unselect();
      })
    }

    return () => {
      events.current = false;
      unselect([...selectedNodes, selectedEdge]);
      events.current = true;
    };
  }, [selectedNodes, selectedEdge]);
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
    const nodes = cy.nodes();
    const idFunc = node => node.id();
    const callback = node => node.addClass(className);
    perfArrayApply(nodes, nodeIds, idFunc, callback);
  }
  function removeClass(nodeIds, className) {
    const nodes = cy.nodes();
    const idFunc = node => node.id();
    const callback = node => node.removeClass(className);
    perfArrayApply(nodes, nodeIds, idFunc, callback);
  }
  function perfArrayApply(array, filter, idFunc, callback) {
    let remElemIds = [...filter];
    let i = 0;
    while (i < array.length && remElemIds.length > 0) {
      const elem = array[i];
      const id = idFunc(elem);
      const index = remElemIds.findIndex(elemId => elemId == id);
      if (index !== -1) {
        remElemIds.splice(index, 1);
        callback(elem);
      }
      i++;
    }
  }

  // resize on bound changes
  useEffect(() => {
    cy.resize();
  }, [bounds.current]);

  // update
  useEffect(() => {
    // update bounds
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
const mapStateToProps = (state, ownProps) => {
  const { graphId } = ownProps;
  const items = getProjectItems(state);
  const data = GraphData(graphId, items);
  const metadata = getGraphMetadata(state, graphId);
  const focusedGraph = getFocusedGraph(state);
  const focused = focusedGraph === graphId;
  return { data, metadata, focused };
};
export default connect(
  mapStateToProps,
  {
    setGraphMetadata,
    setFocusedGraph
  }
)(Graph);
