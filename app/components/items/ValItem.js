import React from 'react';
import { useSelector } from 'react-redux';
import { getProjectItems } from 'store-selectors';

import { Typography } from '@material-ui/core';

function ValItem(props) {
  const { valId } = props;
  const items = useSelector(getProjectItems);
  const { type, astString, valString } = items.vals[valId];

  let string;
  switch (type) {
    case 'bool':
      string = valString;
      break;
    case 'closure':
      string = astString;
      break;
    default:
      string = `'${type}' value type unsupported`;
      break;
  }

  return <Typography>{ string }</Typography>;
}
export default ValItem;
