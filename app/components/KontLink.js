import React, { useContext } from 'react';
import { Link, Tooltip, Typography } from '@material-ui/core';

import { StoreContext, useActions } from './Store';

function KontLink(prop) {
  const { kontId, style } = prop;
  const { store, dispatch } = useContext(StoreContext);
  const { showKont } = useActions(store, dispatch);
  
  return (
    <Tooltip title='Show stack'>
      <Link
        onClick={ evt => {
          evt.stopPropagation();
          showKont(kontId);
        } }
        { ...{ style } }>
        <Typography
          display='inline'
          style={{ cursor: 'pointer' }}>
          { `stack-${ kontId }` }
        </Typography>
      </Link>
    </Tooltip>);
}

export default KontLink;