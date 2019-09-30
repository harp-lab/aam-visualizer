import React from 'react';
import { connect } from 'react-redux';
import { showEnv } from '../redux/actions/panels';

import { Link, Tooltip, Typography } from '@material-ui/core';

function EnvLink(prop) {
  const {
    envId, style,
    showEnv
  } = prop;
  
  return (
    <Tooltip title='Show environment'>
      <Link
        onClick={ evt => {
          evt.stopPropagation();
          showEnv(envId);
        } }
        { ...{ style } }>
        <Typography 
          display='inline'
          style={{ cursor: 'pointer' }}>
          { `env-${ envId }` }
        </Typography>
      </Link>
    </Tooltip>);
}
export default connect(
  null,
  { showEnv }
)(EnvLink);
