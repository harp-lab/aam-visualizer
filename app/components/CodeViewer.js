import React, { Fragment, useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';
import CodePos from './data/CodePos';
import indigo from '@material-ui/core/colors/indigo';

function CodeViewer(props) {
  const [gutterWidth, setGutterWidth] = useState('auto');
  const theme = props.theme;

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

      const isPrim = tok.match(/lambda|let|if|\#t|\#f/);
      let textColor = 'inherit';
      if (isPrim)
        textColor = indigo[800];

      const hovered = props.hovered;
      const selected = props.selected;
      const selectedMarks = selected
        .map(id => marks[id]);
      let content = tok;
      if (hovered.length > 0) {
        const hoveredMarks = hovered.map(id => { return marks[id]; });
        content = <Token
          content={ tok }
          marks={ hoveredMarks }
          start={ tokStart }
          end={ tokEnd }
          color={ theme.palette.hover.light  } />;
      } else if (selected.length > 0) {
        content = <Token
          content={ tok }
          marks={ selectedMarks }
          start={ tokStart }
          end={ tokEnd }
          color={ theme.palette.select.light } />;
      }

      const markId = getMark(lineId, tokStart.ch);
      return <Span
        key={ tokId }
        content={content}
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
  const {content, color, start, end} = props;

  // select mark with largest coverage
  const marks = props.marks.sort((a, b) => {
    return b.coverage(start, end) - a.coverage(start, end);
  });
  const mark = marks[0];

  let element;
  if (mark.includes(start, end)) {
    element = <Span
      content={ content }
      color={ color } />;
  } else if (mark.startsIn(start, end)) {
    element = (
      <Fragment>
        { content.substr(0, start.ch) }
        <Span
          content={ content.substr(start.ch) }
          color={ color } />
      </Fragment>);
  } else if (mark.endsIn(start, end)) {
    element = (
      <Fragment>
        <Span
          content={ content.substr(0, end.ch) }
          color={ color } />
        { content.substr(end.ch) }
      </Fragment>);
  } else
    element = <Fragment>{content}</Fragment>;

  return element;
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
