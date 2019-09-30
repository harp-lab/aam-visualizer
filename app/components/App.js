import React, { Fragment, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { setUser, setView  } from '../redux/actions/data';
import { addProject, setProjectData, delProject, selProject } from '../redux/actions/projects';
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

const VIEWS = {
  login: 'login',
  load: 'load',
  list: 'list',
  project: 'project'
};

function App(props) {
  const [load, setLoad] = useState(false);

  const { userId, view, projects, selectedProjectId } = props;
  const { setUser, setView, addProject, setProjectData, delProject, selProject, queueSnackbar } = props;

  //useEffect(() => { setProjects({}) }, [userId]);

  async function createProject() {
    const res = await fetch(`/api/${userId}/create`, { method: 'GET' });
    const data = await res.json();

    const projectId = data.id;
    addProject(projectId);
    setView(LIST_VIEW);
    selProject(undefined);

    return projectId;
  }
  async function cancelProject(projectId) {
    const res = await fetch(`/api/${userId}/projects/${projectId}/cancel`, { method: 'POST' });
    switch (res.status) {
      case 200:
        const project = projects[projectId];
        project.status = project.STATUSES.edit;
        setProjectData(projectId, project);
        break;
      case 409:
        queueSnackbar(`Project ${projectId} cancel request denied - already finished`)
        break;
      default:
        queueSnackbar(`Project ${projectId} cancel request failed`);
        break;
    }
  }
  async function forkProject(projectId) {
    // get project code
    const project = projects[projectId].data;
    if (project.status !== project.STATUSES.empty)
      await getProjectCode(projectId);

    // fork project
    const forkProjectId = await createProject();
    const { code, analysis } = project;
    const forkProject = {};
    forkProject.code = code;
    forkProject.analysis = analysis;
    setProjectData(forkProjectId, forkProject);
    selectProject(forkProjectId);
    setView(PROJECT_VIEW);
  }
  async function getProjectCode(projectId) {
    const response = await fetch(`/api/${userId}/projects/${projectId}/code`, { method: 'GET' });
    const data = await response.json();

    const project = projects[projectId].data;
    project.code = data.code;
    setProjectData(projectId, project);
  }
  async function getProjectData(projectId) {
    const res = await fetch(`/api/${userId}/projects/${projectId}/data`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const project = projects[projectId];
        //project.import(data);
        setProjectData(projectId, project);
        break;
      case 204:
        queueSnackbar('Project still processing');
        break;
      case 412:
        queueSnackbar('Project data request rejected');
        break;
    }
  }
  function importProject(projectId, data) {
    addProject(projectId);
    setProjectData(projectId, data);
  }
  async function exportProject(projectId) {
    await getProjectData(projectId);
    const project = projects[projectId];

    // get project data
    const data = project.data;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // create elem
    const href = URL.createObjectURL(blob);
    const file = `aam-vis-${projectId}.json`
    const elem = document.createElement('a');
    Object.assign(elem, {
      href,
      download: file
    });
    document.body.appendChild(elem);
    elem.click();

    // cleanup
    elem.remove();
    URL.revokeObjectURL(href);
  }

  function getSelectedProject() { return projects[selectedProjectId]; }
  function selectProject(projectId) {
    selProject(projectId);
    setView(PROJECT_VIEW);
  }
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
          <ImportButton onImport={ importProject } />
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
        viewElem = <ProjectList
            userId={ userId }
            projects={ projects }
            onClick={ selectProject }
            onFork={ forkProject }
            onCancel={ cancelProject }
            onExport={ exportProject }
            onLoad={ setLoad } />;
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
            onClick={ () => exportProject(selectedProjectId) } />
          <AppBarButton
            content='logout'
            onClick={ logout } />
        </Fragment>);
      viewElem = <Project
        userId={ userId }
        projectId={ selectedProjectId }
        project = { getSelectedProject() }
        onSave={ project => setProjectData(selectedProjectId, project) }
        onNotify={ queueSnackbar }
        getCode={ () => getProjectCode(selectedProjectId) } />;
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
  { setUser, setView, addProject, setProjectData, delProject, selProject, queueSnackbar }
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

