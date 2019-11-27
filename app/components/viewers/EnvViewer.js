import React from 'react';
import { useSelector } from 'react-redux';
import { ValItem } from 'component-items';
import { PanelTable, PanelViewer } from 'library';
import { getPanels, getProjectItems } from 'store-selectors';

import Panel from './Panel';

/**
 * Renders env panel viewer
 */
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

/**
 * Renders env item
 * @param {Object} props component props
 * @param {String} props.envId env id
 */
function EnvItem(props) {
  const { envId } = props
  const items = useSelector(getProjectItems);

  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = items;
  const env = envs[envId];
  const entries = env.entries
    .map(entry => {
      const instrEntries = instr[entry.instr]
        .exprStrings.join(', ');
      const storeEntries = store[entry.addr]
        .map(valId => {
          return <ValItem
            key={ valId }
            valId={ valId }
            envId={ envId } />;
        });
      return [entry.varString, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}
