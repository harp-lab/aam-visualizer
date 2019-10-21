import React from 'react';
import Typography from '@material-ui/core/Typography';

function PaneMessage(props) {
  const { content } = props;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Typography variant='h6'>{ content }</Typography>
    </div>);
}

export default PaneMessage;
