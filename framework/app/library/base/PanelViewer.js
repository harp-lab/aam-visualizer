import React, { Fragment } from 'react';
import { Toolbar, Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

function PanelViewer(props) {
  const { label, panels } = props;
  const savedPanels = Object.entries(panels)
    .filter(([panelId, panelData]) => {
      const { saved } = panelData;
      const result = saved;
      let filter = true;
      if (props.onFilterSaved)
        filter = props.onFilterSaved([panelId, panelData]);
      return result && filter;
    })
    .map(props.onGenerate);
  const unsavedPanels = Object.entries(panels)
    .filter(([panelId, panelData]) => {
      const { saved, hidden } = panelData;
      const result = !saved && !hidden;
      let filter = true;
      if (props.onFilterUnsaved)
        filter = props.onFilterUnsaved([panelId, panelData]);
      return result && filter;
    })
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
