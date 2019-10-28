import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectNodes, hoverNodes } from 'store-actions';
import {
  getNodeAsts,
  getMainGraphId, getSubGraphId, getGraphNodes, getGraphRefData,
  getProject, getProjectItems
} from 'store-selectors';

import Context from './Context';
import Line from './Line';

function CodeViewer() {
  const { code } = useSelector(getProject);

  const mainGraphId = useSelector(getMainGraphId);
  const mainGraphNodes = useSelector(store => getGraphNodes(store, mainGraphId));
  const mainGraphRef = useSelector(store => getGraphRefData(store, mainGraphId));

  const subGraphId = useSelector(getSubGraphId);
  const subGraphNodes = useSelector(store => getGraphNodes(store, subGraphId));
  const subGraphRef = useSelector(store => getGraphRefData(store, subGraphId));

  const { graphs } = useSelector(getProjectItems);
  const dispatch = useDispatch();
  const graphData = {};
  if (graphs[mainGraphId]) graphData[mainGraphId] = { nodeIds: mainGraphNodes, refData: mainGraphRef };
  if (graphs[subGraphId]) graphData[subGraphId] = { nodeIds: subGraphNodes, refData: subGraphRef };

  const [astNodes, setAstNodes] = useState({});
  const [parsedCode, setParsedCode] = useState({});
  const [gutterWidth, setGutterWidth] = useState('auto');

  useEffect(() => {
    const astNodes = {};
    for (const [graphId, data] of Object.entries(graphData)) {
      const { nodeIds, refData } = data;
      for (const nodeId of nodeIds) {
        const astIds = getNodeAsts([nodeId], refData);
        for (const astId of astIds) {
          if (!astNodes[astId])
            astNodes[astId] = { [graphId]: [nodeId] };
          else if (!astNodes[astId][graphId])
            astNodes[astId][graphId] = [nodeId];
          else
            astNodes[astId][graphId].push(nodeId);
        }
      }
    }
    setAstNodes(astNodes);
  }, [mainGraphId, subGraphId]);

  useEffect(() => {
    const parsedCode = {};
    code.split(/\r\n|\n/)
      .forEach((line, lineId) => {
        let ch = 0;
        const parsedLine = {};
        line.match(/\(|\)|\[|\]|[^\s\(\)\[\]]+|\s+/g)
          .forEach(tok => {
            parsedLine[ch] = tok;
            ch += tok.length;
          });
        parsedCode[lineId] = parsedLine;
      });
    setParsedCode(parsedCode);
  }, [code]);

  function hover(markId) {
    unhover();
    if (markId && astNodes[markId]) {
      for (const [graphId, nodes] of Object.entries(astNodes[markId]))
        dispatch(hoverNodes(graphId, nodes));
    }
  }
  function unhover() {
    for (const graphId of Object.keys(graphData))
      dispatch(hoverNodes(graphId, undefined));
  }
  function click(markId) {
    // only select node if unambiguous
    const nodes = astNodes[markId];
    const graphIds = Object.keys(nodes)
      .filter(graphId => graphId !== 'funcs');
    if (graphIds.length > 0) {
      const graphId = graphIds[0];
      const graphNodes = nodes[graphId];
      dispatch(selectNodes(graphId, graphNodes));
    }
  }

  const codeElem = Object.keys(parsedCode).map(lineId => {
    return <Line
      key={ lineId }
      lineId={ lineId } />;
  });
  return (
    <Context.Provider
      value={{
        astNodes,
        code: parsedCode,
        hover,
        unhover,
        click,
        gutterWidth,
        setGutterWidth
      }}>
      <div style={{ whiteSpace: 'pre' }}>{ codeElem }</div>
    </Context.Provider>);
}

export default CodeViewer;
