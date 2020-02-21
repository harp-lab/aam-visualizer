import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { List } from '@material-ui/core';
import { getList } from 'store/apis';
import { getProjectIds } from 'store/selectors';

import DropImport from './DropImport';
import Item from './Item';

/** */
function ProjectList() {
  const projectIds = useSelector(getProjectIds);
  const dispatch = useDispatch();
  const updateTimeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    update();
    return () => {
      clearTimeout(updateTimeout.current);
    };
  }, []);

  async function update() {
    const refresh = await dispatch(getList());
    if (refresh) updateTimeout.current = setTimeout(update, 1000);
  }
  
  const projectList = projectIds.map(
    projectId => <Item
      key={ projectId }
      projectId={ projectId } />
  );
  
  return (
    <DropImport>
      <List
        style={{
          height: '100%',
          overflowY: 'auto'
        }}>
        { projectList }
      </List>
    </DropImport>);
}

export default ProjectList;
