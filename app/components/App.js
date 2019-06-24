import React, { useState, useEffect, useRef } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ThemeProvider from '@material-ui/styles/ThemeProvider';
import Theme from './Theme';
import Loading from './Loading.js';
import ProjectList from './ProjectList';
import Project from './Project';

import ProjectData from './data/Project'

const VIEWS = {
  load: 'load',
  list: 'list',
  project: 'project'
};

function App(props) {
  const [load, setLoad] = useState(false);
  const [view, setView] = useState(VIEWS.list);
  const [snackbarQueue, setSnackbarQueue] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);
  const [projects, setProjects] = useState({});
  const refProjects = useRef(projects);
  useEffect(() => { refProjects.current = projects; });

  useEffect(() => {
    async function getProjectList() {
      const res = await fetch('/api/all', { method: 'GET' });
      switch (res.status) {
        case 200:
          const data = await res.json();
          let refresh = false;
          const updatedProjects = {...projects};
          for (const [id, metadata] of Object.entries(data)) {
            let project = updatedProjects[id];

            // create project
            if (!project) {
              project = new ProjectData();
              updatedProjects[id] = project;
            }

            project.status = metadata.status;
            project.name = metadata.name;
            project.analysis = metadata.analysis;

            if (project.status == project.STATUSES.process)
              refresh = true;
          }

          // refresh list
          if (refresh)
            setTimeout(getProjectList, 5000);

          setLoad(false);
          setProjects(updatedProjects);
          break;
        default:
          setLoad(true);
          setTimeout(getProjectList, 1000);
          break;
      }
    }
    getProjectList();
  }, []);

  async function createProject() {
    const res = await fetch('/api/create', { method: 'GET' });
    const data = await res.json();

    const projectId = data.id;
    saveLocalProject(projectId, new ProjectData());
    setView(VIEWS.list);
    setSelectedProjectId(undefined);

    return projectId;
  }
  async function deleteProject(projectId) {
    const res = await fetch(`/api/projects/${projectId}/delete`, { method: 'PUT' });
    switch (res.status) {
      case 205:
        deleteLocalProject(projectId);
        if (selectedProjectId == projectId)
          setSelectedProjectId(undefined);
        break;
      case 404:
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
    const forkProject = refProjects.current[forkProjectId];
    forkProject.code = projects[projectId].code;
    saveLocalProject(forkProjectId, forkProject);
    selectProject(forkProjectId);
    setView(VIEWS.project);
  }
  async function getProjectCode(projectId) {
    const response = await fetch(`/api/projects/${projectId}/code`, { method: 'GET' });
    const data = await response.json();

    const project = projects[projectId];
    project.code = data.code;
    saveLocalProject(projectId, project);
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
  function saveLocalProject(projectId, project) { setProjects({...refProjects.current, [projectId]: project}); }
  function deleteLocalProject(projectId) {
    const {[projectId]: _, ...rest} = refProjects.current;
    setProjects(rest);
  }

  function queueSnackbar(message) { setSnackbarQueue([...snackbarQueue, message]); }
  function nextSnackbar() {
    const [first, ...rest] = snackbarQueue;
    setSnackbarQueue(rest);
  }

  let viewElement, title, buttonsElement;
  switch (view) {
    case VIEWS.list:
      buttonsElement = <NewProjectButton onClick={ createProject } />;
      if (load)
        viewElement = <Loading status='Getting projects' variant='linear'/>;
      else
        viewElement = <ProjectList
            data={ projects }
            onClick={ selectProject }
            onSave={ saveLocalProject }
            onFork = { forkProject }
            onDelete={ deleteProject } />;
      break;
    case VIEWS.project:
      const project = getSelectedProject();
      title = project.name || selectedProjectId;
      buttonsElement = <ForkProjectButton onClick={ () => forkProject(selectedProjectId) } />;
      viewElement = <Project
        id={ selectedProjectId }
        project = { getSelectedProject() }
        onSave={ project => saveLocalProject(selectedProjectId, project) }
        onNotify={ queueSnackbar }
        getCode={ () => getProjectCode(selectedProjectId) } />;
      break;
  }

  let messageElement;
  if (process.env.NODE_ENV == 'development')
    messageElement = <Message
      content='Development Server'/>;
  
  const appbarElement = (
    <AppBar position='static'>
      <Toolbar>
        <ProjectListButton onClick={ deselectProject }/>
        <Typography
          variant='h6'
          color='inherit'
          style={ {
            flex: '1 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center'
          } }>
          { title }
        </Typography>
        { buttonsElement }
      </Toolbar>
    </AppBar>);
  
  return (
    <ThemeProvider theme={ Theme }>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden' }}>
        { messageElement }
        { appbarElement}
        { viewElement }
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
        backgroundColor: Theme.palette.warning.main,
        color: Theme.palette.warning.contrastText
      }}>
      {props.content}
    </Typography>);
}

function ProjectListButton(props) {
  return <Button
    onClick={ (event) => {
      event.stopPropagation();
      props.onClick();
    }}
    color='inherit'>
    project list
  </Button>;
}
function NewProjectButton(props) {
  return <Button
    onClick={ (event) => {
      event.stopPropagation();
      props.onClick();
    }}
    color='inherit'
    variant='outlined'>
    new project
  </Button>;
}
function ForkProjectButton(props) {
  return <Button
    onClick={ event => {
      props.onClick();
    }}
    color='inherit'
    variant='outlined'>
    fork project
  </Button>;
}

function NotifySnackbar(props) {
  function handleClose(event, reason) {
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
        onClick={onClose}
        color='inherit' >
        <CloseIcon />
      </IconButton>
    ]}
    autoHideDuration={ 20000 }
    message={ message }
    anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }} />;
}

export default App;
