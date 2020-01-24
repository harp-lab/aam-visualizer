import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { importFiles } from 'store-actions';

const useStyles = makeStyles(theme => ({
  overlay: {
    backgroundColor: theme.palette.background.overlay
  }
}));

/**
 * Adds file drop import functionality to children
 * @param {Object} props 
 * @param {Array} props.children
 */
function DropImport(props) {
  const { children } = props;
  const [showDropOverlay, setShowDropOverlay] = useState(false);
  const dropElemCounter = useRef(0);
  const dispatch = useDispatch();
  
  function updateDropOverlay() {
    setShowDropOverlay(dropElemCounter.current !== 0);
  }

  return (
    <div
      onDragEnter={ evt => {
        evt.preventDefault();
        dropElemCounter.current += 1;
        updateDropOverlay();
      }}
      onDragOver={ evt => evt.preventDefault() }
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
      style={{ overflow: 'hidden' }}>
      <DropOverlay show={ showDropOverlay } />
      { children }
    </div>);
}

/**
 * File drop import tooltip overlay
 * @param {Object} props 
 * @param {Boolean} props.show whether to show component
 */
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
    </div>);
}

export default DropImport;