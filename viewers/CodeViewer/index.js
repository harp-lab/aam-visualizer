import React, { useState, useEffect } from 'react';
import { batch, useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import { selectNodes, hoverNodes } from 'store/actions';
import {
  getNodeAsts,
  getViewedGraphIds, getGraphNodes, getGraphRefData,
  getProject
} from 'store/selectors';

import Context from './Context';
import Line from './Line';

function CodeViewer() {
  const { analysisInput: code } = useSelector(getProject);
  const graphData = useSelector(getData);
  const dispatch = useDispatch();

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
  }, [graphData]);

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
      batch(() => {
        for (const [graphId, nodes] of Object.entries(astNodes[markId]))
          dispatch(hoverNodes(graphId, nodes));
      });
    }
  }
  function unhover() {
    batch(() => {
      for (const graphId of Object.keys(graphData))
        dispatch(hoverNodes(graphId, undefined));
    });
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
        onHover: hover,
        onUnhover: unhover,
        onClick: click,
        gutterWidth,
        setGutterWidth
      }}>
      <div style={{ whiteSpace: 'pre' }}>{ codeElem }</div>
    </Context.Provider>);
}

const getData = createSelector(
  state => state,
  getViewedGraphIds,
  (state, graphIds) => {
    const graphData = {};
    for (const graphId of Object.keys(graphIds)) {
      const nodeIds = getGraphNodes(state, graphId);
      const refData = getGraphRefData(state, graphId);
      graphData[graphId] = { nodeIds, refData };
    }
    return graphData;
  }
);

export default CodeViewer;
