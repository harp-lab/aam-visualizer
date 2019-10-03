import React from 'react';
import { useDispatch } from 'react-redux';
import { showKont } from 'store-actions';

import { Link } from 'library';

function KontLink(props) {
  const { kontId, style } = props;
  const dispatch = useDispatch();
  return <Link
    content={ `stack-${kontId}` }
    tooltip='Show stack'
    onClick={ () => dispatch(showKont(kontId)) }
    { ...{ style } } />;
}
export default KontLink;
