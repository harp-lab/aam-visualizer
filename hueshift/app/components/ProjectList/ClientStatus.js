import React from 'react';
import { useSelector } from 'react-redux';
import { ListItemIcon, Tooltip } from '@material-ui/core';
import {
  CloudDone as CloudDoneIcon,
  CloudDownload as CloudDownloadIcon,
  CloudOff as CloudOffIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { CLIENT_WAITING_STATUS, CLIENT_DOWNLOADED_STATUS, CLIENT_LOCAL_STATUS } from 'store/consts';
import { getProjectClientStatus } from 'store/selectors';

const useStyles = makeStyles(theme => ({
  icon: { color: theme.palette.text.secondary },
  tooltip: { textTransform: 'capitalize' }
}));

/**
 * Display project client status
 * @param {Object} props 
 * @param {String} props.projectId project id
 */
function ClientStatus(props) {
  const { projectId } = props;
  const status = useSelector(state => getProjectClientStatus(state, projectId));
  const classes = useStyles();

  let elem;
  switch (status) {
    case CLIENT_LOCAL_STATUS:
      elem = <CloudOffIcon classes={{ root: classes.icon }} />;
      break;
    case CLIENT_DOWNLOADED_STATUS:
      elem = <CloudDoneIcon classes={{ root: classes.icon }} />;
      break;
    case CLIENT_WAITING_STATUS:
      elem = <CloudDownloadIcon classes={{ root: classes.icon }} />;
      break;
    default:
      elem = status;
      break;
  }
  
  return (
    <ListItemIcon>
      <Tooltip
        title={ status }
        classes={{ tooltip: classes.tooltip }}>
        { elem }
      </Tooltip>
    </ListItemIcon>);
}

export default ClientStatus;
