import React, { useState, useEffect, useRef } from 'react';
import Loading from './Loading';
import SplitPane from './SplitPane';
import Pane from './Pane';
import Editor from './Editor';
import FunctionGraph from './FunctionGraph';
import CodeViewer from './CodeViewer';
import ConfigViewer from './ConfigViewer';
import EnvViewer from './EnvViewer';
import KontViewer from './KontViewer';
import ItemContext from './ItemContext';
import CodeMark from './data/CodeMark';

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
        save();
        break;
      case 204:
        timeout.current = setTimeout(() => getGraphs(), 5000);
        break;
      case 412:
        props.onNotify('Project data request rejected');
        break;
    }
  }
  function save() { props.onSave(project) }
  function saveMetadata(data) {
    project.metadata = {...project.metadata, ...data};
    save();
  }
  function saveGraphMetadata(graphId, tag, data) {
    setGraphMetadata(graphId, tag, data);
    save();
  }
  function setGraphMetadata(graphId, tag, data) {
    const graph = project.graphs[graphId];
    graph.save(tag, data);
  }

  function selectNode(graphId, nodeId) {
    const graph = project.graphs[graphId];
    const nodes = graph.load('selectedNodes') || [];
    graph.save('selectedNodes', [...nodes, nodeId]);
    refreshProps();
    save();
  }
  function selectNodes(graphId, nodeIds) {
    const graph = project.graphs[graphId];
    const nodes = graph.load('selectedNodes') || [];
    //graph.save('selectedNodes', [...nodes, ...nodeIds]);
    // TODO this temp fix for codeviewer not having node deselection
    graph.save('selectedNodes', nodeIds);
    refreshProps();
    save();
  }
  function unselectNode(graphId, nodeId) {
    const graph = project.graphs[graphId];
    const nodes = graph.load('selectedNodes') || [];
    const cleanedNodes = nodes.filter(node => node !== nodeId);
    graph.save('selectedNodes', cleanedNodes);
    refreshProps();
    save();
  }
  function selectMainNode(nodeId) {
    const selected = mainGraph.metadata.selectedNodes || [];
    if (nodeId && !selected.includes(nodeId)) {
      // reset selected
      if (subGraph) {
        subGraph.resetSelected();
        props.onSave(project);
      }
      suggestNodes(mainGraphId, undefined);
      selectNode(mainGraphId, nodeId);
    }
  }
  function unselectMainNode(nodeId) { unselectNode(mainGraphId, nodeId) }
  function suggestNodes(graphId, nodeIds) { setGraphMetadata(graphId, 'suggestedNodes', nodeIds) }
  function hoverNodes(graphId, nodeIds) {
    setGraphMetadata(graphId, 'hoveredNodes', nodeIds);
    save();
  }
  function selectEdge(graphId, edgeId) {
    const selectedEdge = edgeId;
    setGraphMetadata(graphId, 'selectedEdge', selectedEdge);

    const graph = project.graphs[graphId];
    const edge = graph.edges[edgeId];
    let suggestedNodeIds;
    if (edge)
      suggestedNodeIds = edge.calls;
    suggestNodes(mainGraphId, suggestedNodeIds);
    save();
  }
  function refreshProps() {
    if (subGraph) {
      refreshConfigs();
      refreshEnvs();
      refreshKonts();
    }
  }
  function refreshConfigs() {
    const selectedNodes = subGraph.load('selectedNodes') || [];
    const selectedConfigIds = selectedNodes;
    const { configs } = project.metadata;
    for (const [configId, config] of Object.entries(configs)) {
      if (selectedConfigIds.includes(configId)) {
        if (project.items.configs[configId].form !== 'not found') // TODO remove check for not adding 'not found' state configs
          config.show();
      } else
        config.hide();
    }
  }
  function refreshEnvs() {
    const { configs, envs } = project.metadata;
    const visibleEnvs = [];
    for (const [configId, config] of Object.entries(configs)) {
      if (config.visible && config.selected) {
        // get states
        const statesIds = project.items.configs[configId].states;
        if (statesIds)
          for (const stateId of statesIds) {
            const state = project.items.states[stateId];
            // get env
            const envId = state.env;
            if (envId)
              visibleEnvs.push(envId);
          }
      }
    }
    for (const [envId, env] of Object.entries(envs)) {
      if (visibleEnvs.includes(envId))
        env.show();
      else
        env.hide();
    }
  }
  function refreshKonts() {
    const { configs, konts } = project.metadata;
    const visibleKonts = [];
    for (const [configId, config] of Object.entries(configs)) {
      if (config.visible && config.selected) {
        const stateIds = project.items.configs[configId].states;
        for (const stateId of stateIds) {
          const kontId = project.items.states[stateId].kont;
          visibleKonts.push(kontId);
        }
      }
    }
    for (const [kontId, kont] of Object.entries(konts)) {
      if (visibleKonts.includes(kontId))
        kont.show();
      else
        kont.hide();
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

    function onShowEnv(envId) {
      const { envs } = project.metadata;
      envs[envId].show();
      saveMetadata(envs);
    }
    function onShowKont(kontId) {
      const { konts } = project.metadata;
      konts[kontId].show();
      saveMetadata(konts);
    }

    const codeViewerElem = renderCodeViewer();
    const configViewerElem = <ConfigViewer
      configs={ project.metadata.configs }
      onHover={ nodeIds => hoverNodes(subGraphId, nodeIds) }
      onSave={ () => saveMetadata({ configs: project.metadata.configs }) }
      onRefresh={ () => {
        refreshEnvs();
        refreshKonts();
      } } />;
    const kontViewerElem = <KontViewer 
      konts={ project.metadata.konts }
      onHover={ nodeIds => hoverNodes(subGraphId, nodeIds) }
      onSave={ () => saveMetadata({ konts: project.metadata.konts }) }
      onShowEnv={ onShowEnv } />;
    const envViewerElem = <EnvViewer
      envs={ project.metadata.envs }
      onAdd={ onShowEnv }
      onSave={ () => saveMetadata({ envs: project.metadata.envs }) } />;

    return (
      <ItemContext.Provider value={ project.items }>
        <SplitPane vertical>
          <Pane width='40%'>
            { graphElement }
          </Pane>
          <Pane width='60%'>
            <SplitPane horizontal>
              <Pane height='48%'>
                <SplitPane vertical>
                  <Pane width='48%' overflow='auto'>
                    { codeViewerElem }
                  </Pane>
                  <Pane width='52%'>
                    { kontViewerElem }
                  </Pane>
                </SplitPane>
              </Pane>
              <Pane height='52%' overflow='auto'>
                <SplitPane>
                  <Pane width="50%" overflow='auto'>
                    { configViewerElem }
                  </Pane>
                  <Pane width="50%" overflow='auto'>
                    { envViewerElem }
                  </Pane>
                </SplitPane>
              </Pane>
            </SplitPane>
          </Pane>
        </SplitPane>
      </ItemContext.Provider>);
  }
  function renderCodeViewer() {
    let graphIds = [mainGraphId];
    if (subGraph)
      graphIds.push(subGraphId);

    // get marks
    const marks = {};
    for (const [id, data] of Object.entries(project.ast))
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
    
    return <CodeViewer
      id={ projectId }
      graphIds={ graphIds }
      code={ project.code }
      marks={ marks }
      selected={ selected }
      hovered={ hovered }
      onNodesSelect={ selectNodes }
      onCodeHover={ hoverNodes } />;
  }

  return render();
}

export default Project;
