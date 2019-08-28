import React, { useState, useEffect, useRef, useContext } from 'react';
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

import { StoreContext, useActions } from './Store';
import ProjectData from './data/Project'

function ProjectList(props) {
  const [renameDialog, setRenameDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const timeout = useRef(undefined);

  const { userId } = props;
  const { store, dispatch } = useContext(StoreContext);
  const { setProjects } = useActions(store, dispatch);
  const projects = store.projects;

  // mount/unmount
  useEffect(() => {
    getProjectList();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  // solution to bug, clear timeout when store is updated and reset

  async function getProjectList() {
    const res = await fetch(`/api/${userId}/all`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const updatedProjects = {...projects};
        let refresh = false;
        for (const [id, metadata] of Object.entries(data)) {
          let project = updatedProjects[id];

          // create project if undefined
          if (!project) {
            project = new ProjectData(userId);
            updatedProjects[id] = project;
          }

          project.status = metadata.status;
          project.name = metadata.name;
          project.analysis = metadata.analysis;

          if (project.status == project.STATUSES.process)
            refresh = true;
        }

        // update list
        if (refresh)
          timeout.current = setTimeout(getProjectList, 1000);

        props.onLoad(false);
        setProjects(updatedProjects);
        break;
      default:
        props.onLoad(true);
        timeout.current = setTimeout(getProjectList, 1000);
        break;
    }
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
        { project.analysis }
      </ListItemText>);
    const nameElem = (
      <ListItemText
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
        { (project.name || 'unnamed') }
      </ListItemText>);
    const idElem = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { id }
      </ListItemText>);
    const statusElem = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { project.status }
      </ListItemText>);
    let removeActionElem;
    if (project.status == project.STATUSES.process)
      removeActionElem = (
      <Tooltip title='Cancel processing'>
        <IconButton onClick={ () => props.onCancel(id)}>
          <CancelIcon />
        </IconButton>
      </Tooltip>);
    else
      removeActionElem = (
        <Tooltip title='Delete'>
          <IconButton onClick={ () => props.onDelete(id) }>
            <DeleteIcon />
          </IconButton>
        </Tooltip>);
    const actionsElem = (
      <ListItemSecondaryAction>
        <DropMenu
          items={ [
            {label: 'Rename', callback: () => openRenameDialog(id)},
            {label: 'Export', callback: () => props.onExport(id)}
          ] } />
        <Tooltip title='Fork'>
          <IconButton onClick={ () => props.onFork(id) }>
            <CallSplitIcon />
          </IconButton>
        </Tooltip>
        { removeActionElem }
      </ListItemSecondaryAction>);

    return (
      <ListItem
        button
        key={ id }
        onClick={ () => props.onClick(id) }
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
      name={ project.name }
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

export default ProjectList;
