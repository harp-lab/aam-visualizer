import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import DeleteIcon from '@material-ui/icons/Delete';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

class RenameDialog extends Component {
  constructor(props) {
    super(props);

    const name = this.props.name;
    this.state = { name };

    this.changeName = this.changeName.bind(this);
  }
  changeName(event) { this.setState({ name: event.target.value }); }
  render() {
    return (
    <Dialog open={ this.props.open }>
      <DialogContent>
        <TextField
          label='name'
          value={ this.state.name }
          onChange={ this.changeName }
          placeholder={ `project ${this.props.id} name` } />
      </DialogContent>
      <DialogActions>
        <Button onClick={ this.props.onClose }>cancel</Button>
        <Button onClick={ () => this.props.onSave(this.state.name) }>rename</Button>
      </DialogActions>
    </Dialog>);
  }
}

class ProjectList extends Component {
  constructor(props) {
    super(props);

    const menuAnchor = undefined;
    const renameDialog = false;
    this.state = { menuAnchor, renameDialog }

    this.openMenu = this.openMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.closeRenameDialog = this.closeRenameDialog.bind(this);
  }
  openRenameDialog() { this.setState({ renameDialog: true }); }
  closeRenameDialog() { this.setState({ renameDialog: false }); }
  rename(projectId, name) {
    const project = this.props.data[projectId];
    project.name = name;
    this.props.onSave(projectId, project);
    return fetch(`/api/project?id=${projectId}&save`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  openMenu(event) { this.setState({ menuAnchor: event.currentTarget }); }
  closeMenu() { this.setState({ menuAnchor: undefined }); }
  render() {
    const projectList = Object.entries(this.props.data).map(([id, project]) => {
      return (
        <ListItem
          button
          key={ id }
          onClick={ () => this.props.onClick(id) }>
          <ListItemText>{ id }</ListItemText>
          <ListItemText>{ (project.name || 'unnamed') }</ListItemText>
          <ListItemText>{ project.status }</ListItemText>
          <ListItemSecondaryAction>
            <IconButton
              onClick={ this.openMenu }>
              <MoreHorizIcon />
            </IconButton>
            <Menu
              id='menu'
              anchorEl={ this.state.menuAnchor }
              open={ Boolean(this.state.menuAnchor) }
              onClose={ this.closeMenu }>
              <MenuItem
                onClick={ () => {
                  this.closeMenu();
                  this.openRenameDialog();
                } }>
                rename
              </MenuItem>
            </Menu>
            <RenameDialog
              id={ id }
              name={ project.name }
              open={ this.state.renameDialog } 
              onSave={ name => {
                this.closeRenameDialog();
                this.rename(id, name);
              } }
              onClose={ this.closeRenameDialog } />

            <IconButton onClick={ () => this.props.onDelete(id) }>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
    return <List>{ projectList }</List>;
  }
}

export default ProjectList;
