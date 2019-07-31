import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';
import CodePos from './data/CodePos';
import indigo from '@material-ui/core/colors/indigo';

function CodeViewer(props) {
  const [gutterWidth, setGutterWidth] = useState('auto');
  const { hovered, selected, theme } = props;

  // filter marks that do not have linked nodes
  const marks = {};
  Object.entries(props.marks).forEach(([id, mark]) => {
    if (Object.keys(mark.nodes).length > 0)
      marks[id] = mark;
  });

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
        props.onCodeHover(graphId, nodes);
    }
  }
  function unhover() {
    for (const graphId of props.graphIds)
      props.onCodeHover(graphId, undefined);
  }
  function click(markId) {
    // only select node if unambiguous
    const mark = marks[markId];
    const nodes = mark.nodes;
    const graphIds = Object.keys(mark.nodes);
    if (graphIds.length == 1) {
      const graphId = graphIds[0];
      const graphNodes = nodes[graphId];
      if (graphNodes.length == 1)
        props.onNodeSelect(graphId, graphNodes[0]);
    }
  }
  

  // compile code into nested array
  const lines = props.code
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
      if (selectedMark) {
        content = <Token 
          content={ tok }
          color={ theme.palette.select.light } />;
      } else if (hoveredMark) {
        content = <Token 
          content={ tok }
          color={ theme.palette.hover.light } />;
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
  const {content, color} = props;
  
  return <Span
    content={ content }
    color={ color } />;
}

function Span(props) {
  return (
    <span
      onMouseOver={ props.onMouseOver }
      onClick={ props.onClick }
      style={{
        display: 'inline-block',
        backgroundColor: (props.color || 'inherit'),
        color: (props.textColor || 'inherit'),
        ...props.style
      }}>
      { props.content }
    </span>);
}

export default CodeViewer;
