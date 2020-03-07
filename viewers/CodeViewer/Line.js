import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import Context from './Context';
import Token from './Token';

function Line(props) {
  const { lineId } = props;
  const { code, onUnhover, gutterWidth, setGutterWidth } = useContext(Context);

  const line = code[lineId];
  const tokElems = Object.keys(line).map(chId => {
    return <Token
      key={ chId }
      lineId={ lineId }
      chId={ chId } />;
  });
  
  return (
    <div key={ lineId }>
      <Gutter
        lineId={ lineId }
        lastLine={ lineId == Object.keys(code).length - 1 }
        width={ gutterWidth }
        onSet={ setGutterWidth } />
      <Typography
        onMouseLeave={ () => onUnhover() }
        variant='body2'
        style={{
          display: 'inline-block',
          verticalAlign: 'bottom',
          fontFamily: 'Roboto Mono, "Courier New", Courier, monospace'
        }}>
        { tokElems }
      </Typography>
    </div>);
}

function Gutter(props) {
  const { lineId, lastLine, width, theme, onSet } = props;

  function set(ref) {
    if (ref && lastLine) {
      const bounds = ref.getBoundingClientRect();
      const currWidth = bounds.width;
      if (width !== currWidth) {
        onSet(currWidth);
      }
    }
  }

  return (
    <div
      style={{
        display: 'inline-block',
        width,
        fontFamily: 'Roboto Mono, Courier New, Courier, monospace',
        backgroundColor: theme.palette.grey['200'],
        textAlign: 'right',
        padding: '0 5px'
      }}>
      <Typography
        variant='body2'
        ref={ set }
        color='textSecondary'>
        { parseInt(lineId) + 1 }
      </Typography>
    </div>);
}
Gutter = withTheme(Gutter);

export default Line;
