import React, { useState, useEffect, useRef } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import ProjectData from './data/Project'

function ProjectList(props) {
  const [renameDialog, setRenameDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const timeout = useRef(undefined);

  const projects = props.projects;

  // mount/unmount
  useEffect(() => {
    getProjectList();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  async function getProjectList() {
    const res = await fetch('/api/all', { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const updatedProjects = {...projects};
        let refresh = false;
        for (const [id, metadata] of Object.entries(data)) {
          let project = updatedProjects[id];

          // create project if undefined
          if (!project) {
            project = new ProjectData();
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
          timeout.current = setTimeout(getProjectList, 5000);

        props.onLoad(false);
        props.onProjectsUpdate(updatedProjects);
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
    await fetch(`/api/projects/${projectId}/save`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  const projectList = Object.entries(projects).map(([id, project]) => {
    const analysisElement = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { project.analysis }
      </ListItemText>);
    const nameElement = (
      <ListItemText
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
        { (project.name || 'unnamed') }
      </ListItemText>);
    const idElement = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { id }
      </ListItemText>);
    const statusElement = (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { project.status }
      </ListItemText>);
    const actionsElement = (
      <ListItemSecondaryAction>
        <ProjectMenu onRename={ () => openRenameDialog(id) }/>
        <Tooltip title='Fork'>
          <IconButton onClick={ () => props.onFork(id) }>
            <CallSplitIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Delete'>
          <IconButton onClick={ () => props.onDelete(id) }>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>);

    return (
      <ListItem
        button
        key={ id }
        onClick={ () => props.onClick(id) }
        align='flex-start'
        style={{ paddingRight: 144+16 }}>
        { analysisElement }
        { nameElement }
        { idElement }
        { statusElement }
        { actionsElement }
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

function ProjectMenu(props) {
  const [anchor, setAnchor] = useState(undefined);

  function open(evt) { setAnchor(evt.currentTarget); }
  function close() { setAnchor(undefined); }

  return (
    <React.Fragment>
      <Tooltip title='More'>
        <IconButton onClick={ open }>
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={ anchor }
        open={ Boolean(anchor) }
        onClose={ close } >
        <MenuItem
          onClick={ () => {
            close();
            props.onRename();
          }}>
          rename
        </MenuItem>
      </Menu>
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
