import React from 'react';
import { Typography } from '@material-ui/core';
import { BugReport } from '@material-ui/icons';
import { IconPopover } from 'library';

function DebugPopover(props) {
  const { item } = props;
  const { debug } = item;

  if (!debug) return null;

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

  return (
    <IconPopover
      icon={ <BugReport /> }
      tooltip='Show debug'>
      { content }
    </IconPopover>);
}

export default DebugPopover;
