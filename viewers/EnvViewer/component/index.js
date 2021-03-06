import React from 'react';
import { useSelector } from 'react-redux';
import { PanelViewer } from 'library/base';
import { Panel } from 'library/connected';
import { getPanels } from 'store/selectors';

import { ENV_PANEL } from 'fext/store/consts';

import EnvItem from './EnvItem';

function EnvViewer() {
  const envs = useSelector(state => getPanels(state, ENV_PANEL));

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
