import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import cytoscape from 'cytoscape';

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
      style: { 'background-color': '#3f51b5' }
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
      style: { 'line-color': '#3f51b5' }
    },
    {
      selector: '.highlighted',
      style: { 'background-color': '#fff59d' }
    },
    {
      selector: element => {
        return element.hasClass('highlighted') && element.selected();
      },
      style: { 'background-color': '#ffeb3b' }
    },
    {
      selector: '.hover',
      style: { 'background-color': '#b388ff' }
    }
  ],
  headless: true
};

function Graph(props) {
  const cyRef = useRef(undefined);
  const bounds = useRef(undefined);
  const events = useRef(false);

  config.elements = props.data;
  const cy = useRef(cytoscape(config)).current;

  // event handlers
  ['select', 'unselect', 'mouseover', 'mouseout'].forEach(evt => cy.off(evt));
  cy.on('select', 'node', evt => {
    const node = evt.target;
    if (events.current)
      props.onNodeSelect(node.id());
  });
  cy.on('unselect', 'node', evt => {
    const node = evt.target;
    if (events.current) {
      if (props.selectedNode) {
        events.current = false;
        node.select();
        events.current = true;
      }
    }
  });
  cy.on('mouseover', 'node', evt => {
    const node = evt.target;
    if (props.hoveredNodes !== [node.id()])
      props.onSave(props.graphId, { hoveredNodes: [node.id()] });
  });
  cy.on('mouseout', 'node', evt => { props.onSave(props.graphId, { hoveredNodes: undefined }); });
  
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
  
  // mount/unmount
  useEffect(() => {
    cy.mount(cyRef.current);
    return () => cy.unmount();
  }, []);

  // node positions
  useEffect(() => {
    // load node positions
    const positions = props.positions;
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
      props.data.forEach(node => {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$(`#${nodeId}`).position();
      })
      props.onSave(props.graphId, { positions });
    };
  }, [props.projectId, props.graphId]);

  // resize on bound changes
  useEffect(() => {
    cy.resize();
  }, [bounds.current]);

  // update
  useEffect(() => {
    // mark nodes
    events.current = false;
    cy.batch(() => {
      select([props.selectedNode, props.selectedEdge]);
      addClass(props.highlighted, 'highlighted');
      addClass(props.hoveredNodes, 'hover');
    });
    function select(elementIds) {
      cy.nodes().unselect();
      cy.edges().unselect();
      elementIds.forEach(elementId => {
        if (elementId)
          cy.$(`#${elementId}`).select();
      });
    }
    function addClass(nodeIds, className) {
      cy.nodes().removeClass(className);
      if (nodeIds) {
        nodeIds.forEach(nodeId => {
          cy.$(`#${nodeId}`).addClass(className);
        })
      }
    }
    events.current = true;

    // update bounds
    bounds.current = cyRef.current.getBoundingClientRect();
  });

  return <div
    style={{
      flex: '1 1 1%',
      display: 'block',
      minHeight: 0,
      width: '100%'
    }}
    ref={ cyRef } />;
}

export default Graph;