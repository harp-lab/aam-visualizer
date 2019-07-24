import React, { useState, useEffect, useRef } from 'react';
import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import CodeViewer from './CodeViewer';
import PropViewer from './PropViewer';
import Context from './Context';
import CodeMark from './data/CodeMark';
import Config from './data/Config';
import Env from './data/Env';

function Project(props) {
  const { userId, projectId, project } = props;
  const { mainGraphId, mainGraph, subGraphId, subGraph } = project;
  const timeout = useRef(undefined);
  const [focusedGraph, setFocusedGraph] = useState(undefined);

  // mount/unmount
  useEffect(() => {
    const { status, STATUSES, graphs, code } = project;
    switch (status) {
      case STATUSES.edit:
        if (code == '')
          props.getCode(projectId);
        break;
      case STATUSES.done:
      case STATUSES.error:
        if (Object.keys(graphs).length == 0)
          getGraphs();
        break;
    }

    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  async function saveCode(code) {
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        project.status = project.STATUSES.edit;
        if (code == '')
          project.status = project.STATUSES.empty;
        project.code = code;
        props.onSave(project);
        await fetch(`/api/${userId}/projects/${projectId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        break;
    }
  }
  async function processCode(code, options) {
    await saveCode(code);
    const res = await fetch(`/api/${userId}/projects/${projectId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    switch (res.status) {
      case 200:
        project.status = project.STATUSES.process;
        props.onSave(project);
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
      case 412:
        props.onNotify('Project process request rejected');
        break;
    }
  }
  async function getGraphs() {
    const res = await fetch(`/api/${userId}/projects/${projectId}/data`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        project.import(data);
        props.onSave(project);
        break;
      case 204:
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
      case 412:
        props.onNotify('Project data request rejected');
        break;
    }
  }
  function saveMetadata(data) {
    project.metadata = {...project.metadata, ...data};
    props.onSave(project);
  }
  function saveGraphMetadata(graphId, metadata) {
    const graph = project.graphs[graphId];
    graph.metadata = {...graph.metadata, ...metadata};
    props.onSave(project);
  }

  function selectNode(graphId, nodeId) {
    const graph = project.graphs[graphId];
    const nodes = graph.load('selectedNodes') || [];
    graph.save('selectedNodes', [...nodes, nodeId]);
    props.onSave(project);

    /*addConfig(graphId, nodeId);
    add(mainGraphId, mainGraph);
    if (subGraph)
      add(subGraphId, subGraph);
    function add(graphId, graph) {
      const nodes = graph.load('selectedNodes') || [];
      nodes.forEach(nodeId => addConfig(graphId, nodeId));
    }*/
  }
  function unselectNode(graphId, nodeId) {
    //cleanConfigs();
    cleanEnvs();
    const graph = project.graphs[graphId];
    const nodes = graph.load('selectedNodes') || [];
    const cleanedNodes = nodes.filter(node => node !== nodeId);
    graph.save('selectedNodes', cleanedNodes);
    props.onSave(project);
  }
  function selectMainNode(nodeId) {
    const selected = mainGraph.metadata.selectedNodes || [];
    if (nodeId && !selected.includes(nodeId)) {
      // reset selected
      if (subGraph) {
        subGraph.resetSelected();
        props.onSave(project);
      }

      selectNode(mainGraphId, nodeId);
      suggestNodes(mainGraphId, undefined);
    }
  }
  function unselectMainNode(nodeId) { unselectNode(mainGraphId, nodeId) }
  function suggestNodes(graphId, nodeIds) { saveGraphMetadata(graphId, {suggestedNodes: nodeIds}) }
  function hoverNodes(graphId, nodeIds) { saveGraphMetadata(graphId, { hoveredNodes: nodeIds }) }
  function selectEdge(graphId, edgeId) {
    const selectedEdge = edgeId;
    saveGraphMetadata(graphId, { selectedEdge });

    const graph = project.graphs[graphId];
    const edge = graph.edges[edgeId];
    let suggestedNodeIds;
    if (edge)
      suggestedNodeIds = edge.calls;
    suggestNodes(mainGraphId, suggestedNodeIds);
  }
  function addConfig(graphId, nodeId) {
    const configs = project.metadata.configs || [];
    const configId = nodeId;
    let nodeConfig;
    switch (graphId) {
      case 'states':
        nodeConfig = {
          form: project.items.states[nodeId].form,
          states: [nodeId]
        };
        break;
      default:
        nodeConfig = project.items.configs[nodeId];
        break;
    }
    const match = configs.find(config => config.id == configId);
    if (nodeConfig && !match) {
      configs.unshift({
        label: `${graphId}-${nodeId}`,
        id: configId,
        selected: true // default
      });
      saveMetadata({ configs });
    }
  }
  function cleanConfigs() {
    clean('configs');
    const mainNodes = mainGraph.load('selectedNodes') || [];
    mainNodes.forEach(nodeId => addConfig(mainGraphId, nodeId));
    if (subGraph) {
      const subNodes = subGraph.load('selectedNodes') || [];
      subNodes.forEach(nodeId => addConfig(subGraphId, nodeId));
    }
  }
  function cleanEnvs() { clean('envs') }
  function clean(tag) {
    const data = project.metadata[tag];
    if (data) {
      const cleanedData = data.filter(item => item.saved);
      saveMetadata({ [tag]: cleanedData });
    }
  }

  function render() {
    const { status, STATUSES, code, graphs, error } = project;
    let viewElement;
    switch (status) {
      case STATUSES.empty:
      case STATUSES.edit:
        viewElement = <Editor
          data={ code }
          processOptions={{ analysis: ['0-cfa', '1-cfa', '2-cfa'] }}
          onSave={ saveCode }
          onProcess={ processCode }
          edit />;
        break;
      case STATUSES.process:
        viewElement = <Loading status='Processing' variant='circular'/>;
        break;
      case STATUSES.done:
        if (Object.keys(graphs).length == 0)
          viewElement = <Loading status='Downloading' variant='circular'/>;
        else
          viewElement = renderVisual();
        break;
      case STATUSES.error:
        viewElement = <Editor
          data={ code }
          error
          errorContent={ error } />;
        break;
    };
    return viewElement;
  }
  function renderVisual() {
    const graphElement = <FunctionGraph
      projectId={ projectId }
      project={ project }
      focused={ focusedGraph }
      onFocus={ setFocusedGraph }
      onNodeSelect={ selectNode }
      onNodeUnselect={ unselectNode }
      onMainNodeSelect={ selectMainNode }
      onMainNodeUnselect={ unselectMainNode }
      onEdgeSelect={ selectEdge }
      onSave={ saveGraphMetadata } />;
    const codeViewerElem = renderCodeViewer();
    const propViewerElem = renderPropViewer();

    return (
      <Context.Provider value={ project.items }>
        <SplitPane vertical>
          <Pane width='40%'>
            { graphElement }
          </Pane>
          <Pane width='60%'>
            <SplitPane horizontal>
              { codeViewerElem }
              { propViewerElem }
            </SplitPane>
          </Pane>
        </SplitPane>
      </Context.Provider>);
  }
  function renderCodeViewer() {
    let graphIds = [mainGraphId];
    if (subGraph)
      graphIds.push(subGraphId);

    // get marks
    const marks = {};
    for (const [id, data] of Object.entries(project.items.ast))
      marks[id] = new CodeMark(data.start, data.end);
    addMarks(mainGraphId, mainGraph);
    if (subGraph)
      addMarks(subGraphId, subGraph);
    function addMarks(graphId, graph) {
      for (const [id, node] of Object.entries(graph.nodes)) {
        const { asts } = node;
        asts.forEach(ast => {
          if (marks[ast])
            marks[ast].addNode(graphId, id);
        });
      }
    }

    // get asts
    const selected = getAsts('selectedNodes');
    const hovered = getAsts('hoveredNodes');
    function getAsts(tag) {
      let set = getGraphAsts(tag, mainGraph);
      if (subGraph)
        set = new Set([...set, ...getGraphAsts(tag, subGraph)]);
      return [...set];
    }
    function getGraphAsts(tag, graph) {
      const asts = new Set();
      const nodeIds = graph.load(tag) || [];
      nodeIds.forEach(nodeId => {
        graph.nodes[nodeId]
          .asts
          .forEach(ast => asts.add(ast));
      });
      return asts;
    }
    
    return (
      <Pane height='50%' overflow='auto'>
        <CodeViewer
          id={ projectId }
          graphIds={ graphIds }
          code={ project.code }
          marks={ marks }
          selected={ selected }
          hovered={ hovered }
          onNodeSelect={ selectNode }
          onCodeHover={ hoverNodes } />
      </Pane>);
  }
  function renderPropViewer() {
    let { configs, envs } = project.metadata;
    // create metadata if undefined
    if (!configs)
      configs = Object.keys(project.items.configs)
        .map(configId => new Config(configId, configId));
    if (!envs)
      envs = Object.keys(project.items.envs)
        .map(envId => new Env(envId, envId));
    
    // show configs if node selected
    const nodeIds = subGraph.load('selectedNodes') || [];
    const selectedConfigIds = nodeIds;
    configs.forEach(config => {
      if (selectedConfigIds.includes(config.id))
        config.show()
      else
        config.hide();
    });

    return (
      <Pane height='50%' overflow='auto'>
        <PropViewer
          configs={ configs }
          envs={ envs }
          onSave={ saveMetadata } />
      </Pane>);
  }

  return render();
}

export default Project;
