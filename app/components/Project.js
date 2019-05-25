import React, { Component } from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import Graph from './Graph';
import PropViewer from './PropViewer';

class Project extends Component {
  constructor(props) {
    super(props);

    const project = this.props.project;
    const highlightedNodeIds = undefined;
    this.state = {
      highlightedNodeIds
    };

    switch (project.status) {
      case project.STATUSES.edit:
      case project.STATUSES.error:
        if (project.code == '')
          this.props.getCode(this.props.id);
        break;
      case project.STATUSES.done:
        if (Object.keys(project.graphs).length == 0)
          this.getGraphs();
        break;
    }

    this.saveCode = this.saveCode.bind(this);
    this.processCode = this.processCode.bind(this);
    this.saveGraphMetadata = this.saveGraphMetadata.bind(this);
    this.selectNode = this.selectNode.bind(this);
    this.selectMainNode = this.selectMainNode.bind(this);
  }
  saveLocalCode(code) {
    const project = this.props.project;
    if (code == '')
      project.status = project.STATUSES.empty;
    else
      project.status = project.STATUSES.edit;
    project.code = code;
    this.props.onSave(project);
  }
  saveCode(code) {
    const project = this.props.project;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        this.saveLocalCode(code);
        return fetch(`/api/project?id=${this.props.id}&save`, {
          method: 'POST',
          body: JSON.stringify({ code })
        });
    }
  }
  async processCode(code, options) {
    await this.saveCode(code);
    return fetch(`/api/project?id=${this.props.id}&process`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
    .then(() => {
      const project = this.props.project;
      project.status = project.STATUSES.process;
      this.props.onSave(project);
      setTimeout(() => this.getGraphs(), 5000);
    });
  }
  getGraphs() {
    return fetch(`/api/project?id=${this.props.id}&data`, { method: 'GET' })
    .then((response) => {
      switch (response.status) {
        case 200:
          return response.json()
          .then((data) => {
            const project = this.props.project;
            project.status = data.status;
            project.code = data.code;
            project.importGraphs(data.graphs);
            this.props.onSave(project);
          })
        case 204:
          setTimeout(() => this.getGraphs(), 5000);
          break;
      }
    });
  }
  saveGraphMetadata(graphId, metadata) {
    const project = this.props.project;
    const graph = project.graphs[graphId];
    graph.metadata = {...graph.metadata, ...metadata};
    this.props.onSave(project);
  }

  selectNode(graphId, nodeId) {
    const selectedNode = nodeId;
    this.saveGraphMetadata(graphId, { selectedNode });
  }
  selectMainNode (nodeId) {
    if (nodeId) {
      // reset selected
      const project = this.props.project;
      const subGraph = project.subGraph;
      if (subGraph) { subGraph.resetSelected(); }

      // reset highlighted
      this.setState({ highlightedNodeIds: undefined });

      this.selectNode(project.mainGraphId, nodeId);
      this.props.onSave(project);
    }
  }
  selectEdge(graphId, edgeId) {
    const selectedEdge = edgeId;
    this.saveGraphMetadata(graphId, { selectedEdge });

    const project = this.props.project;
    const graph = project.graphs[graphId];
    const edge = graph.edges[edgeId];
    let highlightedNodeIds;
    if (edge)
      highlightedNodeIds = edge.calls;
    this.setState({ highlightedNodeIds });
  }

  render() {
    let view;
    const project = this.props.project;
    const status = project.status;
    switch (status) {
      case 'empty':
      case 'edit':
        view = <Editor
          data={ project.code }
          processOptions={ {
            analysis: ['0-cfa', '1-cfa', '2-cfa']
          } }
          onSave={ this.saveCode }
          onProcess={ this.processCode }
          edit />;
        break;
      case 'process':
        view = <Loading status='Processing' variant='circular'/>;
        break;
      case 'done':
        if (Object.keys(project.graphs).length == 0)
          view = <Loading status='Downloading' variant='circular'/>;
        else 
          view = this.renderVisual();
        break;
      case 'error':
        view = <Editor data={ project.code }/>;
        break;
    };
    return view;
  }
  renderVisual() {
    const project = this.props.project;
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.mainGraph;

    const graphElement = this.renderGraph();
    const editorElement = this.renderEditor();

    let element = mainGraph.nodes[mainGraph.metadata.selectedNode];
    // changes if subgraph defined
    const subGraphId = project.subGraphId;
    if (subGraphId) {
      // view subgraph node props
      const subGraph = project.subGraph;
      element = subGraph.nodes[subGraph.metadata.selectedNode];
    }
    const propViewerElement = (
      <Pane height='50%'>
        <PropViewer data={ element } />
      </Pane>
    );

    return (
      <SplitPane vertical>
        <Pane width='50%'>
          { graphElement }
        </Pane>
        <Pane width='50%'>
          <SplitPane horizontal>
            { editorElement }
            { propViewerElement }
          </SplitPane>
        </Pane>
      </SplitPane>);
  }
  renderGraph() {
    const project = this.props.project;
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.graphs[mainGraphId];
    let graph;
    switch (mainGraphId) {
      case 'funcs':
        graph = this.renderFunctionGraph();
        break;
      default:
        graph = <Graph
          projectId={ this.props.id }
          graphId={ mainGraphId }
          data={ mainGraph.export() }
          positions={ mainGraph.metadata.positions }
          selectedNode={ mainGraph.metadata.selectedNode }
          onNodeSelect={ nodeId => this.selectNode(mainGraphId, nodeId) }
          onSave={ this.saveGraphMetadata } />;
        break;
    }
    
    const menuItems = Object.entries(project.graphs)
    //.filter(([graphId, graph]) => graphId !== 'main')
    .map(([graphId, graph]) => {
      return <MenuItem key={ graphId } value={ graphId }>{ graphId }</MenuItem>
    });

    return (
      <React.Fragment>
        <Select
          value={ project.mainGraphId }
          onChange={ event => {
            project.mainGraphId = event.target.value;
            this.props.onSave(project);
          } }>
          { menuItems }
        </Select>
        { graph }
      </React.Fragment>
    );
  }
  renderFunctionGraph() {
    const project = this.props.project;

    // render main graph
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.mainGraph;
    const mainGraphElement = (
      <Pane height='50%'>
        <Graph
          projectId={ this.props.id }
          graphId={ mainGraphId }
          data={ mainGraph.export() }
          positions={ mainGraph.metadata.positions }
          selectedNode={ mainGraph.metadata.selectedNode }
          highlighted={ this.state.highlightedNodeIds }
          onNodeSelect={ this.selectMainNode }
          onSave={ this.saveGraphMetadata } />
      </Pane>
    );

    // render subgraph
    let subGraphElement;
    const subGraphId = project.subGraphId;
    if (subGraphId) {
      const subGraph = project.graphs[subGraphId];
      subGraphElement = (
        <Pane height='50%'>
          <Graph
            projectId={ this.props.id }
            graphId={ subGraphId }
            data={ subGraph.export() }
            positions={ subGraph.metadata.positions }
            selectedNode={ subGraph.metadata.selectedNode }
            selectedEdge={ subGraph.metadata.selectedEdge }
            onNodeSelect={ nodeId => this.selectNode(subGraphId, nodeId) }
            onEdgeSelect={ edgeId => {
                const edge = subGraph.edges[edgeId];
                if (!edgeId || edge.calls)
                  this.selectEdge(subGraphId, edgeId);
            } }
            onSave={ this.saveGraphMetadata } />
        </Pane>
      );
    }
    else {
      // placeholder if no subgraph
      subGraphElement = (
        <Pane
          height='50%'
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Typography variant='h6'>
            No subgraph available
          </Typography>
        </Pane>
      );
    }

    return  (
      <SplitPane horizontal>
        { mainGraphElement }
        { subGraphElement }
      </SplitPane>
    );
  }
  renderEditor() {
    const project = this.props.project;
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.mainGraph;

    const marks = {};
    for (const [id, node] of Object.entries(mainGraph.nodes)) {
      if (node.start && node.end)
        marks[id] = {
          start: node.start,
          end: node.end,
          graphId: mainGraphId
        };
    }
    let editorElement = (
      <Pane height='50%'>
        <Editor
          id={ this.props.id }
          type={ mainGraphId }
          data={ project.code }
          marks={ marks }
          selected={ mainGraph.metadata.selectedNode }
          onNodeSelect={ this.selectNode } />
      </Pane>
    );

    // change editor if subgraph defined
    const subGraphId = project.subGraphId;
    if (project.subGraphId) {
      const subGraph = project.subGraph;

      // include subgraph marks
      for (const [id, node] of Object.entries(subGraph.nodes)) {
        if (node.start && node.end)
          marks[id] = {
            start: node.start,
            end: node.end,
            graphId: subGraphId
          };
      }

      // editor
      editorElement = (
        <Pane height='50%'>
          <Editor
            id={ this.props.id }
            type={ subGraphId }
            data={ project.code }
            marks={ marks }
            selected={ subGraph.metadata.selectedNode }
            onNodeSelect={ (graphId, nodeId) => {
              if (graphId == mainGraphId)
                this.selectMainNode(nodeId);
              else
                this.selectNode(graphId, nodeId);
            } } />
        </Pane>
      );
    }

    return editorElement;
  }
}

export default Project;
