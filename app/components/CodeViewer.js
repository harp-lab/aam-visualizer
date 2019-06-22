import React, { Fragment, useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';
import CodePos from './data/CodePos';

function CodeViewer(props) {
  const [gutterWidth, setGutterWidth] = useState('auto');

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
  function hover(line, ch) {
    const markId = getMark(line, ch);
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

  // compile code into nested array
  const lines = props.code
    .split(/\r\n|\n/)
    .map(line => {
      return line.match(/\(|\)|\[|\]|\#t|\#f|\w+|\s+/g);
    });
  
  // generate lines
  const element = lines.map((line, lineId) => {
    let ch = 0;
    // generate toks
    let lineElement;
    if (line) {
      lineElement = line.map((tok, tokId) => {
        const tokStart = new CodePos(lineId, ch);
        const tokEnd = new CodePos(lineId, ch + tok.length);
        ch += tok.length;
  
        const hovered = props.hovered;
        const selected = props.selected;
        let content = tok;
        if (hovered.length > 0) {
          const hoveredMarks = hovered.map(id => { return marks[id]; });
          content = <Token
            content={ tok }
            marks={ hoveredMarks }
            start={ tokStart }
            end={ tokEnd }
            color={ '#d1c4e9' } />;
        } else if (selected)
          content = <Token
            content={ tok }
            marks={ [marks[selected]] }
            start={ tokStart }
            end={ tokEnd }
            color={ '#fff59d' } />;
  
        return (
          <span
            key={ tokId }
            onMouseOver={ () => hover(lineId, tokStart.ch) }>
            { content }
          </span>);
      });
    } else
      lineElement = <span></span>;
    

    const theme = props.theme;

    const gutterElement = (
      <div
        style={{
          display: 'inline-block',
          width: gutterWidth,
          textAlign: 'right',
          backgroundColor: theme.palette.grey['200'],
          padding: '0 5px'
        }}>
        <Typography
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
          display='inline'
          variant='body2'
          style={{
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
          color={ color }/>
      </Fragment>);
  } else if (mark.endsIn(start, end)) {
    element = (
      <Fragment>
        <Span
          content={ content.substr(0, end.ch) }
          color={ color }/>
        { content.substr(end.ch) }
      </Fragment>);
  } else
    element = <Fragment>{content}</Fragment>;

  return element;
}

function Span(props) {
  return (
    <span
    style={{ backgroundColor: props.color }}>
      { props.content }
    </span>);
}

export default CodeViewer;
