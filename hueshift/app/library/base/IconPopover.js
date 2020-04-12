import React, { Fragment, useState } from 'react';
import { IconButton, Popover, Tooltip } from '@material-ui/core';
import { withStyles } from '@material-ui/styles';

function IconPopover(props) {
  const { icon, tooltip, children, classes } = props;
  const [anchor, setAnchor] = useState(undefined);

  function open(evt) {
    evt.stopPropagation();
    setAnchor(evt.currentTarget);
  }
  function close(evt) { 
    evt.stopPropagation();
    setAnchor(undefined);
  }

  return (
    <Fragment>
      <Tooltip title={ tooltip }>
        <IconButton
          size='small'
          onClick={ open }>
          { icon }
        </IconButton>
      </Tooltip>
      <Popover
        open={ Boolean(anchor) }
        anchorEl={ anchor }
        onClose={ close }
        classes={{ paper: classes.paper }}>
        { children }
      </Popover>
    </Fragment>);
}

export default withStyles({
  paper: { padding: '1em' }
})(IconPopover);
