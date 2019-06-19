import React, { Fragment, useState } from 'react';
import CodePos from './data/CodePos';

function CodeViewer(props) {
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
      //return line.split('');
      return line.match(/\(|\)|\[|\]|\#t|\#f|\w+|\s+/g);
    });
  
  // generate lines
  const element = lines.map((line, lineId) => {
    let ch = 0;
    // generate toks
    const lineElement = line.map((tok, tokId) => {
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
    return (
      <div
        key={ lineId }
        onMouseLeave={ () => unhover() }>
        { lineElement }
      </div>);
  });

  return <div style={{ whiteSpace: 'pre' }}>{ element }</div>;
}

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
  return <span style={{ backgroundColor: props.color }}>{ props.content }</span>;
}

export default CodeViewer;
