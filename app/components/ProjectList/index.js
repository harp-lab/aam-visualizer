import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { List } from '@material-ui/core';
import { getList } from 'store-apis';
import { getProjectIds } from 'store-selectors';

import Item from './Item';

/** */
function ProjectList() {
  const projectIds = useSelector(getProjectIds);
  const dispatch = useDispatch();
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    update();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  async function update() {
    const refresh = await dispatch(getList());
    if (refresh) timeout.current = setTimeout(update, 1000);
  }
  
  const projectList = projectIds.map(
    projectId => <Item
      key={ projectId }
      projectId={ projectId } />
  );
  
  return (
    <List style={{ overflowY: 'auto' }}>
      { projectList }
    </List>);
}

export default ProjectList;
