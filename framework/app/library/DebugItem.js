import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  typography: {
    fontWeight: 700,
    lineHeight: 2,
    marginRight: 10
  }
}));

/**
 * Renders debug content
 * @param {Object} props 
 * @param {Object} props.item data item
 * @returns rendered component
 */
function DebugItem(props) {
  const { item } = props;
  const { debug } = item;
  const classes = useStyles();

  if (!debug) return <Typography>Debug property undefined</Typography>;
  
  let content;
  if (typeof debug === 'string') {
    content = <Typography>{ debug }</Typography>;
  } else if (debug instanceof Array) {
    content = debug.map((debugString, index) => {
      return (
        <div
          key={ index }
          style={{ display: 'flex' }}>
          <Typography
            variant='caption'
            classes={{ root: classes.typography }}>
            { index }
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
