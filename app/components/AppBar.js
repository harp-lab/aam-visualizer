import React, { Fragment, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppBar as MUIAppBar, Button, Toolbar, Typography } from '@material-ui/core';
import { makeStyles, withTheme } from '@material-ui/styles';
import { createProject, forkProject, importData, exportData } from 'store-apis';
import { logout, selProject, queueSnackbar } from 'store-actions';
import { LIST_VIEW, PROJECT_VIEW } from 'store-consts';
import { getView, getTitle, getSelectedProjectId } from 'store-selectors';

const useStyles = makeStyles(theme => ({
  appbar: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

function AppBar() {
  const view = useSelector(getView);
  const title = useSelector(getTitle);
  const selectedProjectId = useSelector(getSelectedProjectId);
  const dispatch = useDispatch();
  const classes = useStyles();

  let leftElems, rightElems;
  switch (view) {
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
      break;
  }
  
  const appbarElem = (
    <MUIAppBar
      position='static'
      className={ classes.appbar }>
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
    </MUIAppBar>);
  
  return appbarElem;
}
export default AppBar;

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

  function save(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const json = JSON.parse(fr.result);
        const re = /(?:(.*)(?=\.))?\.?(.*)/;
        const filename = file.name;
        const reGroups = filename.match(re);
        if (reGroups) {
          const [_, name, ext] = reGroups;
          let projectId;
          if (name) projectId = name;
          else projectId = ext;
          dispatch(importData(projectId, json));
        }
      } catch(err) {
        const { name, message } = err;
        switch (err.constructor) {
          case SyntaxError:
            dispatch(queueSnackbar(`Import failed: ${file.name} is not valid JSON`));
            break;
          default:
            dispatch(queueSnackbar(`${name}: ${message}`));
            break;
        }
      }
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
        onInput={ () => save(input.current.files[0]) }
        type='file'
        hidden />
    </Fragment>);
}
function AppBarButton(props) {
  const { content, theme, onClick } = props;
  return (
    <Button
      onClick={ onClick }
      color='inherit'
      variant='outlined'
      style={{ margin: theme.spacing(1) }}>
      { content }
    </Button>);
}
AppBarButton = withTheme(AppBarButton);
