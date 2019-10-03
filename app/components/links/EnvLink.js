import React from 'react';
import { useDispatch } from 'react-redux';
import { showEnv } from 'store-actions';

import { Link } from 'library';

function EnvLink(props) {
  const { envId, style } = props;
  const dispatch = useDispatch();
  return <Link
    content={ `env-${envId}` }
    tooltip='Show environment'
    onClick={ () => dispatch(showEnv(envId)) }
    { ...{ style } } />;
}
export default EnvLink;
