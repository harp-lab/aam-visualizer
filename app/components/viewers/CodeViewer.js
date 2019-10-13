import React, { useState } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { selectNodes, hoverNodes } from 'store-actions';
import {
  getSelectedAsts, getHoveredAsts, getNodeAsts,
  getMainGraphId, getSubGraphId,
  getGraphSelectedNodes, getGraphHoveredNodes, getGraphNodes, getGraphRefData,
  getProject, getProjectItems
} from 'store-selectors';

import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';
import CodePos from '../data/CodePos';
import indigo from '@material-ui/core/colors/indigo';

import CodeMark from '../data/CodeMark';

function CodeViewer(props) {
  const { code } = useSelector(getProject);
  const graphIds = [useSelector(getMainGraphId), useSelector(getSubGraphId)];
  const items = useSelector(getProjectItems);
  const selected = useSelector(getSelectedAsts);
  const hovered = useSelector(getHoveredAsts);
  const dispatch = useDispatch();

  const rawMarks = {};
  for (const [astId, data] of Object.entries(items.ast)) {
    const { start, end } = data;
    const startPos = new CodePos(start[0], start[1]);
    const endPos = new CodePos(end[0], end[1]);
    rawMarks[astId] = new CodeMark(startPos, endPos);
  }

  function getNodes(graphId) {
    const { graph } = items.graphs[graphId];
    const nodeIds = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      nodeIds.push(nodeId);
      nodeIds.concat(Object.keys(children));
    }
    return nodeIds;
  }
  function getRefData(graphId) {
    switch (graphId) {
      case 'funcs':
        return items.funcs;
      case 'states':
      default:
        return items.configs;
    }
  }
  function addMarks(graphId) {
    const nodeIds = getNodes(graphId);
    const refData = getRefData(graphId);
    for (const nodeId of nodeIds) {
      const astIds = getNodeAsts([nodeId], refData);
      for (const astId of astIds) {
        rawMarks[astId].addNode(graphId, nodeId);
      }
    }
  }
  graphIds.forEach(graphId => addMarks(graphId));



  const [gutterWidth, setGutterWidth] = useState('auto');
  const { theme } = props;

  // filter marks that do not have linked nodes
  const marks = Object.entries(rawMarks)
    .reduce((acc, curVal) => {
      const [id, mark] = curVal;
      const graphIds = Object.keys(mark.nodes);
      if (graphIds.length > 0)
        acc[id] = mark;
      return acc;
    }, {});

  function getMark(line, ch) {
    const pos = new CodePos(line, ch);
    let markId;
    Object.entries(marks).forEach(([currMarkId, currMark]) => {
      if (currMark.has(pos)) {
        if (markId) {
          const mark = marks[markId];
          if (currMark.smallerThan(mark))
            markId = currMarkId;
        } else
          markId = currMarkId;
      }
    });
    return markId;
  }
  function hover(markId) {
    unhover();
    if (markId) {
      for (const [graphId, nodes] of Object.entries(marks[markId].nodes))
        dispatch(hoverNodes(graphId, nodes));
    }
  }
  function unhover() {
    for (const graphId of graphIds)
      dispatch(hoverNodes(graphId, undefined));
  }
  function click(markId) {
    // only select node if unambiguous
    const mark = marks[markId];
    const nodes = mark.nodes;
    const graphIds = Object.keys(mark.nodes)
      .filter(graphId => graphId !== 'funcs');
    if (graphIds.length > 0) {
      const graphId = graphIds[0];
      const graphNodes = nodes[graphId];
      dispatch(selectNodes(graphId, graphNodes));
    }
  }
  

  // compile code into nested array
  const lines = code
    .split(/\r\n|\n/)
    .map(line => {
      return line.match(/\(|\)|\[|\]|\#t|\#f|\w+|\s+/g);
    });
  
  // generate lines
  const element = lines.map((line, lineId) => {
    let ch = 0;

    // make line equal empty space if null
    if (!line)
      line = [' '];
    
    // generate toks
    const lineElement = line.map((tok, tokId) => {
      const tokStart = new CodePos(lineId, ch);
      const tokEnd = new CodePos(lineId, ch + tok.length);
      ch += tok.length;

      // color prims
      const isPrim = tok.match(/lambda|let|if|\#t|\#f/);
      let textColor = 'inherit';
      if (isPrim)
        textColor = indigo[800];

      const hoveredMarks = hovered.map(id => marks[id]);
      const selectedMarks = selected.map(id => marks[id]);
      const hoveredMark = hoveredMarks.find(mark => mark.includes(tokStart, tokEnd));
      const selectedMark = selectedMarks.find(mark => mark.includes(tokStart, tokEnd));

      let content = tok;
      if (hoveredMark) {
        content = <Token 
          content={ tok }
          color={ theme.palette.hover.light } />;
      } else if (selectedMark) {
        content = <Token 
          content={ tok }
          color={ theme.palette.select.light } />;
      }
      
      const markId = getMark(lineId, tokStart.ch);
      return <Span
        key={ tokId }
        content={ content }
        textColor={ textColor }
        onMouseOver={ () => hover(markId) }
        onClick={ () => click(markId) }
        style={{ cursor: 'pointer' }}/>;
    });

    const gutterElement = (
      <div
        style={{
          display: 'inline-block',
          width: gutterWidth,
          fontFamily: 'Roboto Mono, "Courier New", Courier, monospace',
          backgroundColor: theme.palette.grey['200'],
          textAlign: 'right',
          padding: '0 5px'
        }}>
        <Typography
          variant='body2'
          ref={ ref => {
            const lastLine = lineId == lines.length - 1;
            if (ref && lastLine) {
              const bounds = ref.getBoundingClientRect();
              const width = bounds.width;
              if (gutterWidth !== width)
                setGutterWidth(bounds.width);
            }
          }}
          color='textSecondary'>
          { lineId + 1 }
        </Typography>
      </div>);
    
    return (
      <div key={ lineId }>
        { gutterElement }
        <Typography
          onMouseLeave={ () => unhover() }
          variant='body2'
          style={{
            display: 'inline-block',
            verticalAlign: 'bottom',
            fontFamily: 'Roboto Mono, "Courier New", Courier, monospace'
          }}>
          { lineElement }
        </Typography>
      </div>);
  });

  return <div style={{ whiteSpace: 'pre' }}>{ element }</div>;
}
CodeViewer = withTheme(CodeViewer);

function Token(props) {
  const { content, color } = props;
  return <Span
    content={ content }
    color={ color } />;
}

function Span(props) {
  const { content, color, textColor, style, onClick, onMouseOver } = props;
  return (
    <span
      onMouseOver={ onMouseOver }
      onClick={ onClick }
      style={{
        display: 'inline-block',
        backgroundColor: (color || 'inherit'),
        color: (textColor || 'inherit'),
        ...style
      }}>
      { content }
    </span>);
}

export default CodeViewer;

