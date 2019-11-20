import React from 'react';
import { Typography } from '@material-ui/core';

function DebugItem(props) {
  const { item } = props;
  const { debug } = item;

  if (!debug) return <Typography>Debug property undefined</Typography>;
  
  let content;
  if (debug instanceof String) {
    content = <Typography>{ debug }</Typography>;
  } else if (debug instanceof Array) {
    content = debug.map((debugString, index) => {
      return (
        <Typography key={ index }>
          { debugString }
        </Typography>);
    });
  } else {
    content = <Typography>Invalid debug property type: { typeof debug }</Typography>;
  }
  return content;
}

export default DebugItem;
