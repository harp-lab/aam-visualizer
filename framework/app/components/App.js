import React from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@material-ui/core';
import { ThemeProvider, withTheme, makeStyles } from '@material-ui/styles';
import { DeleteDialog, RenameDialog } from 'components/dialogs';
import { LOGIN_VIEW, LIST_VIEW, PROJECT_VIEW } from 'store/consts';
import { getView, isDevEnv } from 'store/selectors';

import AppBar from './AppBar';
import Login from './Login';
import ProjectList from './ProjectList';
import Project from './Project';
import Theme from './Theme';
import Snackbar from './Snackbar';

const useStyles = makeStyles(theme => ({
  message: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

function App() {
  const view = useSelector(getView);
  const devEnv = useSelector(isDevEnv);

  let viewElem;
  switch (view) {
    case LOGIN_VIEW:
      viewElem = <Login />;
      break;
    case LIST_VIEW:
      viewElem = <ProjectList />;
      break;
    case PROJECT_VIEW:
      viewElem = <Project />;
      break;
  }
  
  return (
    <ThemeProvider theme={ Theme }>
      <VersionOverlay />
      <div
        // remove default drag/drop behavior
        onDragEnter={ evt => evt.preventDefault() }
        onDragOver={ evt => {
          evt.preventDefault();
          evt.dataTransfer.dropEffect = 'none';
        }}
        onDrop={ evt => evt.preventDefault() }

        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
        { (devEnv && <Message content='Development Server'/>) }
        <AppBar />
        { viewElem }
        <Snackbar />
        <DeleteDialog />
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
        pointerEvents: 'none',
        zIndex: -1
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
  const classes = useStyles();

  return (
    <Typography
      style={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: theme.palette.warn.main,
        color: theme.palette.warn.contrastText
      }}
      className={ classes.message }>
      { content }
    </Typography>);
}
Message = withTheme(Message);
