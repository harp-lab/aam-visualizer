import React from 'react';
import { useSelector } from 'react-redux';
import { getProjectItems } from 'store-selectors';

import { Typography } from '@material-ui/core';

function ValItem(props) {
  const { valId, style } = props;
  const items = useSelector(getProjectItems);
  const { type, astString, valString } = items.vals[valId];

  let string;
  switch (type) {
    case 'bool':
    case 'closure':
    case 'unit':
      string = label;
      break;
    default:
      string = `'${label}' value type unsupported`;
      break;
  }

  return (
    <div style={ style }>
      <Typography display='inline'>{ string }</Typography>
    </div>);
}
export default ValItem;
