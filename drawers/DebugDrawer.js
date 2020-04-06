import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { BugReport } from '@material-ui/icons';
import { DebugItem, IconButton, PaneToolbarDrawer } from 'library/base';
import { getProjectAnalysisOutput } from 'store/selectors';

function DebugDrawer() {
  const analOut = useSelector(getProjectAnalysisOutput);
  const { debug } = analOut;
  const [open, setOpen] = useState(false);

  if (!debug)
    return null;
  
  const iconColor = open ? 'primary' : 'inherit';
  
  return (
    <Fragment>
      <IconButton
        icon={ <BugReport color={ iconColor } /> }
        tooltip='Show debug'
        onClick={ () => setOpen(!open) } />
      <PaneToolbarDrawer open={ open }>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            height: '100%',
            margin: '1em'
          }}>
          <DebugItem item={ analOut } />
        </div>
      </PaneToolbarDrawer>
    </Fragment>);
}

export default DebugDrawer;
