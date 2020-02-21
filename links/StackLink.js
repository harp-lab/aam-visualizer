import React from 'react';
import { useDispatch } from 'react-redux';
import { showStack } from 'store/actions';
import { getStackRefData, getLabel } from 'store/selectors';
import { Link } from 'library/base';

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
