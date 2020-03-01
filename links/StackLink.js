import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'library/base';
import { getLabel } from 'store/selectors';

import { showStack } from 'fext/store/actions';
import { getStackRefData } from 'fext/store/selectors';

function StackLink(props) {
  const { stackId, stackType, style } = props;
  const dispatch = useDispatch();
  const refData = getStackRefData(stackType);

  return <Link
    content={ getLabel(refData[stackId]) || stackId }
    tooltip={ `Show stack ${stackId}` }
    onClick={ () => dispatch(showStack(stackId, stackType)) }
    { ...{ style } } />;
}
export default StackLink;
