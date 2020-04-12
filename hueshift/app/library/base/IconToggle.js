import React from 'react';
import { IconButton } from 'library/base';

/**
 * Stateful icon button toggle
 * @param {Object} props 
 * @param {ReactElement} props.icon React icon element
 * @param {String} props.tooltip toggle tooltip
 * @param {Boolean} props.enabled toggle enabled state
 * @param {Function()} props.onToggle toggle callback
 */
function IconToggle(props) {
  const { icon, tooltip, enabled, onToggle } = props;

  const color = enabled ? 'secondary' : 'inherit';
  const coloredIcon = React.cloneElement(icon, { color });
  const action = enabled ? 'Disable' : 'Enable';
  const stateTooltip = `${action} ${tooltip}`;

  return <IconButton
    icon={ coloredIcon }
    tooltip={ stateTooltip }
    onClick={ onToggle } />;
}

export default IconToggle;
