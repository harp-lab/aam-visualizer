import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getProjectItems, getLabel } from 'store/selectors';
import { Link } from 'library/base';

import { showEnv } from 'fext/store/actions';

function EnvLink(props) {
  const { envId, style } = props;
  const { envs } = useSelector(getProjectItems);
  const dispatch = useDispatch();

  return <Link
    content={ getLabel(envs[envId]) || envId }
    tooltip={ `Show environment ${envId}` }
    onClick={ () => dispatch(showEnv(envId)) }
    { ...{ style } } />;
}
export default EnvLink;
