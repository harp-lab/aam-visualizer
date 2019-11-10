import React from 'react';
import { useSelector } from 'react-redux';
import { ValItem } from 'component-items';
import { getPanels, getProjectItems } from 'store-selectors';

import Panel from '../Panel';
import { PanelTable, PanelViewer, Spacer } from 'library';

import { EnvLink } from '../links';

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

function EnvItem(props) {
  const { envId } = props
  const items = useSelector(getProjectItems);

  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = items;
  const env = envs[envId];
  const entries = env
    .map(entry => {
      const instrEntries = instr[entry.instr]
        .exprStrings.join(', ');
      const storeEntries = store[entry.addr]
        .map(valId => {
          const envElem = envId ? <EnvLink envId={ envId } /> : undefined;
          return (
            <Spacer
              key={ valId }
              childrenStyle={{ marginRight: 5 }}>
              <ValItem
                valId={ valId }
                style={{ display: 'inline-block' }} />
              { envElem }
            </Spacer>);
        });
      return [entry.varString, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}
