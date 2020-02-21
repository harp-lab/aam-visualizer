import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { EnvLink } from 'links';
import { Spacer } from 'library/base';
import { getProjectItems } from 'store/selectors';

import { Typography } from '@material-ui/core';

function ValItem(props) {
  const { valId, style } = props;
  const items = useSelector(getProjectItems);
  const { type, label, env: envId } = items.vals[valId];

  let string = valId;
  switch (type) {
    case 'bool':
    case 'closure':
    case 'unit':
      if (label)
        string = label;
      break;
    default:
      if (label)
        string = `'${label}' value type unsupported`;
      break;
  }

  return (
    <Spacer childrenStyle={{ marginRight: 5 }}>
      <div style={{ display: 'inline-block' }}>
        <Typography display='inline'>{ string }</Typography>
      </div>
      { envId ? <EnvLink envId={ envId } /> : undefined }
    </Spacer>);
}
export default ValItem;
