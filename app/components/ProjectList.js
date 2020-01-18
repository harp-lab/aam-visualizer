import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import {
  CallSplit as CallSplitIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  Edit as EditIcon
} from '@material-ui/icons';
import { DropMenu, IconButton } from 'library';
import { setRenameDialog, selProject } from 'store-actions';
import { getList, deleteProject, cancelProcess, exportData, forkProject } from 'store-apis';
import { getProject, getProjectIds, getProjectServerStatus } from 'store-selectors';
import { EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS } from 'store-consts';

/** */
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

/**
 * @param {Object} props 
 * @param {String} props.projectId project id
 */
function ProjectListItem(props) {
  const { projectId } = props;
  const { analysis, name = 'unnamed', status } = useSelector(state => getProject(state, projectId));
  const dispatch = useDispatch();

  const actionsElem = (
    <ListItemSecondaryAction>
      <DropMenu
        items={ [
          { label: 'Rename', callback: () => dispatch(setRenameDialog(projectId)) },
          { label: 'Export', callback: () => dispatch(exportData(projectId)) }
        ] } />
      <IconButton
        icon={ <CallSplitIcon /> }
        size='medium'
        tooltip='Fork'
        onClick={ () => dispatch(forkProject(projectId)) } />
      <RemoveAction projectId={ projectId } />
    </ListItemSecondaryAction>);

  return (
    <ListItem
      button
      key={ projectId }
      onClick={ () => dispatch(selProject(projectId)) }
      align='flex-start'
      style={{ paddingRight: 144+16 }}>
      <ItemAttribute content={ analysis } />
      <ItemAttribute
        content={ name }
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}/>
      <ItemAttribute content={ projectId } />
      <ProjectStatus status={ status } />
      { actionsElem }
    </ListItem>);
}

/**
 * Project attribute item
 * @param {Object} props 
 * @param {String} props.content attribute text
 * @param {Object} [props.style = { flex: '0 0 10em' }] styling
 */
function ItemAttribute(props) {
  const {
    content,
    style = { flex: '0 0 10em' }
  } = props;

  return (
    <ListItemText style={ style }>
      { content }
    </ListItemText>);
}

function ProjectStatus(props) {
  const { status } = props;

  let elem;
  switch (status) {
    case EDIT_STATUS:
      elem = <EditIcon />;
      break;
    case PROCESS_STATUS:
      elem = <CircularProgress size={ 16 } />;
      break;
    case COMPLETE_STATUS:
      elem = <DoneIcon />;
      break;
    default:
      break;
  }
  return (
      <ListItemText style={{ flex: '0 0 10em' }}>
        { elem }
        { status }
      </ListItemText>);
}

/**
 * Stateful project remove action
 * @param {Object} props 
 * @param {String} props.projectId project id
 */
function RemoveAction(props) {
  const { projectId } = props;
  const status = useSelector(store => getProjectServerStatus(store, projectId));
  const dispatch = useDispatch();

  let elem;
  switch (status) {
    case PROCESS_STATUS:
      elem = (
        <IconButton
          icon={ <CancelIcon /> }
          size='medium'
          tooltip='Cancel processing'
          onClick={ () => dispatch(cancelProcess(projectId)) } />);
      break;
    default:
      elem = (
        <IconButton 
          icon={ <DeleteIcon /> }
          size='medium'
          tooltip='Delete'
          onClick={ () => dispatch(deleteProject(projectId)) } />);
      break;
  }
  return elem;
}

export default ProjectList;
