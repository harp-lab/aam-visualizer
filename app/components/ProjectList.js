import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip } from '@material-ui/core';
import { CallSplit as CallSplitIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@material-ui/icons';
import { DropMenu } from 'library';
import { setRenameDialog, selProject } from 'store-actions';
import { getList, deleteProject, cancelProcess, exportData, forkProject } from 'store-apis';
import { getProject, getProjectIds } from 'store-selectors';
import { PROCESS_STATUS } from 'store-consts';

function ProjectList() {
  const projectIds = useSelector(getProjectIds);
  const dispatch = useDispatch();
  const timeout = useRef(undefined);

  // mount/unmount
  useEffect(() => {
    update();
    return () => {
      clearTimeout(timeout.current);
    };
  }, []);

  async function update() {
    const refresh = await dispatch(getList());
    if (refresh) timeout.current = setTimeout(update, 1000);
  }
  
  const projectList = projectIds.map(
    projectId => <ProjectListItem
      key={ projectId }
      projectId={ projectId } />
  );
  
  return (
    <List style={{ overflowY: 'auto' }}>
      { projectList }
    </List>);
}

function ProjectListItem(props) {
  const { projectId } = props;
  const project = useSelector(state => getProject(state, projectId));
  const dispatch = useDispatch();

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
      { projectId }
    </ListItemText>);
  const statusElem = (
    <ListItemText style={{ flex: '0 0 10em' }}>
      { project.status }
    </ListItemText>);

  let removeActionElem;
  if (project.status == PROCESS_STATUS)
    removeActionElem = (
    <Tooltip title='Cancel processing'>
      <IconButton onClick={ () => dispatch(cancelProcess(projectId)) }>
        <CancelIcon />
      </IconButton>
    </Tooltip>);
  else
    removeActionElem = (
      <Tooltip title='Delete'>
        <IconButton onClick={ () => dispatch(deleteProject(projectId)) }>
          <DeleteIcon />
        </IconButton>
      </Tooltip>);

  const actionsElem = (
    <ListItemSecondaryAction>
      <DropMenu
        items={ [
          {label: 'Rename', callback: () => dispatch(setRenameDialog(projectId))},
          {label: 'Export', callback: () => dispatch(exportData(projectId))}
        ] } />
      <Tooltip title='Fork'>
        <IconButton onClick={ () => dispatch(forkProject(projectId)) }>
          <CallSplitIcon />
        </IconButton>
      </Tooltip>
      { removeActionElem }
    </ListItemSecondaryAction>);

  return (
    <ListItem
      button
      key={ projectId }
      onClick={ () => dispatch(selProject(projectId)) }
      align='flex-start'
      style={{ paddingRight: 144+16 }}>
      { analysisElem }
      { nameElem }
      { idElem }
      { statusElem }
      { actionsElem }
    </ListItem>);
}

export default ProjectList;
