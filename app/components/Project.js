import React, { useEffect, useRef, createContext } from 'react';
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
import FunctionGraph from './FunctionGraph';
import CodeViewer from './CodeViewer';
import PropViewer from './PropViewer';
import Context from './Context';
import CodeMark from './data/CodeMark';

function Project(props) {
  const project = props.project;
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    switch (project.status) {
      case project.STATUSES.edit:
        if (project.code == '')
          props.getCode(props.id);
        break;
      case project.STATUSES.done:
      case project.STATUSES.error:
        if (Object.keys(project.graphs).length == 0)
          getGraphs();
        break;
    }
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  let historyEnabled = true;

  async function saveCode(code) {
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        project.status = project.STATUSES.edit;
        if (code == '')
          project.status = project.STATUSES.empty;
        project.code = code;
        props.onSave(project);
        await fetch(`/api/projects/${props.id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        break;
    }
  }
  async function processCode(code, options) {
    await saveCode(code);
    const res = await fetch(`/api/projects/${props.id}/process`, {
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
    const res = await fetch(`/api/projects/${props.id}/data`, { method: 'GET' });
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
    saveGraphMetadata(graphId, { selectedNode: nodeId });
    addConfig(graphId, nodeId);
  }
  function unselectNode(graphId, nodeId) {
    cleanConfigs();
    saveGraphMetadata(graphId, { selectedNode: undefined });
  }
  function selectMainNode(nodeId) {
    if (nodeId && nodeId !== project.mainGraph.metadata.selectedNode) {
      // reset selected
      const subGraph = project.subGraph;
      if (subGraph) {
        subGraph.resetSelected();
        props.onSave(project);
      }

      selectNode(project.mainGraphId, nodeId);
      suggestNodes(project.mainGraphId, undefined);
      addHistory();
    }
  }
  function unselectMainNode(nodeId) {
    unselectNode(project.mainGraphId, nodeId);
  }
  function suggestNodes(graphId, nodeIds) { saveGraphMetadata(graphId, {suggestedNodes: nodeIds}); }
  function hoverNodes(graphId, nodeIds) { saveGraphMetadata(graphId, { hoveredNodes: nodeIds }); }
  function selectEdge(graphId, edgeId) {
    const selectedEdge = edgeId;
    saveGraphMetadata(graphId, { selectedEdge });

    const graph = project.graphs[graphId];
    const edge = graph.edges[edgeId];
    let suggestedNodeIds;
    if (edge)
      suggestedNodeIds = edge.calls;
    suggestNodes(project.mainGraphId, suggestedNodeIds);
  }
  function addConfig(graphId, nodeId) {
    const configs = project.metadata.configs || [];
    const configId = nodeId;
    const nodeConfig = project.graphs[graphId].nodes[nodeId].states;
    const match = configs.find(config => config.id == configId);
    if (nodeConfig && !match) {
      configs.unshift({
        label: `${graphId}-${nodeId}`,
        id: configId
      });
      saveMetadata({ configs });
    }
  }
  function cleanConfigs() {
    const configs = project.metadata.configs;
    if (configs) {
      const cleanedConfigs = configs.filter(config => config.saved);
      saveMetadata({ configs: cleanedConfigs });
    }
  }
  function addHistory() {
    if (historyEnabled) {
      const graphId = project.mainGraphId;
  
      // add record to history
      const metadata = project.mainGraph.metadata;
      if (!metadata.history)
        metadata.history = [];
      const data = {
        mainNodeId: project.mainGraph.metadata.selectedNode,
        subNodeId: (project.subGraph && project.subGraph.metadata.selectedNode)
      };
      metadata.history.push(data);
  
      saveGraphMetadata(graphId, { history: metadata.history });
    }
  }
  function history(index) {
    historyEnabled = false;
    const graphId = project.mainGraphId;
    const subGraphId = project.subGraphId;

    // jump to index
    const metadata = project.mainGraph.metadata;
    const record = metadata.history[index];
    metadata.history = metadata.history.slice(0, index + 1);

    // select node
    selectMainNode(record.mainNodeId);
    if (record.subNodeId)
      selectNode(subGraphId, record.subNodeId);
    
    saveGraphMetadata(graphId, { history: metadata.history });
    historyEnabled = true;
  }

  function render() {
    let viewElement;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        viewElement = <Editor
          data={ project.code }
          processOptions={{ analysis: ['0-cfa', '1-cfa', '2-cfa'] }}
          onSave={ saveCode }
          onProcess={ processCode }
          edit />;
        break;
      case project.STATUSES.process:
        viewElement = <Loading status='Processing' variant='circular'/>;
        break;
      case project.STATUSES.done:
        if (Object.keys(project.graphs).length == 0)
          viewElement = <Loading status='Downloading' variant='circular'/>;
        else
          viewElement = renderVisual();
        break;
      case project.STATUSES.error:
        viewElement = <Editor
          data={ project.code }
          error
          errorContent={ project.error } />;
        break;
    };
    return viewElement;
  }
  function renderVisual() {
    const historyElement = renderHistory();
    const selectElement = renderSelect();
    const graphElement = renderGraph();
    const editorElement = renderCodeViewer();
    const propViewerElement = renderPropViewer();

    return (
      <Context.Provider value={ project.items }>
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
        </SplitPane>
      </Context.Provider>);
  }
  function renderHistory() {
    const graphHistory = props.project.mainGraph.metadata.history;
    let links;
    if (graphHistory)
      links = graphHistory.map((data, index) => {
        const mainNodeId = data.mainNodeId;
        return (
          <Link
            key={ `${mainNodeId}` }
            onClick={ () => history(index) }>
            { mainNodeId }
          </Link>);
      });
    
    return (
      <Breadcrumbs>
        <Typography>History</Typography>
        { links }
      </Breadcrumbs>);
  }
  function renderSelect() {
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
          props.onSave(project);
        } }>
        { menuItems }
      </Select>);
  }
  function renderGraph() {
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.graphs[mainGraphId];
    let graphElement;
    switch (mainGraphId) {
      case 'funcs':
        graphElement = <FunctionGraph
          projectId={ props.id }
          project={ props.project }
          onNodeSelect={ selectNode }
          onNodeUnselect={ unselectNode }
          onMainNodeSelect={ selectMainNode }
          onMainNodeUnselect={ unselectMainNode }
          onEdgeSelect={ selectEdge }
          onSave={ saveGraphMetadata } />;
        break;
      default:
        graphElement = <Graph
          projectId={ props.id }
          graphId={ mainGraphId }
          data={ mainGraph.export() }
          metadata={ mainGraph.metadata }
          onNodeSelect={ selectMainNode }
          onSave={ saveGraphMetadata } />;
        break;
    }

    return graphElement;
  }
  function renderCodeViewer() {
    const mainGraphId = project.mainGraphId;
    const mainGraph = project.mainGraph;
    const subGraphId = project.subGraphId;
    const subGraph = project.subGraph;

    let graphIds = [mainGraphId];
    if (subGraphId)
      graphIds.push(subGraphId);

    // generate marks
    const marks = {};
    for (const [id, data] of Object.entries(project.items.ast))
      marks[id] = new CodeMark(data.start, data.end);
    function addMarks(graphId, graph) {
      for (const [id, node] of Object.entries(graph.nodes)) {
        const astLink = node.astLink;
        if (astLink)
          marks[astLink].addNode(graphId, id);
      }
    }
    addMarks(mainGraphId, mainGraph);
    if (subGraphId)
      addMarks(subGraphId, subGraph);

    let selected, selectFunc;
    if (subGraphId) {
      const selectedNode = subGraph.metadata.selectedNode;
      if (selectedNode)
        selected = subGraph.nodes[selectedNode].astLink;
      selectFunc = (graphId, nodeId) => {
        if (graphId == mainGraphId)
          selectMainNode(nodeId);
        else
          selectNode(graphId, nodeId);
      };
    } else {
      const selectedNode = mainGraph.metadata.selectedNode;
      if (selectedNode)
        selected = mainGraph.nodes[selectedNode].astLink;
    }

    // generate hovered asts
    const hoveredSet = new Set();
    function getHoveredAst(graph) {
      const hoveredNodes = graph.metadata.hoveredNodes;
      if (hoveredNodes)
        hoveredNodes.forEach(nodeId => {
          const astId = graph.nodes[nodeId].astLink;
          if (astId)
            hoveredSet.add(astId);
        })
    }
    getHoveredAst(mainGraph);
    if (subGraphId)
      getHoveredAst(subGraph);
    const hovered = Array.from(hoveredSet);
    
    return (
      <Pane height='50%' overflow='auto'>
        <CodeViewer
          id={ props.id }
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
    const mainGraph = project.mainGraph;
    const subGraph = project.subGraph;

    let graph = mainGraph;
    if (subGraph)
      graph = subGraph;
    const element = graph.nodes[graph.metadata.selectedNode];

    return (
      <Pane height='50%' overflow='auto'>
        <PropViewer
          element={ element }
          metadata={ props.project.metadata }
          onSave={ saveMetadata }
          store={ props.project.store } />
      </Pane>);
  }

  return render();
}

export default Project;
