import React from 'react';
import { connect } from 'react-redux';
import { showKont } from '../redux/actions/panels';

import { Link, Tooltip, Typography } from '@material-ui/core';


function KontLink(prop) {
  const { kontId, style, showKont } = prop;
  
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
export default connect(
  null,
  { showKont }
)(KontLink);
