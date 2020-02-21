import React from 'react';
import { IconButton as MUIIconButton, Tooltip } from '@material-ui/core';

/**
 * Icon button with tooltip
 * @param {Object} props 
 * @param {ReactElement} props.icon React icon element
 * @param {String} [props.size = 'small'] button icon size
 * @param {String} [props.tooltip] button tooltip
 * @param {Function()} props.onClick button click callback
 */
function IconButton(props) {
  const {
    icon,
    size='small',
    tooltip,
    onClick } = props;
  let elem = (
    <MUIIconButton
      size={ size }
      onClick={ onClick }>
      { icon }
    </MUIIconButton>);
  if (tooltip)
    elem = (
      <Tooltip title={ tooltip }>
        { elem }
      </Tooltip>);
  return elem;
}

export default IconButton;
