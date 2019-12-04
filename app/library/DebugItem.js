import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  typography: {
    marginRight: 10
  }
}));

function DebugItem(props) {
  const { item } = props;
  const { debug } = item;
  const classes = useStyles();

  if (!debug) return <Typography>Debug property undefined</Typography>;
  
  let content;
  if (debug instanceof String) {
    content = <Typography>{ debug }</Typography>;
  } else if (debug instanceof Array) {
    content = debug.map((debugString, index) => {
      return (
        <div
          key={ index }
          style={{ display: 'flex' }}>
          <Typography classes={{ root: classes.typography }}>
            •
          </Typography>
          <Typography>
            { debugString }
          </Typography>
        </div>);
    });
  } else {
    content = <Typography>Invalid debug property type: { typeof debug }</Typography>;
  }
  return content;
}

export default DebugItem;
