import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedAsts, getHoveredAsts, getProjectAnalysisOutput } from 'store/selectors';
import { withTheme } from '@material-ui/styles';
import { indigo } from '@material-ui/core/colors';

import Context from './Context';

function Token(props) {
  const { lineId, chId, theme } = props;
  const { ast } = useSelector(getProjectAnalysisOutput);
  const selectedAstIds = useSelector(getSelectedAsts);
  const hoveredAstIds = useSelector(getHoveredAsts);
  const { astNodes, code, onHover, onClick } = useContext(Context);

  const token = code[lineId][chId];
  const tokStart = [parseInt(lineId), parseInt(chId)];
  const tokEnd = [parseInt(lineId), parseInt(chId) + token.length];

  // TODO optimize by creating sorted list of smallest to largest astIds
  let smallestAstId;
  for (const astId of Object.keys(astNodes)) {
    if (includes(astId, tokStart, tokEnd)) {
      if (!smallestAstId)
        smallestAstId = astId;
      else {
        if (compareRanges(ast[astId], ast[smallestAstId]) < 0)
          smallestAstId = astId;
      }
    }
  }
  
  function compareRanges(range1, range2) {
    const { start: start1, end: end1 } = range1;
    const { start: start2, end: end2 } = range2;
    const range1Lines = getLines(start1, end1);
    const range2Lines = getLines(start2, end2);
    if (range1Lines < range2Lines) return -1
    else if (range1Lines > range2Lines) return 1
    else {
      const range1Chs = getChs(start1, end1);
      const range2Chs = getChs(start2, end2);
      if (range1Chs < range2Chs) return -1;
      else if (range1Chs > range2Chs) return 1;
      else return 0;
    }
  }
  function getLines(start, end) { return end[0] - start[0]; }
  function getChs(start, end) { return end[1] - start[1]; }
  function includes(astId, tokStart, tokEnd) {
    const { start: astStart, end: astEnd } = ast[astId];
    const prop1 = compare(astStart, tokStart) <= 0;
    const prop2 = compare(tokEnd, astEnd) <= 0;
    return prop1 && prop2;
  }
  function compare(pos1, pos2) {
    const [pos1Line, pos1Ch] = pos1;
    const [pos2Line, pos2Ch] = pos2;
    if (pos1Line < pos2Line) return -1;
    else if (pos1Line > pos2Line) return 1;
    else {
      if (pos1Ch < pos2Ch) return -1;
      else if (pos1Ch > pos2Ch) return 1;
      else return 0;
    }
  }

  const isPrim = token.match(/lambda|let|if|\#t|\#f/);
  const hovered = hoveredAstIds.find(astId => includes(astId, tokStart, tokEnd));
  const selected = selectedAstIds.find(astId => includes(astId, tokStart, tokEnd));

  let content = token;
  if (hovered)
    content = <Span 
      content={ token }
      color={ theme.palette.hover.light } />;
  else if (selected)
    content = <Span 
      content={ token }
      color={ theme.palette.select.light } />;

  return <Span
    key={ chId }
    content={ content }
    textColor={ isPrim ? indigo[800] : undefined }
    onMouseOver={ () => onHover(smallestAstId) }
    onClick={ () => onClick(smallestAstId) }
    style={{ cursor: 'pointer' }}/>;
}
Token = withTheme(Token);

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

export default Token;