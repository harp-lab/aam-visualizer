import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import cytoscape from 'cytoscape';
import withTheme from '@material-ui/styles/withTheme';

function Graph(props) {
  const cyElem = useRef(undefined);
  const bounds = useRef(undefined);
  const events = useRef(false);

  const { graphId, focus, theme } = props;

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
  const metadata = props.metadata;
  const positions = metadata.positions;
  const selectedNodes = metadata.selectedNodes || [];
  const selectedEdge = metadata.selectedEdge;
  const hoveredNodes = metadata.hoveredNodes;
  const suggestedNodes = metadata.suggestedNodes;

  // event handlers
  ['tap', 'select', 'unselect', 'mouseover', 'mouseout'].forEach(evt => cy.off(evt));
  cy.on('tap', () => props.onFocus(graphId));
  cy.on('select', 'node', evt => {
    const node = evt.target;
    if (events.current)
      props.onNodeSelect(node.id());
  });
  cy.on('unselect', 'node', evt => {
    const node = evt.target;
    if (events.current)
      props.onNodeUnselect(node.id());
  });
  cy.on('mouseover', 'node', evt => {
    const node = evt.target;
    if (hoveredNodes !== [node.id()])
      props.onSave(graphId, { hoveredNodes: [node.id()] });
  });
  cy.on('mouseout', 'node', evt => {
    props.onSave(graphId, { hoveredNodes: undefined });
  });
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
    // add nodes 
    cy.add(props.data);

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
      props.data.forEach(node => {
        const nodeId = node.data.id;
        positions[nodeId] = cy.$(`#${nodeId}`).position();
      })
      props.onSave(graphId, { positions });

      // remove nodes
      cy.nodes().remove();
    };
  }, [props.projectId, graphId]);

  // resize on bound changes
  useEffect(() => {
    cy.resize();
  }, [bounds.current]);

  // update
  useEffect(() => {
    // mark nodes
    events.current = false;
    cy.batch(() => {
      select([...selectedNodes, selectedEdge]);
      addClass(suggestedNodes, 'suggested');
      addClass(hoveredNodes, 'hovered');
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
