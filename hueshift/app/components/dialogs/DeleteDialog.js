import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { deleteProject } from 'store/apis';
import { setDeleteDialog } from 'store/actions';
import { PROJECT_UNDEFINED_NAME } from 'store/consts';
import { getDeleteDialog, getProjectName } from 'store/selectors';

const useStyles = makeStyles(theme => ({
  deleteButton: {
    color: theme.palette.warning.main
  }
}));

function DeleteDialog() {
  const [input, setInput] = useState('');
  const projectId = useSelector(getDeleteDialog);
  const projectName = useSelector(state => {
    let name;
    if (projectId)
      name = getProjectName(state, projectId);
    return name;
  });
  const dispatch = useDispatch();
  const classes = useStyles();

  function close() {
    setInput('');
    dispatch(setDeleteDialog(undefined));
  }

  let expectedInput, inputLabel;
  if (projectName === PROJECT_UNDEFINED_NAME) {
    inputLabel = 'last four digits of project id';
    expectedInput = projectId.slice(-4);
  } else {
    inputLabel = 'project name';
    expectedInput = projectName;
  }

  const validInput = input === expectedInput;

  return (
    <Dialog
      open={ Boolean(projectId) }
      onClose={ close }>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to permanently delete the project '{projectName}' ({projectId})?
        </DialogContentText>
        <TextField
          label={ inputLabel }
          value={ input }
          onChange={ evt => setInput(evt.target.value) }
          error={ !validInput && input !== '' }
          fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={ close }>cancel</Button>
        <Button
          classes={{ root: classes.deleteButton }}
          onClick={ () => {
            close();
            dispatch(deleteProject(projectId));
          }}
          disabled={ !validInput }>
          delete
        </Button>
      </DialogActions>
    </Dialog>);
}
export default DeleteDialog;
