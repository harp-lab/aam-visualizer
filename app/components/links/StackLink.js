import React from 'react';
import { useDispatch } from 'react-redux';
import { showStack } from 'store-actions';
import { Link } from 'library';

function StackLink(props) {
  const { stackId, stackType, style } = props;
  const dispatch = useDispatch();
  return <Link
    content={ stackId }
    tooltip='Show stack'
    onClick={ () => dispatch(showStack(stackId, stackType)) }
    { ...{ style } } />;
}
export default StackLink;
