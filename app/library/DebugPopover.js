import React from 'react';
import { Typography } from '@material-ui/core';
import { BugReport } from '@material-ui/icons';
import { IconPopover } from 'library';

function DebugPopover(props) {
  const { item } = props;
  const { debug } = item;

  if (!debug) return null;
  return (
    <IconPopover
      icon={ <BugReport /> }
      tooltip='Show debug'>
      <Typography>{ debug }</Typography>
    </IconPopover>);
}

export default DebugPopover;
