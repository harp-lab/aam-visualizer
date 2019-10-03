import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { getList, deleteProject, cancelProcess, exportData, forkProject } from 'store-apis';
import { setView, setRenameDialog, selProject } from 'store-actions';
import { getUser, getProjects } from 'store-selectors';
import { PROJECT_VIEW } from 'store-consts';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

import DropMenu from './DropMenu';

function ProjectList(props) {
  const timeout = useRef(undefined);

  const {
    projects,
    getList, setView, selProject, deleteProject, cancelProcess, exportData, forkProject, setRenameDialog } = props;

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
            {label: 'Rename', callback: () => setRenameDialog(id)},
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
  
  return (
    <List style={{ overflowY: 'auto' }}>
      { projectList }
    </List>);
}
const mapStateToProps = state => {
  const userId = getUser(state);
  const projects = getProjects(state);
  return { userId, projects };
};
export default connect(
  mapStateToProps,
  { getList, setView, selProject, deleteProject, cancelProcess, exportData, forkProject, setRenameDialog }
)(ProjectList);
