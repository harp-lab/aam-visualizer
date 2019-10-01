import React, { Fragment, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { createProject, forkProject, importData, exportData } from '../redux/api/server';
import { setUser, setView  } from '../redux/actions/data';
import { setProjectData, selProject } from '../redux/actions/projects';
import { queueSnackbar, dequeueSnackbar } from '../redux/actions/notifications';
import { getUser, getView } from '../redux/selectors/data';
import { getProjects, getSelectedProjectId } from '../redux/selectors/projects';
import { getSnackbar } from '../redux/selectors/notifications';
import { LOGIN_VIEW, LOAD_VIEW, LIST_VIEW, PROJECT_VIEW } from '../redux/consts';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ThemeProvider from '@material-ui/styles/ThemeProvider';

import Loading from './Loading';
import Login from './Login';
import ProjectList from './ProjectList';
import Project from './Project';
import Theme from './Theme';

function App(props) {
  const [load, setLoad] = useState(false);

  const { userId, view, projects, selectedProjectId } = props;
  const { setUser, setView, createProject, forkProject, setProjectData, importData, exportData, selProject, queueSnackbar } = props;

  //useEffect(() => { setProjects({}) }, [userId]);

  function getSelectedProject() { return projects[selectedProjectId]; }
  function deselectProject(projectId) {
    selProject(undefined);
    setView(LIST_VIEW);
  }

  function logout() {
    setUser(undefined);
    setView(LOGIN_VIEW);
  }

  function ProjectListButton(props) {
    return <AppBarButton
      content='project list'
      onClick={ deselectProject } />;
  }

  let viewElem, title, leftElems, rightElems;
  switch (view) {
    case LOGIN_VIEW:
      viewElem = <Login 
        onSubmit={ userId => {
          setUser(userId);
          setView(LIST_VIEW);
        }} />;
      break;
    case LIST_VIEW:
      leftElems = <ProjectListButton />;
      rightElems = (
        <Fragment>
          <ImportButton onImport={ importData } />
          <AppBarButton
            content='new project'
            onClick={ createProject } />
          <AppBarButton
            content='logout'
            onClick={ logout } />
        </Fragment>);
      if (load)
        viewElem = <Loading status='Getting projects' variant='linear'/>;
      else
        viewElem = <ProjectList onLoad={ setLoad } />;
      break;
    case PROJECT_VIEW:
      const project = getSelectedProject();
      title = project.data.name || selectedProjectId;
      leftElems = <ProjectListButton />;
      rightElems = (
        <Fragment>
          <AppBarButton
            content='fork project'
            onClick={ () => forkProject(selectedProjectId) } />
          <AppBarButton
            content='export project'
            onClick={ () => exportData(selectedProjectId) } />
          <AppBarButton
            content='logout'
            onClick={ logout } />
        </Fragment>);
      viewElem = <Project
        userId={ userId }
        projectId={ selectedProjectId }
        project = { getSelectedProject() }
        onSave={ project => setProjectData(selectedProjectId, project) }
        onNotify={ queueSnackbar } />;
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
      </div>
    </ThemeProvider>);
}
const mapStateToProps = state => {
  const userId = getUser(state);
  const view = getView(state);
  const projects = getProjects(state);
  const selectedProjectId = getSelectedProjectId(state);
  return { userId, view, projects, selectedProjectId };
};
export default connect(
  mapStateToProps,
  { setUser, setView, createProject, forkProject, setProjectData, selProject, queueSnackbar, importData, exportData }
)(App);

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

  function change(file) {
    const fr = new FileReader();
    fr.onload = () => {
      const json = JSON.parse(fr.result);
      const re = /aam-vis-(.*)\.js/;
      const projectId = file.name.match(re)[1];
      props.onImport(projectId, json);
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

