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

class ProjectList extends Component {
  constructor(props) {
    super(props);

    const rename = false;
    this.state = { rename }

    this.rename = this.rename.bind(this);
    this.closeRenameDialog = this.closeRenameDialog.bind(this);
  }
  openRenameDialog(projectId) {
    const selectedProjectId = projectId;
    const rename = true;
    this.setState({ selectedProjectId, rename });
  }
  closeRenameDialog() {
    const selectedProjectId = undefined;
    const rename = false;
    this.setState({ selectedProjectId, rename });
  }
  rename(projectId, name) {
    // save local
    const project = this.props.data[projectId];
    project.name = name;
    this.props.onSave(projectId, project);

    // save server
    return fetch(`/api/projects/${projectId}/save`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  render() {
    const projectList = Object.entries(this.props.data).map(([id, project]) => {
      return (
        <ListItem
          button
          key={ id }
          onClick={ () => this.props.onClick(id) }
          align='flex-start'>
          <ListItemText style={ { flex: '0 0 10em' } }>{ id }</ListItemText>
          <ListItemText>{ (project.name || 'unnamed') }</ListItemText>
          <ListItemText style={ { flex: '0 0 10em' } }>{ project.status }</ListItemText>
          <ListItemSecondaryAction>
            <ProjectMenu
              onRename={ () => this.openRenameDialog(id) }
              onFork={ () => this.props.onFork(id) } />
            <IconButton onClick={ () => this.props.onDelete(id) }>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    });

    let dialog;
    const id = this.state.selectedProjectId;
    const project = this.props.data[id];
    if (id) {
      if (this.state.rename) {
        dialog = <RenameDialog
          open
          id={ id }
          name={ project.name }
          onSave={ this.rename }
          onClose={ this.closeRenameDialog } />;
      }
    }
    
    return (
      <React.Fragment>
        <List
          style={ { overflowY: 'auto' } }>
          { projectList }
        </List>
        { dialog }
      </React.Fragment>
    );
  }
}

class ProjectMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }
  open(event) { this.setState({ anchor: event.currentTarget }); }
  close() { this.setState({ anchor: undefined }); }
  render() {
    return (
      <React.Fragment>
        <IconButton onClick={ this.open }>
          <MoreHorizIcon />
        </IconButton>

        <Menu
          anchorEl={ this.state.anchor }
          open={ Boolean(this.state.anchor) }
          onClose={ this.close } >
          <MenuItem
            onClick={ () => {
              this.close();
              this.props.onRename();
            } }>
            rename
          </MenuItem>
          <MenuItem
            onClick={ () => {
              this.close();
              this.props.onFork();
            } }>
            fork
          </MenuItem>
        </Menu>
      </React.Fragment>
    );
  }
}

class RenameDialog extends Component {
  constructor(props) {
    super(props);

    const name = (this.props.name || '');
    this.state = { name };

    this.changeName = this.changeName.bind(this);
  }
  changeName(event) { this.setState({ name: event.target.value }); }
  componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name)
      this.setState({ name: this.props.name });
  }
  render() {
    return (
    <Dialog
      open={ this.props.open }
      onClose={ this.props.onClose }>
      <DialogContent>
        <TextField
          label='name'
          value={ this.state.name }
          onChange={ this.changeName }
          placeholder={ `project ${this.props.id} name` } />
      </DialogContent>
      <DialogActions>
        <Button onClick={ this.props.onClose }>cancel</Button>
        <Button
          onClick={ () => {
            this.props.onClose();
            this.props.onSave(this.props.id, this.state.name)
          } }>
          rename
        </Button>
      </DialogActions>
    </Dialog>);
  }
}

export default ProjectList;
