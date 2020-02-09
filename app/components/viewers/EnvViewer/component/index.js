import React from 'react';
import { useSelector } from 'react-redux';
import Panel from 'component-viewers/Panel';
import { PanelViewer } from 'library';
import { getPanels } from 'store-selectors';

import EnvItem from './EnvItem';

function EnvViewer() {
  const { envs } = useSelector(getPanels);

  function onGenerate([envId, env]) {
    return (
      <Panel
        key={ envId }
        panelId={ envId }
        panelType='envs'
        onMouseOver={ () => {} } // TODO implement env hovering
        onMouseOut={ () => {} }
        disableSelect
        disableSelectMsg='No action'>
        <EnvItem envId={ envId } />
      </Panel>);
  }

  return <PanelViewer
    label='Environments'
    panels={ envs }
    onGenerate={ onGenerate } />;
}

export default EnvViewer;
