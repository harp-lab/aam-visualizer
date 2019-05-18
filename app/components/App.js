import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Menu from './Menu';
import ProjectList from './ProjectList';
import Project from './Project';

import ProjectData from './data/Project'

const VIEWS = {
  list: 'list',
  project: 'project'
};

const styles = {
  menu: {
    flex: '1 1 auto'
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

class App extends Component {
  constructor(props) {
    super(props);

    const view = VIEWS.list;
    const title = undefined;
    const selectedProjectId = undefined;
    const projects = {};
    this.state = {
      view,
      title,
      selectedProjectId,
      projects
    };

    this.requestAllProjects = this.requestAllProjects.bind(this);
    this.selectProject = this.selectProject.bind(this);
    this.deselectProject = this.deselectProject.bind(this);
    this.createProject = this.createProject.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.saveLocalProject = this.saveLocalProject.bind(this);
    this.requestAllProjects();
  }
  requestAllProjects() {
    return fetch('/api/project?all', { method: 'GET' })
    .then(response => {
      switch (response.status) {
        case 200:
          return response.json()
          .then(data => {
            this.setState(state => {
              const projects = state.projects;
              let refresh = false;
              for (const [projectId, projectData] of Object.entries(data)) {
                let project = projects[projectId];
                if (!project) {
                  project = new ProjectData();
                  projects[projectId] = project;
                }
                project.status = projectData.status;
                project.name = projectData.name;
                if (project.status == project.STATUSES.process)
                  refresh = true;
              }
              if (refresh)
                setTimeout(this.requestAllProjects, 5000)
              return { projects };
            });
          });
        default:
          setTimeout(this.requestAllProjects, 1000);
          break;
      }
    });
  }
  createProject() {
    return fetch('/api/project?create', { method: 'GET' })
    .then(response => response.json())
    .then(data => {
      const projectId = data.id;
      const view = VIEWS.list;
      const selectedProjectId = undefined;
      this.setState((state, props) => {
        const projects = state.projects;
        projects[projectId] = new ProjectData();
        return { view, selectedProjectId, projects };
      });
    });
  }
  deleteProject(projectId) {
    return fetch(`/api/project?id=${projectId}`, { method: 'DELETE' })
    .then(this.setState((state, props) => {
      const selectedProjectId = undefined;
      const projects = state.projects;
      delete projects[projectId];
      return { selectedProjectId, projects }
    }));
  }
  
  get selectedProject() { return this.state.projects[this.state.selectedProjectId]; }
  selectProject(projectId) {
    this.setState({
      view: VIEWS.project,
      selectedProjectId: projectId
    });
  }
  deselectProject(projectId) {
    this.setState((state, proj) => {
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
    let title, view;
    const selectedProjectId = this.state.selectedProjectId;

    switch (this.state.view) {
      case VIEWS.list:
        view = <ProjectList
          data={ this.state.projects }
          onClick={ this.selectProject }
          onSave={ this.saveLocalProject }
          onDelete={ this.deleteProject } />;
        break;
      case VIEWS.project:
        const project = this.selectedProject;
        title = project.name || selectedProjectId;
        view = <Project
          id={ selectedProjectId }
          project = { this.selectedProject }
          onSave={ project => this.saveLocalProject(selectedProjectId, project) } />
        break;
    }

    return (
      <div style={ {
        display: 'flex',
        flexDirection: 'column',
        height: '100%' } }>
        <AppBar position='static'>
          <Toolbar>
            <ProjectListButton onClick={ this.deselectProject } />
            <Typography
              variant='title'
              color='inherit'
              style={ {
                flex: '1 1 auto',
                textAlign: 'center'
              } }>
              { title }
            </Typography>
            <NewProjectButton onClick={ this.createProject } />
          </Toolbar>
        </AppBar>
        { view }
      </div>
    );
  }
}

export default App;
