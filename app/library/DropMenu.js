import React, { Fragment, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import MoreVertIcon from '@material-ui/icons/MoreVert';

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
      <Tooltip title='More'>
        <IconButton
          color='inherit'
          onClick={ open }>
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
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
