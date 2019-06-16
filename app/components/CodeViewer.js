import React, { useState } from 'react';
import CodePos from './data/CodePos';

function CodeViewer(props) {
  const [hovered, setHovered] = useState(undefined);

  // filter marks that do not have linked nodes
  const marks = {};
  Object.entries(props.marks).forEach(([id, mark]) => {
    if (Object.keys(mark.nodes).length > 0)
      marks[id] = mark;
  });

  function getMark(line, ch) {
    let currMarkId;
    Object.entries(marks).forEach(([id, mark]) => {
      const inLine = mark.start.line <= line && line <= mark.end.line;
      const inCh = mark.start.ch <= ch && ch < mark.end.ch;
      if (inLine && inCh) {
        if (currMarkId) {
          const currMark = marks[currMarkId];
          const lessLines = (mark.end.line - mark.start.line) < (currMark.end.line - currMark.start.line);
          const lessCh = (mark.end.ch - mark.start.ch) < (currMark.end.ch - currMark.start.ch);
          if (lessLines || (!lessLines && lessCh))
            currMarkId = id;
        } else
          currMarkId = id;
      }
    });
    return currMarkId;
  }
  function hover(line, ch) {
    const markId = getMark(line, ch);
    setHovered(markId);
    if (markId) {
      for (const [graphId, nodes] of Object.entries(marks[markId].nodes))
        props.onCodeHover(graphId, nodes);
    }
  }
  function unhover() {
    setHovered(undefined);
    for (const graphId of props.graphIds)
      props.onCodeHover(graphId, undefined);
  }

  // compile code into nested array
  const lines = props.code
    .split(/\n|\r\n/)
    .map(line => {
      return line.split('');
    });
  
  const selected = props.selected;
  const element = lines.map((line, lineId) => {
    const lineElement = line.map((ch, chId) => {
      let style;
      const selectedMark = marks[selected];
      if (selected && selectedMark.inRange(new CodePos(lineId, chId)))
        style = { backgroundColor: '#fff59d' };
      const hoveredMark = marks[hovered];
      if (hovered && hoveredMark.inRange(new CodePos(lineId, chId)))
        style = { backgroundColor: '#d1c4e9' };
      
      if (props.hovered) {
        props.hovered.forEach(astId => {
          const mark = marks[astId];
          if (mark.inRange(new CodePos(lineId, chId)))
            style = { backgroundColor: '#d1c4e9' };
        });
      }

      return (
        <span
          key={ chId }
          onMouseOver={ () => hover(lineId, chId) }
          onMouseLeave={ () => unhover() }
          style={ style }>
          { ch }
        </span>);
    });
    return <div key={ lineId }>{ lineElement }</div>;
  });

  return <div>{ element }</div>;
}

export default CodeViewer;
