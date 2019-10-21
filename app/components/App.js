import React, { Fragment, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createProject, forkProject, importData, exportData } from 'store-apis';
import { logout, selProject, queueSnackbar } from 'store-actions';
import { LOGIN_VIEW, LIST_VIEW, PROJECT_VIEW } from 'store-consts';
import { getView, getTitle, getSelectedProjectId } from 'store-selectors';

import { AppBar, Button, Toolbar, Typography } from '@material-ui/core';
import { ThemeProvider, withTheme } from '@material-ui/styles';

import Login from './Login';
import ProjectList from './ProjectList';
import Project from './Project';
import Theme from './Theme';
import { RenameDialog } from './dialogs';
import Snackbar from './Snackbar';

function App() {
  const view = useSelector(getView);
  const title = useSelector(getTitle);
  const selectedProjectId = useSelector(getSelectedProjectId);
  const dispatch = useDispatch();

  let viewElem, leftElems, rightElems;
  switch (view) {
    case LOGIN_VIEW:
      viewElem = <Login />;
      break;
    case LIST_VIEW:
      leftElems = <ProjectListButton />;
      rightElems = (
        <Fragment>
          <ImportButton />
          <AppBarButton
            content='new project'
            onClick={ () => dispatch(createProject()) } />
          <LogoutButton />
        </Fragment>);
      viewElem = <ProjectList />;
      break;
    case PROJECT_VIEW:
      leftElems = <ProjectListButton />;
      rightElems = (
        <Fragment>
          <AppBarButton
            content='fork project'
            onClick={ () => dispatch(forkProject(selectedProjectId)) } />
          <AppBarButton
            content='export project'
            onClick={ () => dispatch(exportData(selectedProjectId)) } />
          <LogoutButton />
        </Fragment>);
      viewElem = <Project />;
      break;
  }
  
  const appbarElem = (
    <AppBar position='static'>
      <Toolbar>
        { leftElems }
        <Typography
          variant='h6'
          color='inherit'
          style={{
            flex: '1 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center'
          }}>
          { title }
        </Typography>
        { rightElems }
      </Toolbar>
    </AppBar>);
  
  return (
    <ThemeProvider theme={ Theme }>
      <VersionOverlay />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
        { (process.env.NODE_ENV == 'development' && <Message content='Development Server'/>) }
        { appbarElem}
        { viewElem }
        <Snackbar />
        <RenameDialog />
      </div>
    </ThemeProvider>);
}
export default App;

function VersionOverlay() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        position: 'fixed',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
      <Typography
        variant='caption'
        color='textSecondary'
        style={{ padding: 5 }}>
        { process.env.VERSION }
      </Typography>
    </div>);
}

function Message(props) {
  const { content, theme } = props;
  return (
    <Typography
      style={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: theme.palette.warn.main,
        color: theme.palette.warn.contrastText
      }}>
      { content }
    </Typography>);
}
Message = withTheme(Message);

function ProjectListButton() {
  const dispatch = useDispatch();
  return <AppBarButton
    content='project list'
    onClick={ () => dispatch(selProject(undefined)) } />;
}
function LogoutButton() {
  const dispatch = useDispatch();
  return <AppBarButton
    content='logout'
    onClick={ userId => dispatch(logout(userId)) } />
}
function ImportButton() {
  const input = useRef(undefined);
  const dispatch = useDispatch();

  function change(file) {
    const fr = new FileReader();
    fr.onload = () => {
      const json = JSON.parse(fr.result);
      const re = /aam-vis-(.*)\.json/;
      const filename = file.name;
      const reGroups = filename.match(re);
      if (reGroups) {
        const projectId = reGroups[1];
        dispatch(importData(projectId, json));
      } else
        dispatch(queueSnackbar(`'${filename}' file name incorrectly formatted ('aam-vis-<projectId>.json')`));
    };
    fr.readAsText(file);
    input.current.value = '';
  }

  return (
    <Fragment>
      <AppBarButton
        content='import'
        onClick={ () => input.current.click() } />
      <input
        ref={ input }
        onChange={ () => change(input.current.files[0]) }
        type='file'
        hidden />
    </Fragment>);
}
function AppBarButton(props) {
  const { content, onClick } = props;
  return (
    <Button
      onClick={ onClick }
      color='inherit'
      variant='outlined'
      style={{ margin: Theme.spacing(1) }}>
      { content }
    </Button>);
}
