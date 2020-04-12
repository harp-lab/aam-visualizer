import React from 'react';
import { Typography } from '@material-ui/core';

function PaneMessage(props) {
  const { content, buttons } = props;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <div style={{ display: 'flex' }}>
        <Typography
          variant='h6'
          style={{ margin: '0 1em' }}>
          { content }
        </Typography>
        { buttons }
      </div>
    </div>);
}

export default PaneMessage;
