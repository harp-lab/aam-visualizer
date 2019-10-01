import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { getList, deleteProject, cancelProcess, exportData, forkProject } from '../redux/api/server';
import { setView } from '../redux/actions/data';
import { selProject } from '../redux/actions/projects';
import { getUser } from '../redux/selectors/data';
import { getProjects } from '../redux/selectors/projects';
import { PROJECT_VIEW } from '../redux/consts';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import DropMenu from './DropMenu';

function ProjectList(props) {
  const [renameDialog, setRenameDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const timeout = useRef(undefined);

  const {
    userId, projects,
    getList, setView, selProject, deleteProject, cancelProcess, exportData, forkProject } = props;

  // mount/unmount
  useEffect(() => {
    update();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  async function update() {
    const refresh = await getList();
    if (refresh) timeout.current = setTimeout(getList(), 1000);
  }
  function openRenameDialog(projectId) {
    setSelectedProjectId(projectId);
    setRenameDialog(true);
  }
  function closeRenameDialog() {
    setSelectedProjectId(undefined);
    setRenameDialog(false);
  }
  async function rename(projectId, name) {
    // save local
    const project = projects[projectId];
    project.name = name;
    props.onSave(projectId, project);

    // save server
    await fetch(`/api/${userId}/projects/${projectId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }
  
  const projectList = Object.entries(projects).map(([id, project]) => {
    const analysisElem = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { project.data.analysis }
      </ListItemText>);
    const nameElem = (
      <ListItemText
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
        { (project.data.name || 'unnamed') }
      </ListItemText>);
    const idElem = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { id }
      </ListItemText>);
    const statusElem = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { project.data.status }
      </ListItemText>);
    let removeActionElem;
    if (project.data.status == project.data.STATUSES.process)
      removeActionElem = (
      <Tooltip title='Cancel processing'>
        <IconButton onClick={ () => cancelProcess(id)}>
          <CancelIcon />
        </IconButton>
      </Tooltip>);
    else
      removeActionElem = (
        <Tooltip title='Delete'>
          <IconButton onClick={ () => deleteProject(id) }>
            <DeleteIcon />
          </IconButton>
        </Tooltip>);
    const actionsElem = (
      <ListItemSecondaryAction>
        <DropMenu
          items={ [
            {label: 'Rename', callback: () => openRenameDialog(id)},
            {label: 'Export', callback: () => exportData(id)}
          ] } />
        <Tooltip title='Fork'>
          <IconButton onClick={ () => forkProject(id) }>
            <CallSplitIcon />
          </IconButton>
        </Tooltip>
        { removeActionElem }
      </ListItemSecondaryAction>);

    return (
      <ListItem
        button
        key={ id }
        onClick={ () => {
          selProject(id);
          setView(PROJECT_VIEW);
        } }
        align='flex-start'
        style={{ paddingRight: 144+16 }}>
        { analysisElem }
        { nameElem }
        { idElem }
        { statusElem }
        { actionsElem }
      </ListItem>);
  });

  let dialog;
  const project = projects[selectedProjectId];
  if (selectedProjectId && renameDialog) {
    dialog = <RenameDialog
      open
      id={ selectedProjectId }
      name={ project.data.name }
      onSave={ rename }
      onClose={ closeRenameDialog } />;
  }
  
  return (
    <React.Fragment>
      <List style={{ overflowY: 'auto' }}>
        { projectList }
      </List>
      { dialog }
    </React.Fragment>);
}
const mapStateToProps = state => {
  const userId = getUser(state);
  const projects = getProjects(state);
  return { userId, projects };
};
export default connect(
  mapStateToProps,
  { getList, setView, selProject, deleteProject, cancelProcess, exportData, forkProject }
)(ProjectList);

function RenameDialog(props) {
  const [name, setName] = useState(undefined);
  useEffect(() => setName(props.name || ''), [props.name]);

  return (
    <Dialog
      open={ props.open }
      onClose={ props.onClose }>
      <DialogContent>
        <TextField
          label='name'
          value={ name }
          onChange={ evt => setName(evt.target.value) }
          placeholder={ `project ${props.id} name` } />
      </DialogContent>
      <DialogActions>
        <Button onClick={ props.onClose }>cancel</Button>
        <Button
          onClick={ () => {
            props.onClose();
            props.onSave(props.id, name)
          }}>
          rename
        </Button>
      </DialogActions>
    </Dialog>);
}
