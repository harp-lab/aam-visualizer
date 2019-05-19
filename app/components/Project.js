import React, { Component } from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import Graph from './Graph';
import NodeViewer from './NodeViewer';

class Project extends Component {
  constructor(props) {
    super(props);

    const selectedNodeId = undefined;
    const project = this.props.project;
    this.state = { selectedNodeId };
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
    this.select = this.select.bind(this);
    this.saveGraphMetadata = this.saveGraphMetadata.bind(this);
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
  async processCode(code) {
    await this.saveCode(code);
    return fetch(`/api/project?id=${this.props.id}&process`, { method: 'POST' })
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
            const graphTypes = Object.keys(data.graphs)
            .filter(type => type !== 'main');
            project.selectedGraphType = graphTypes[0];
            this.props.onSave(project);
          })
        case 204:
          setTimeout(() => this.getGraphs(), 5000);
          break;
      }
    });
  }
  saveGraphMetadata(graphType, metadata) {
    const project = this.props.project;
    const graph = project.graphs[graphType];
    graph.metadata = metadata;
    this.props.onSave(project);
  }

  select(nodeId) { this.setState({ selectedNodeId: nodeId }); }

  render() {
    let view;
    const project = this.props.project;
    const status = project.status;
    switch (status) {
      case 'empty':
      case 'edit':
        view = <Editor
          data={ project.code }
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
        else {
          const mainGraph = project.graphs.main;
          const subGraph = project.graphs[project.selectedGraphType];
          const subGraphMenuItems = Object.entries(project.graphs)
          .filter(([graphType, graph]) => graphType !== 'main')
          .map(([graphType, graph]) => {
            return <MenuItem key={ graphType } value={ graphType }>{ graphType }</MenuItem>
          });
          const marks = {};
          for (const [id, node] of Object.entries(subGraph.nodes)) {
            if (node.start && node.end)
              marks[id] = { start: node.start, end: node.end };
          }
          const selectedNodeId = this.state.selectedNodeId;

          const mainGraphElement = (
            <Pane height='50%'>
              <Graph
                id={ this.props.id }
                type={ 'main' }
                data={ mainGraph.export() }
                positions={ mainGraph.metadata.positions }
                selected={ selectedNodeId }
                onSelect={ this.select }
                onSave={ this.saveGraphMetadata } />
            </Pane>
          );
          const subGraphElement = (
            <Pane height='50%'>
              <Graph
                id={ this.props.id }
                type={ project.selectedGraphType }
                data={ subGraph.export() }
                positions={ subGraph.metadata.positions }
                selected={ selectedNodeId }
                onSelect={ this.select }
                onSave={ this.saveGraphMetadata } />
              <Select
                value={ project.selectedGraphType }
                onChange={ event => {
                  const project = this.props.project;
                  project.selectedGraphType = event.target.value;
                  this.props.onSave(project);
                } }>
                { subGraphMenuItems }
              </Select>
            </Pane>
          );
          const editorElement = (
            <Pane height='50%'>
              <Editor
                id={ this.props.id }
                type={ project.selectedGraphType }
                data={ project.code }
                marks={ marks }
                selected={ selectedNodeId }
                onSelect={ this.select } />
            </Pane>
          );
          const nodeViewerElement = (
            <Pane height='50%'>
              <NodeViewer data={ subGraph.nodes[selectedNodeId] } />
            </Pane>
          );

          view = (
            <SplitPane vertical>
              <Pane width='50%'>
                <SplitPane horizontal>
                { mainGraphElement }
                { subGraphElement }
                </SplitPane>
              </Pane>
              <Pane width='50%'>
                <SplitPane horizontal>
                  { editorElement }
                  { nodeViewerElement }
                </SplitPane>
              </Pane>
            </SplitPane>);
        }
        break;
      case 'error':
        view = <Editor data={ project.code }/>;
        break;
    };
    return view;
  }
}

export default Project;
