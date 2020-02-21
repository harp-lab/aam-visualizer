import React, { Fragment, useState } from 'react';
import { Menu, MenuItem } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { IconButton } from 'library/base';

/**
 * Icon button with dropdown menu
 * @param {Object} props 
 * @param {Array} props.items array of menu item Objects with 'label' and 'callback' props
 */
function DropMenu(props) {
  const { items } = props;
  const [anchor, setAnchor] = useState(undefined);

  function open(evt) { setAnchor(evt.currentTarget); }
  function close() { setAnchor(undefined); }

  const elems = items.map(item => {
    const { label, callback } = item;
    return (
      <MenuItem
        key={ label }
        onClick={ () => {
          close();
          callback();
        }}>
        { label }
      </MenuItem>);
  });

  return (
    <Fragment>
      <IconButton
        icon={ <MoreVert /> }
        size='medium'
        onClick={ open } />
      <Menu
        anchorEl={ anchor }
        getContentAnchorEl={ undefined }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={ Boolean(anchor) }
        onClose={ close } >
        { elems }
      </Menu>
    </Fragment>);
}

export default DropMenu;
