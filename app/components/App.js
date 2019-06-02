import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Loading from './Loading.js';
import ProjectList from './ProjectList';
import Project from './Project';

import ProjectData from './data/Project'

const VIEWS = {
  load: 'load',
  list: 'list',
  project: 'project'
};

class App extends Component {
  constructor(props) {
    super(props);

    const load = false;
    const view = VIEWS.list;
    const title = undefined;
    const selectedProjectId = undefined;
    const projects = {};
    this.state = {
      load,
      view,
      title,
      selectedProjectId,
      projects
    };

    this.getProjectList = this.getProjectList.bind(this);
    this.selectProject = this.selectProject.bind(this);
    this.deselectProject = this.deselectProject.bind(this);
    this.createProject = this.createProject.bind(this);
    this.forkProject = this.forkProject.bind(this);
    this.deleteProject = this.deleteProject.bind(this);

    this.saveLocalProject = this.saveLocalProject.bind(this);
    this.getProjectList();
  }

  // api requests
  async getProjectList() {
    const response = await fetch('/api/all', { method: 'GET' });
    switch (response.status) {
      case 200:
        const data = await response.json();
        this.setState(state => {
          const projects = state.projects;

          let refresh = false;
          for (const [id, metadata] of Object.entries(data)) {
            let project = projects[id];

            // create project
            if (!project) {
              project = new ProjectData();
              projects[id] = project;
            }

            project.status = metadata.status;
            project.name = metadata.name;
            project.analysis = metadata.analysis;

            if (project.status == project.STATUSES.process)
              refresh = true;
          }

          // refresh list
          if (refresh)
            setTimeout(this.getProjectList, 5000);
          const load = false;
          return { load, projects };
        });
        break;
      default:
        this.setState({ load: true });
        setTimeout(this.getProjectList, 1000);
        break;
    }
  }
  async createProject() {
    const response = await fetch('/api/create', { method: 'GET' });
    const data = await response.json();

    const projectId = data.id;
    const view = VIEWS.list;
    const selectedProjectId = undefined;
    this.setState(state => {
      const projects = state.projects;
      projects[projectId] = new ProjectData();
      return { view, selectedProjectId, projects };
    });

    return projectId;
  }
  async deleteProject(projectId) {
    const response = await fetch(`/api/projects/${projectId}/delete`, { method: 'PUT' });
    switch (response.status) {
      case 205:
        this.setState(state => {
          // delete project
          const projects = state.projects;
          delete projects[projectId];
  
          // clear selected project id
          let selectedProjectId = state.selectedProjectId;
          if (selectedProjectId == projectId)
            selectedProjectId = undefined;
  
          return { selectedProjectId, projects }
        })
        break;
      case 404:
        //TODO notify delete error
        break;
    }
  }
  async forkProject(projectId) {
    // get project code
    const status = this.state.projects[projectId].status;
    switch (status) {
      case 'empty':
        break;
      default:
        await this.getProjectCode(projectId);
        break;
    }

    // fork project
    const forkProjectId = await this.createProject();
    this.setState(state => {
      const projects = state.projects;
      const forkProject = projects[forkProjectId];
      const project = projects[projectId];
      forkProject.code = project.code;
      return { projects };
    });

    // select fork project
    this.selectProject(forkProjectId);
  }
  async getProjectCode(projectId) {
    const response = await fetch(`/api/projects/${projectId}/code`, { method: 'GET' });
    const data = await response.json();

    const project = this.state.projects[projectId];
    project.code = data.code;
    this.saveLocalProject(projectId, project);
  }

  get selectedProject() { return this.state.projects[this.state.selectedProjectId]; }
  selectProject(projectId) {
    this.setState({
      view: VIEWS.project,
      selectedProjectId: projectId
    });
  }
  deselectProject(projectId) {
    this.setState(state => {
      return {
        view: VIEWS.list,
        selectedProjectId: undefined
      };
    });
  }
  saveLocalProject(projectId, project) {
    this.setState((state, props) => {
      const projects = state.projects;
      projects[projectId] = project;
      return { projects };
    });
  }

  render() {
    let title, buttons, view;
    const selectedProjectId = this.state.selectedProjectId;

    switch (this.state.view) {
      case VIEWS.list:
        if (this.state.load) {
          view = <Loading status='Getting projects' variant='linear'/>;
        } else
          view = <ProjectList
            data={ this.state.projects }
            onClick={ this.selectProject }
            onSave={ this.saveLocalProject }
            onFork = { this.forkProject }
            onDelete={ this.deleteProject } />;
        
        buttons = <NewProjectButton onClick={ this.createProject } />;
        break;
      case VIEWS.project:
        const project = this.selectedProject;
        title = project.name || selectedProjectId;
        view = <Project
          id={ selectedProjectId }
          project = { this.selectedProject }
          onSave={ project => this.saveLocalProject(selectedProjectId, project) }
          getCode={ () => this.getProjectCode(selectedProjectId) } />
        
        buttons = <ForkProjectButton onClick={ () => this.forkProject(selectedProjectId) } />;
        break;
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden' }}>
        <AppBar position='static'>
          <Toolbar>
            <ProjectListButton onClick={ this.deselectProject }/>
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
            { buttons }
          </Toolbar>
        </AppBar>
        { view }
      </div>);
  }
}

class ProjectListButton extends Component {
  render() {
    return <Button
      onClick={ (event) => {
        event.stopPropagation();
        this.props.onClick();
      } }
      color='inherit'>
      project list
    </Button>;
  }
}

class NewProjectButton extends Component {
  render() {
    return <Button
      onClick={ (event) => {
        event.stopPropagation();
        this.props.onClick();
      } }
      color='inherit'
      variant='outlined'>
      new project
    </Button>;
  }
}

class ForkProjectButton extends Component {
  render() {
    return <Button
      onClick={ event => {
        this.props.onClick();
      } }
      color='inherit'
      variant='outlined'>
      fork project
    </Button>
  }
}

export default App;
