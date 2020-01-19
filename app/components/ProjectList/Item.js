import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import {
  CallSplit as CallSplitIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { DropMenu, IconButton } from 'library';
import { setRenameDialog, selProject } from 'store-actions';
import { deleteProject, cancelProcess, exportData, forkProject } from 'store-apis';
import { getProject, getProjectServerStatus } from 'store-selectors';
import { PROCESS_STATUS } from 'store-consts';

import Status from './Status';

const useStyles = makeStyles(theme => ({
  disabled: { color: theme.palette.text.disabled }
}));

/**
 * @param {Object} props 
 * @param {String} props.projectId project id
 */
function Item(props) {
  const { projectId } = props;
  const { analysis, name, status } = useSelector(state => getProject(state, projectId));
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
      <ItemAttribute
        value={ analysis }
        defaultValue='n/a' />
      <ItemAttribute
        value={ name }
        defaultValue='unnamed'
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}/>
      <ItemAttribute value={ projectId } />
      <Status status={ status } />
      { actionsElem }
    </ListItem>);
}

/**
 * Project attribute item
 * @param {Object} props 
 * @param {String} props.value attribute value
 * @param {String} [props.defaultValue] default attribute value
 * @param {Object} [props.style = { flex: '0 0 10em' }] styling
 */
function ItemAttribute(props) {
  const {
    value,
    defaultValue,
    style = { flex: '0 0 10em' }
  } = props;
  const classes = useStyles();

  const text = value || defaultValue;
  const rootClass = value ? undefined : classes.disabled;

  return (
    <ListItemText
      classes={{ root: rootClass }}
      style={ style }>
      { text }
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

export default Item;
