import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Typography,
  Dialog, DialogActions, DialogContent
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { deleteProject } from 'store-apis';
import { setDeleteDialog } from 'store-actions';
import { getDeleteDialog, getProjectName } from 'store-selectors';

const useStyles = makeStyles(theme => ({
  deleteButton: {
    color: theme.palette.warning.main
  }
}));

function DeleteDialog() {
  const projectId = useSelector(getDeleteDialog);
  const projectName = useSelector(state => getProjectName(state, projectId));
  const dispatch = useDispatch();
  const classes = useStyles();
  
  function close() { dispatch(setDeleteDialog(undefined)) }

  return (
    <Dialog
      open={ Boolean(projectId) }
      onClose={ close }>
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete project {projectName} ({projectId})?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={ close }>cancel</Button>
        <Button
          classes={{ root: classes.deleteButton }}
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
