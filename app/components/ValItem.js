import React, { useContext } from 'react';

import { Typography } from '@material-ui/core';

import ItemContext from './ItemContext';

function ValItem(props) {
  const { valId } = props;
  const items = useContext(ItemContext);
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