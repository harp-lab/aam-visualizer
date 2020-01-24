import React from 'react';
import { CircularProgress, ListItemIcon, Tooltip } from '@material-ui/core';
import {
  AddCircle as AddCircleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PauseCircleFilled as PauseCircleFilledIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS } from 'store-consts';

const useStyles = makeStyles(theme => ({
  success: { color: theme.palette.success.main },
  tooltip:  { textTransform: 'capitalize' }
}));

/**
 * @param {Object} props 
 * @param {String} props.status project status
 */
function Status(props) {
  const { status } = props;
  const classes = useStyles();

  let elem;
  switch (status) {
    case EMPTY_STATUS:
      elem = <AddCircleIcon color='disabled' />;
      break;
    case EDIT_STATUS:
      elem = <PauseCircleFilledIcon color='primary' />;
      break;
    case PROCESS_STATUS:
      elem = <CircularProgress
        size={ 20 }
        thickness={ 6 } />;
      break;
    case COMPLETE_STATUS:
      elem = <CheckCircleIcon classes={{ root: classes.success }} />;
      break;
    case ERROR_STATUS:
      elem = <ErrorIcon color='error' />;
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

export default Status;
