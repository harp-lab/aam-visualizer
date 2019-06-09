import React, { Component } from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
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
      highlightedNodeIds,
    };

    switch (project.status) {
      case project.STATUSES.edit:
        if (project.code == '')
          this.props.getCode(this.props.id);
        break;
      case project.STATUSES.done:
      case project.STATUSES.error:
        if (Object.keys(project.graphs).length == 0)
          this.getGraphs();
        break;
    }
    this.historyEnabled = true;

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
  async saveCode(code) {
    const project = this.props.project;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        this.saveLocalCode(code);
        await fetch(`/api/projects/${this.props.id}/save`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
    }
  }
  async processCode(code, options) {
    await this.saveCode(code);
    const res = await fetch(`/api/projects/${this.props.id}/process`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    switch (res.status) {
      case 200:
        const project = this.props.project;
        project.status = project.STATUSES.process;
        this.props.onSave(project);
        setTimeout(() => this.getGraphs(), 5000);
        break;
      case 412:
        this.props.onNotify('Project process request rejected');
        break;
    }
  }
  async getGraphs() {
    const res = await fetch(`/api/projects/${this.props.id}/data`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const project = this.props.project;
        project.status = data.status;
        project.error = data.error;
        project.code = data.code;
        if (project.status == project.STATUSES.done) {
          project.importGraphs(data.graphs);
          project.store = data.store;
        }
        project.analysis = data.analysis
        this.props.onSave(project);
        break;
      case 204:
        setTimeout(() => this.getGraphs(), 5000);
        break;
      case 412:
        this.props.onNotify('Project data request rejected');
        break;
    }
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
    // TODO
    this.addHistory();
  }
  unselectNode(graphId, nodeId) {
    const selectedNode = undefined;
    this.saveGraphMetadata(graphId, { selectedNode });
  }
  selectMainNode(nodeId) {
    const project = this.props.project;
    if (nodeId && nodeId !== project.mainGraph.metadata.selectedNode) {
      // reset selected
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
  addHistory() {
    if (this.historyEnabled) {
      const project = this.props.project;
      const graphId = project.mainGraphId;
  
      const metadata = project.mainGraph.metadata;
      if (!metadata.history)
        metadata.history = [];
      const data = {
        mainNodeId: project.mainGraph.metadata.selectedNode,
        subNodeId: (project.subGraph && project.subGraph.metadata.selectedNode)
      };
      metadata.history.push(data);
  
      this.saveGraphMetadata(graphId, { history: metadata.history });
    }
  }
  history(index) {
    this.historyEnabled = false;
    const project = this.props.project;
    const graphId = project.mainGraphId;
    const subGraphId = project.subGraphId;

    const metadata = project.mainGraph.metadata;
    const record = metadata.history[index];
    metadata.history = metadata.history.slice(0, index + 1);
    this.selectMainNode(record.mainNodeId);
    if (record.subNodeId)
      this.selectNode(subGraphId, record.subNodeId);
    this.saveGraphMetadata(graphId, { history: metadata.history });
    this.historyEnabled = true;
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
        view = <Editor
          data={ project.code }
          error
          errorContent={ project.error } />;
        break;
    };
    return view;
  }
  renderVisual() {
    const historyElement = this.renderHistory();
    const selectElement = this.renderSelect();
    const graphElement = this.renderGraph();
    const editorElement = this.renderEditor();
    const propViewerElement =this.renderPropViewer();

    return (
      <SplitPane vertical>
        <Pane width='50%'>
          { selectElement }
          { historyElement }
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
  renderHistory() {
    const history = this.props.project.mainGraph.metadata.history;
    let links;
    if (history)
      links = history.map((data, index) => {
        const mainNodeId = data.mainNodeId;
        const subNodeId = data.subNodeId;
        let link;
        if (subNodeId)
          link = (
            <Link
              key={ `${mainNodeId}` }
              onClick={ () => this.history(index) }>
              { `${mainNodeId} - ${subNodeId}` }
            </Link>);
        else
          link = (
          <Link
            key={ `${mainNodeId}` }
            onClick={ () => this.history(index) }>
            { mainNodeId }
          </Link>);
        return link;
      });
    return (
      <Breadcrumbs>
        <Typography>History</Typography>
        { links }
      </Breadcrumbs>);
  }
  renderSelect() {
    const project = this.props.project;
    const menuItems = Object.entries(project.graphs)
    .filter(([graphId, graph]) => !graph.hasOwnProperty('subGraphType'))
    .map(([graphId, graph]) => {
      return <MenuItem key={ graphId } value={ graphId }>{ graphId }</MenuItem>
    });
    return (
      <Select
        value={ project.mainGraphId }
        onChange={ event => {
          project.mainGraphId = event.target.value;
          this.props.onSave(project);
        } }>
        { menuItems }
      </Select>);
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
          onNodeUnselect={ nodeId => this.unselectNode(mainGraphId, nodeId) }
          onSave={ this.saveGraphMetadata } />;
        break;
    }

    return graph;
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
          onNodeUnselect={ nodeId => this.selectMainNode(undefined) }
          onSave={ this.saveGraphMetadata } />
      </Pane>);

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
            onNodeUnselect={ nodeId => this.unselectNode(subGraphid, nodeId) }
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
    if (subGraphId) {
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
  renderPropViewer() {
    const project = this.props.project;
    const mainGraph = project.mainGraph;

    let element = mainGraph.nodes[mainGraph.metadata.selectedNode];
    // changes if subgraph defined
    const subGraphId = project.subGraphId;
    if (subGraphId) {
      // view subgraph node props
      const subGraph = project.subGraph;
      element = subGraph.nodes[subGraph.metadata.selectedNode];
    }
    return (
      <Pane height='50%' overflow='auto'>
        <PropViewer data={ element } store={ this.props.project.store } />
      </Pane>);
  }
}

export default Project;
