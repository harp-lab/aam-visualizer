import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton, Snackbar as MUISnackbar } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';
import { dequeueSnackbar } from 'store/actions';
import { getSnackbar } from 'store/selectors';

function Snackbar() {
  const message = useSelector(getSnackbar);
  const dispatch = useDispatch();

  const [timer, setTimer] = useState(undefined);

  // update on store change
  useEffect(() => {
    if (message)
      setTimer(setTimeout(() => {
        update();
      }, 20000));
  }, [message]);

  function update() {
    clearTimeout(timer);
    dispatch(dequeueSnackbar());
  }
  function handleClose(evt, reason) {
    if (reason !== 'clickaway')
      update();
  }

  return <MUISnackbar
    open={ Boolean(message) }
    onClose={ handleClose }
    action={[
      <IconButton
        key='close'
        onClick={ update }
        color='inherit' >
        <CloseIcon />
      </IconButton>
    ]}
    autoHideDuration={ 20000 }
    message={ message }
    anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }} />;
}
export default Snackbar;
