import React from 'react';
import { useSelector } from 'react-redux';
import { getPanels, getProjectItems } from 'store-selectors';

import { Typography } from '@material-ui/core';

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
          const { env: envId, type, astString, valString } = vals[valId];
          
          let string;
          switch (type) {
            case 'closure':
              string = astString;
              break;
            case 'bool':
              string = valString;
              break;
            default:
              string = `'${type}' value type unsupported`;
              break;
          }

          const envElem = envId ? <EnvLink envId={ envId } /> : undefined;
          return (
            <Spacer
              key={ valId }
              childrenStyle={{ marginRight: 5 }}>
              <Typography display='inline'>{ string }</Typography>
              { envElem }
            </Spacer>);
        });
      return [entry.varString, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}
