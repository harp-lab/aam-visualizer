import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { rename } from 'store-apis';
import { setRenameDialog } from 'store-actions';
import { getRenameDialog, getProject } from 'store-selectors';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

function RenameDialog(props) {
  const {
    projectId, name,
    rename, setRenameDialog
  } = props;
  const [currName, setCurrName] = useState(undefined);
  useEffect(() => setCurrName(name || ''), [name]);

  function close() { setRenameDialog(undefined); }

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
            rename(projectId, currName);
          }}>
          rename
        </Button>
      </DialogActions>
    </Dialog>);
}
export default connect(
  state => {
    const projectId = getRenameDialog(state);
    const name = projectId ? getProject(state, projectId).name : '';
    return { projectId, name };
  },
  { rename, setRenameDialog }
)(RenameDialog);