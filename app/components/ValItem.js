import React from 'react';
import { connect } from 'react-redux';
import { getProjectItems } from '../redux/selectors/projects';

import { Typography } from '@material-ui/core';

function ValItem(props) {
  const { valId, items } = props;
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
export default connect(
  state => {
    const items = getProjectItems(state);
    return { items };
  }
)(ValItem);
