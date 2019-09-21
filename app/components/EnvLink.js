import React, { useContext } from 'react';
import { Link, Tooltip, Typography } from '@material-ui/core';

import { StoreContext, useActions } from './Store';

function EnvLink(prop) {
  const { envId, style } = prop;
  const { store, dispatch } = useContext(StoreContext);
  const { showEnv } = useActions(store, dispatch);
  
  return (
    <Tooltip title='Show environment'>
      <Link
        onClick={ () => showEnv(envId) }
        { ...{ style } }>
        <Typography display='inline'>{ envId }</Typography>
      </Link>
    </Tooltip>);
}

export default EnvLink;