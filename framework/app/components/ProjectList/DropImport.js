import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Backdrop, Typography } from '@material-ui/core';
import { LibraryAdd as LibraryAddIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { importFiles } from 'store/actions';

const useStyles = makeStyles(theme => ({
  backdrop: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.overlay,
    color: theme.palette.secondary.main,
    zIndex: theme.zIndex.tooltip
  }
}));

/**
 * Adds file drop import functionality to children
 * @param {Object} props 
 * @param {Array} props.children
 */
function DropImport(props) {
  const { children } = props;
  const [overlay, setOverlay] = useState(false);
  const dropElemCounter = useRef(0);
  const dispatch = useDispatch();
  
  function updateDropOverlay() {
    setOverlay(dropElemCounter.current !== 0);
  }

  return (
    <div
      onDragEnter={ evt => {
        evt.preventDefault();
        dropElemCounter.current += 1;
        updateDropOverlay();
      }}
      onDragOver={ evt => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={ evt => {
        dropElemCounter.current -= 1;
        updateDropOverlay();
      }}
      onDrop={ evt => {
        evt.preventDefault();
        dropElemCounter.current = 0;
        updateDropOverlay();
        dispatch(importFiles(evt.dataTransfer.files));
      }}
      style={{
        position: 'relative',
        flex: '1 1 auto',
        overflow: 'hidden'
      }}>
      <DropOverlay open={ overlay } />
      { children }
    </div>);
}

/**
 * File drop import tooltip overlay
 * @param {Object} props 
 * @param {Boolean} props.open display overlay
 */
function DropOverlay(props) {
  const { open } = props;
  const classes = useStyles();

  return (
    <Backdrop
      open={ open }
      classes={{ root: classes.backdrop }}>
      <LibraryAddIcon />
      <Typography>Drop files here to import</Typography>
    </Backdrop>);
}

export default DropImport;
