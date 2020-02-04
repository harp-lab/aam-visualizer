import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProject } from 'store-apis';
import { setDeleteDialog } from 'store-actions';
import { getDeleteDialog } from 'store-selectors';

import {
  Button, Typography,
  Dialog, DialogActions, DialogContent
} from '@material-ui/core';

function DeleteDialog() {
  const projectId = useSelector(getDeleteDialog);
  const dispatch = useDispatch();
  
  function close() { dispatch(setDeleteDialog(undefined)) }

  return (
    <Dialog
      open={ Boolean(projectId) }
      onClose={ close }>
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete project {projectId}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={ close }>cancel</Button>
        <Button
          onClick={ () => {
            close();
            dispatch(deleteProject(projectId));
          }}>
          delete
        </Button>
      </DialogActions>
    </Dialog>);
}
export default DeleteDialog;
