import React, { Fragment, useState, useEffect, useRef, useContext } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ThemeProvider from '@material-ui/styles/ThemeProvider';

import Store, { StoreContext, useActions } from './Store';
import DropMenu from './DropMenu';
import Loading from './Loading';
import Login from './Login';
import ProjectList from './ProjectList';
import Project from './Project';
import Theme from './Theme';
import ProjectData from './data/Project'

const VIEWS = {
  login: 'login',
  load: 'load',
  list: 'list',
  project: 'project'
};

function AppWithStore(props) {
  return (
    <Store>
      <App />
    </Store>);
}
function App(props) {
  const [load, setLoad] = useState(false);
  const [view, setView] = useState(VIEWS.user);
  const [snackbarQueue, setSnackbarQueue] = useState([]);
  const [userId, setUserId] = useState(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);

  const { store, dispatch } = useContext(StoreContext);
  const { setProjects } = useActions(store, dispatch);

  const projects = store.projects;

  useEffect(() => { setProjects({}) }, [userId]);

  async function createProject() {
    const res = await fetch(`/api/${userId}/create`, { method: 'GET' });
    const data = await res.json();

    const projectId = data.id;
    saveLocalProject(projectId, new ProjectData(userId));
    setView(VIEWS.list);
    setSelectedProjectId(undefined);

    return projectId;
  }
  async function cancelProject(projectId) {
    const res = await fetch(`/api/${userId}/projects/${projectId}/cancel`, { method: 'POST' });
    switch (res.status) {
      case 200:
        const project = projects[projectId];
        project.status = project.STATUSES.edit;
        saveLocalProject(projectId, project);
        break;
      case 409:
        queueSnackbar(`Project ${projectId} cancel request denied - already finished`)
        break;
      default:
        queueSnackbar(`Project ${projectId} cancel request failed`);
        break;
    }
  }
  async function deleteProject(projectId) {
    const res = await fetch(`/api/${userId}/projects/${projectId}/delete`, { method: 'POST' });
    switch (res.status) {
      case 205:
        deleteLocalProject(projectId);
        if (selectedProjectId == projectId)
          setSelectedProjectId(undefined);
        break;
      default:
        queueSnackbar(`Project ${projectId} delete request failed`);
        break;
    }
  }
  async function forkProject(projectId) {
    // get project code
    const project = projects[projectId];
    if (project.status !== project.STATUSES.empty)
      await getProjectCode(projectId);

    // fork project
    const forkProjectId = await createProject();
    const forkProject = projects[forkProjectId];
    forkProject.code = projects[projectId].code;
    saveLocalProject(forkProjectId, forkProject);
    selectProject(forkProjectId);
    setView(VIEWS.project);
  }
  async function getProjectCode(projectId) {
    const response = await fetch(`/api/${userId}/projects/${projectId}/code`, { method: 'GET' });
    const data = await response.json();

    const project = projects[projectId];
    project.code = data.code;
    saveLocalProject(projectId, project);
  }
  async function getProjectData(projectId) {
    const res = await fetch(`/api/${userId}/projects/${projectId}/data`, { method: 'GET' });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const project = projects[projectId];
        project.import(data);
        saveLocalProject(projectId, project);
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
    const project = new ProjectData(userId);
    project.import(data);
    saveLocalProject(projectId, project);
  }
  async function exportProject(projectId) {
    const project = projects[projectId];
    await getProjectData(projectId);

    // get project data
    const data = project.export();
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
    setSelectedProjectId(projectId);
    setView(VIEWS.project);
  }
  function deselectProject(projectId) {
    setSelectedProjectId(undefined);
    setView(VIEWS.list);
  }
  function saveLocalProject(projectId, project) {
    projects[projectId] = project;
    setProjects(projects);
  }
  function deleteLocalProject(projectId) {
    delete projects[projectId];
    setProjects(projects);
  }

  function queueSnackbar(message) { setSnackbarQueue([...snackbarQueue, message]); }
  function nextSnackbar() {
    const [first, ...rest] = snackbarQueue;
    setSnackbarQueue(rest);
  }

  function logout() {
    setUserId(undefined);
    setView(VIEWS.user);
  }

  function ProjectListButton(props) {
    return <AppBarButton
      content='project list'
      onClick={ deselectProject } />;
  }

  let viewElem, title, leftElems, rightElems;
  switch (view) {
    case VIEWS.user:
      viewElem = <Login 
        onSubmit={ userId => {
          setUserId(userId);
          setView(VIEWS.list);
        }} />;
      break;
    case VIEWS.list:
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
            onProjectsUpdate={ setProjects }
            onSave={ saveLocalProject }
            onFork={ forkProject }
            onCancel={ cancelProject }
            onDelete={ deleteProject }
            onExport={ exportProject }
            onLoad={ setLoad } />;
      break;
    case VIEWS.project:
      const project = getSelectedProject();
      title = project.name || selectedProjectId;
      leftElems = <ProjectListButton />;
      /* for expansion
        <DropMenu
          items={ [
            { label: 'Logout', callback: logout }
          ] } />
      */
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
        onSave={ project => saveLocalProject(selectedProjectId, project) }
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
        <NotifySnackbar
          queue={ snackbarQueue }
          onClose={ nextSnackbar } />
      </div>
    </ThemeProvider>);
}

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
  function handleClose(evt, reason) {
    if (reason !== 'clickaway')
      props.onClose();
  }

  const message = props.queue[0];
  const onClose = props.onClose;

  return <Snackbar
    open={ Boolean(message) }
    onClose={ handleClose }
    action={[
      <IconButton
        key='close'
        onClick={ onClose }
        color='inherit' >
        <CloseIcon />
      </IconButton>
    ]}
    autoHideDuration={ 20000 }
    message={ message }
    anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }} />;
}

export default AppWithStore;
