import React from 'react';
import { IconButton as MUIIconButton, Tooltip } from '@material-ui/core';

function IconButton(props) {
  const { icon, tooltip, onClick } = props;
  return (
    <Tooltip title={ tooltip }>
      <MUIIconButton
        size='small'
        onClick={ onClick }>
        { icon }
      </MUIIconButton>
    </Tooltip>);
}

export default IconButton;
