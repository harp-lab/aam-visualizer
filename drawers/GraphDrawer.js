import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { MenuItem, Select } from '@material-ui/core';
import { Share } from '@material-ui/icons';
import { IconButton, PaneToolbarDrawer } from 'library/base';
import { Graph } from 'library/connected';
import { getGraphIds } from 'store/selectors';

function GraphDrawer() {
  const graphs = useSelector(getGraphIds);
  const [graph, setGraph] = useState(graphs[0]);
  const [open, setOpen] = useState(false);

  const iconColor = open ? 'primary' : 'inherit';

  const graphItems = graphs.map(graphId => {
    return (
      <MenuItem
        key={ graphId }
        value={ graphId }>
        { graphId }
      </MenuItem>);
  });

  return (
    <Fragment>
      <IconButton
        icon={ <Share color={ iconColor } /> }
        tooltip='Show graph'
        onClick={ () => setOpen(!open) } />
      <PaneToolbarDrawer open={ open }>
        <Select
          value={ graph }
          onChange={ evt => setGraph(evt.target.value) }>
          { graphItems }
        </Select>
        <Graph graphId={ graph } external style={{ height: '100%' }}/>
      </PaneToolbarDrawer>
    </Fragment>);
}

export default GraphDrawer;
