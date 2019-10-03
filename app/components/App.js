import React, { Fragment, useState, useEffect, useRef } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { createProject, forkProject, importData, exportData } from 'store-apis';
import { setUser, setView, selProject, delProjects, dequeueSnackbar } from 'store-actions';
import { getUser, getView, getTitle, getSelectedProjectId, getSnackbar } from 'store-selectors';
import { LOGIN_VIEW, LIST_VIEW, PROJECT_VIEW } from 'store-consts';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ThemeProvider from '@material-ui/styles/ThemeProvider';

import Login from './Login';
import ProjectList from './ProjectList';
import Project from './Project';
import Theme from './Theme';
import RenameDialog from './dialogs/Rename';

function App(props) {
  const userId = useSelector(getUser);
  const view = useSelector(getView);
  const title = useSelector(getTitle);
  const selectedProjectId = useSelector(getSelectedProjectId);
  const dispatch = useDispatch();

  useEffect(() => { dispatch(delProjects()) }, [userId]);

  function deselectProject() {
    dispatch(selProject(undefined));
    dispatch(setView(LIST_VIEW));
  }

  function logout() {
    dispatch(setUser(undefined));
    dispatch(setView(LOGIN_VIEW));
  }

  function ProjectListButton(props) {
    return <AppBarButton
      content='project list'
      onClick={ deselectProject } />;
  }

  let viewElem, leftElems, rightElems;
  switch (view) {
    case LOGIN_VIEW:
      viewElem = <Login 
        onSubmit={ userId => {
          dispatch(setUser(userId));
          dispatch(setView(LIST_VIEW));
        }} />;
      break;
    case LIST_VIEW:
      leftElems = <ProjectListButton />;
      rightElems = (
        <Fragment>
          <ImportButton />
          <AppBarButton
            content='new project'
            onClick={ () => dispatch(createProject()) } />
          <AppBarButton
            content='logout'
            onClick={ logout } />
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
          <AppBarButton
            content='logout'
            onClick={ logout } />
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
        <NotifySnackbar />
        <RenameDialog />
      </div>
    </ThemeProvider>);
}
export default App;

function Message(props) {
  return (
    <Typography
      style={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: Theme.palette.warn.main,
        color: Theme.palette.warn.contrastText
      }}>
      {props.content}
    </Typography>);
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

function ImportButton(props) {
  const input = useRef(undefined);
  const dispatch = useDispatch();

  function change(file) {
    const fr = new FileReader();
    fr.onload = () => {
      const json = JSON.parse(fr.result);
      const re = /aam-vis-(.*)\.js/;
      const projectId = file.name.match(re)[1];
      dispatch(importData(projectId, json));
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

function NotifySnackbar(props) {
  const { message, dequeueSnackbar } = props;

  const [timer, setTimer] = useState(undefined);

  // update on store change
  useEffect(() => {
    if (message)
      setTimer(setTimeout(() => {
        update();
      }, 20000));
  }, [message]);

  function update() {
    clearTimeout(timer);
    dequeueSnackbar();
  }
  function handleClose(evt, reason) {
    if (reason !== 'clickaway')
      update();
  }

  return <Snackbar
    open={ Boolean(message) }
    onClose={ handleClose }
    action={[
      <IconButton
        key='close'
        onClick={ update }
        color='inherit' >
        <CloseIcon />
      </IconButton>
    ]}
    autoHideDuration={ 20000 }
    message={ message }
    anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }} />;
}
const mapStateToProps1 = state => {
  const message = getSnackbar(state);
  return { message };
};
NotifySnackbar = connect(
  mapStateToProps1,
  { dequeueSnackbar }
)(NotifySnackbar);

