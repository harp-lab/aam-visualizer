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

    const selectedGraphId = undefined;
    const selectedNodeId = undefined;
    const project = this.props.project;
    this.state = { selectedGraphId, selectedNodeId };

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
    graph.metadata = metadata;
    this.props.onSave(project);
  }

  selectNode(graphId, nodeId) {
    const selectedGraphId = graphId;
    const selectedNodeId = nodeId;
    this.setState({ selectedGraphId, selectedNodeId });
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
          const subGraph = project.graphs[project.selectedSubGraphId];
          const subGraphMenuItems = Object.entries(project.graphs)
          .filter(([graphId, graph]) => graphId !== 'main')
          .map(([graphId, graph]) => {
            return <MenuItem key={ graphId } value={ graphId }>{ graphId }</MenuItem>
          });
          const selectedGraphId = this.state.selectedGraphId;
          const selectedNodeId = this.state.selectedNodeId;
          const selectedSubGraphId = project.selectedSubGraphId;

          const mainGraphElement = (
            <Pane height='50%'>
              <Graph
                projectId={ this.props.id }
                graphId={ 'main' }
                data={ mainGraph.export() }
                positions={ mainGraph.metadata.positions }
                selected={ selectedNodeId }
                onNodeSelect={ nodeId => {
                  if (nodeId) {
                    const project = this.props.project;
                    const detail = project.graphs['main'].nodes[nodeId].detail;
                    project.selectedSubGraphId = detail;
                    this.props.onSave(project);
                  }
                  this.selectNode('main', nodeId);
                } }
                onSave={ this.saveGraphMetadata } />
            </Pane>
          );

          let subGraphElement;
          if (subGraph)
            subGraphElement = (
              <Pane height='50%'>
                <Graph
                  projectId={ this.props.id }
                  graphId={ selectedSubGraphId }
                  data={ subGraph.export() }
                  positions={ subGraph.metadata.positions }
                  selected={ selectedNodeId }
                  onNodeSelect={ nodeId => this.selectNode(selectedSubGraphId, nodeId) }
                  onSave={ this.saveGraphMetadata } />
                <Select
                  value={ selectedSubGraphId }
                  onChange={ event => {
                    const project = this.props.project;
                    project.selectedSubGraphId = event.target.value;
                    this.props.onSave(project);
                  } }>
                  { subGraphMenuItems }
                </Select>
              </Pane>
            );
          else
            subGraphElement = (
              <Pane
                height='50%'
                style={{
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Typography variant='h6'>
                  No subgraph selected
                </Typography>
              </Pane>
            );

          const marks = {};
          if (subGraph) {
            for (const [id, node] of Object.entries(subGraph.nodes)) {
              if (node.start && node.end)
                marks[id] = { start: node.start, end: node.end };
            }
          }
          const editorElement = (
            <Pane height='50%'>
              <Editor
                id={ this.props.id }
                type={ selectedSubGraphId }
                data={ project.code }
                marks={ marks }
                selected={ selectedNodeId }
                onNodeSelect={ nodeId => this.selectNode(selectedSubGraphId, nodeId) } />
            </Pane>
          );

          const propViewerElement = (
            <Pane height='50%'>
              <PropViewer data={ (project.graphs[selectedGraphId] && project.graphs[selectedGraphId].nodes[selectedNodeId]) } />
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
                  { propViewerElement }
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
