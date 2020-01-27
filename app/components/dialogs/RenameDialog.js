import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { renameProject } from 'store-apis';
import { setRenameDialog } from 'store-actions';
import { getRenameDialog, getProject } from 'store-selectors';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

/** RenameDialog component */
function RenameDialog() {
  const projectId = useSelector(getRenameDialog);
  const project = useSelector(state => getProject(state, projectId));
  const dispatch = useDispatch();
  const name = project ? project.name : '';
  const [currName, setCurrName] = useState(undefined);

  useEffect(() => setCurrName(name || ''), [name]);

  function close() { dispatch(setRenameDialog(undefined)); }

  return (
    <Dialog
      open={ Boolean(projectId) }
      onClose={ close }>
      <DialogContent>
        <TextField
          label='name'
          value={ currName }
          onChange={ evt => setCurrName(evt.target.value) }
          placeholder={ `project ${projectId} name` } />
      </DialogContent>
      <DialogActions>
        <Button onClick={ close }>cancel</Button>
        <Button
          onClick={ () => {
            close();
            dispatch(renameProject(projectId, currName));
          }}>
          rename
        </Button>
      </DialogActions>
    </Dialog>);
}
export default RenameDialog;
