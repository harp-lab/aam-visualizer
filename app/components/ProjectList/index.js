import React, { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { List, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { importFiles } from 'store-actions';
import { getList } from 'store-apis';
import { getProjectIds } from 'store-selectors';

import Item from './Item';

const useStyles = makeStyles(theme => ({
  overlay: {
    backgroundColor: theme.palette.background.overlay
  }
}));

/** */
function ProjectList() {
  const [showDropOverlay, setShowDropOverlay] = useState(false);
  const projectIds = useSelector(getProjectIds);
  const dispatch = useDispatch();
  const counter = useRef(0);
  const decrement = useCallback(() => {
    counter.current -= 1;
    setShowDropOverlay(counter.current !== 0);
  })
  const iterate = useCallback(() => {
    counter.current += 1;
    setShowDropOverlay(counter.current !== 0);
  });
  const reset = useCallback(() => {
    counter.current = 0;
    setShowDropOverlay(counter.current !== 0);
  });
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

  console.log('rendering', counter, showDropOverlay);
  
  return (
    <div
      onDragEnter={ evt => {
        console.log('fired enter');
        evt.preventDefault();
        iterate();
      }}
      onDragOver={ evt => evt.preventDefault() }
      onDragLeave={ evt => {
        console.log('fired leave');
        evt.preventDefault();
        decrement();
      }}
      onDrop={ evt => {
        evt.preventDefault();
        dispatch(importFiles(evt.dataTransfer.files));
        reset();
      }}
      style={{
        height: '100%',
        overflowY: 'auto'
      }}>
      <DropOverlay show={ showDropOverlay } />
      <List style={{ pointerEvents: showDropOverlay ? 'none' : 'auto' }}>
        { projectList }
      </List>
    </div>);
}

function DropOverlay(props) {
  const { show } = props;
  const classes = useStyles();

  if (!show) return null;

  return ( 
    <div
      className={ classes.overlay }
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        position: 'fixed',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1
      }}>
      <Typography>Drop files here to import</Typography>
    </div>
  );
}

export default ProjectList;
