import React, { Fragment } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';

function PanelViewer(props) {
  const { label, panels } = props;
  const savedPanels = Object.entries(panels)
    .filter(props.onFilterSaved)
    .map(props.onGenerate);
  const unsavedPanels = Object.entries(panels)
    .filter(props.onFilterUnsaved)
    .map(props.onGenerate);
  const content = [...savedPanels, ...unsavedPanels];

  return (
    <Fragment>
      <ViewerLabel content={ label } />
      <div style={{ overflowY: 'auto' }}>
        { content }
      </div>
    </Fragment>);
}

function ViewerLabel(props) {
  const theme = props.theme;
  return (
    <Toolbar
      variant='dense'
      style={{
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        minHeight: 'auto'
      }}>
      <Typography>{ props.content }</Typography>
    </Toolbar>);
}
ViewerLabel = withTheme(ViewerLabel);

export default PanelViewer;