import React from 'react';
import { Link as MUILink, Tooltip, Typography } from '@material-ui/core';

function Link(props) {
  const { content, tooltip, onClick, style } = props;
  return (
    <Tooltip title={ tooltip }>
      <MUILink
        onClick={ evt => {
          evt.stopPropagation();
          onClick();
        }}
        { ...{ style } }>
        <Typography
          display='inline'
          style={{ cursor: 'pointer' }}>
          { content }
        </Typography>
      </MUILink>
    </Tooltip>);
}
export default Link;
