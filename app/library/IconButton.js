import React from 'react';
import { IconButton as MUIIconButton, Tooltip } from '@material-ui/core';

/**
 * Icon button
 * @param {Object} props 
 * @param {ReactElement} props.icon React icon element
 * @param {String} props.tooltip button tooltip
 * @param {Function()} props.onClick button click callback
 */
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
