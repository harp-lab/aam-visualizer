import React, { Component } from 'react';
import cytoscape from 'cytoscape';

const style = {
    flex: '1 1 1%',
    display: 'block',
    minHeight: 0,
    width: '100%'
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
      selector: 'edge',
      style: {
        'label': 'data(label)',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'line-style': getStyle('line-style', 'solid')
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': 'yellow'
      }
    }
  ],
  headless: true,
  wheelSensitivity: 1
};

class Graph extends Component {
  constructor(props) {
    super(props);

    config.elements = this.props.data;
    this.cy = cytoscape(config);
    this.highlight();

    this.cy.on('select', 'node', event => {
      const nodeId = event.target.id();
      if (this.eventsEnabled) { this.props.onNodeSelect(nodeId); }
    });
    this.cy.on('unselect', 'node', event => {
      if (this.eventsEnabled) { this.props.onNodeSelect(undefined); }
    });
    if (this.props.onEdgeSelect) {
      this.cy.on('select', 'edge', event => {
        const edgeId = event.target.id();
        if (this.eventsEnabled) { this.props.onEdgeSelect(edgeId); }
      });
      this.cy.on('unselect', 'edge', event => {
        if (this.eventsEnabled) { this.props.onEdgeSelect(undefined); }
      });
    }
    this.eventsEnabled = false;
  }
  position() {
    if (this.props.positions) {
      this.cy.nodes().positions((element, index) => {
        return this.props.positions[element.data('id')];
      });
      this.cy.fit();
    }
    else
      this.cy.layout({ name: 'cose', directed: true }).run();
  }
  highlight() {
    const highlighted = this.props.highlighted;
    this.cy.batch(() => {
      this.cy.nodes().removeClass('highlighted');
      if (highlighted) {
        highlighted.forEach(nodeId => {
          this.cy.$(`#${nodeId}`).addClass('highlighted');
        });
      }
    });
  }
  save(props) {
    const positions = {};
    props.data.forEach(node => {
      const id = node.data.id;
      positions[id] = this.cy.$(`#${id}`).position();
    });
    props.onSave(props.graphId, { positions });
  }

  componentDidMount() {
    const bounds = this.cyRef.getBoundingClientRect();
    this.height = bounds.height;
    this.width = bounds.width;

    this.cy.mount(this.cyRef);
    this.position();
    this.cy.resize();
    this.eventsEnabled = true;
  }
  componentDidUpdate(prevProps) {
    const projectUpdate = this.props.projectId !== prevProps.projectId;
    const graphUpdate = this.props.graphId !== prevProps.graphId;
    if (projectUpdate || graphUpdate) {
      this.save(prevProps);
      this.cy.nodes().remove();
      this.cy.add(this.props.data);
      this.position();
    }

    this.eventsEnabled = false;
    if (this.props.selected) {
      this.cy.$(`#${prevProps.selected}`).unselect();
      this.cy.$(`#${this.props.selected}`).select();
    }
    this.eventsEnabled = true;

    this.highlight();

    const bounds = this.cyRef.getBoundingClientRect();
    const heightUpdate = bounds.height !== this.height;
    const widthUpdate = bounds.width !== this.width;
    if (heightUpdate || widthUpdate) {
      this.height = bounds.height;
      this.width = bounds.width;
      this.cy.resize();
    }
  }
  componentWillUnmount() {
    this.save(this.props);
    this.cy.unmount();
  }
  render() {
    return <div
        style={ style }
        ref={ (ref) => this.cyRef = ref } />;
  }
}

export default Graph;
