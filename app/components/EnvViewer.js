import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { showEnv } from 'store-actions';
import { getPanels, getProjectItems } from 'store-selectors';

import { Link, Tooltip, Typography } from '@material-ui/core';

import Panel from './Panel';
import { PanelTable, PanelViewer } from 'library';

function EnvViewer(props) {
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
  const dispatch = useDispatch();

  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = items;
  const env = envs[envId];
  const entries = env
    .map(entry => {
      const instrEntries = instr[entry.instr]
        .exprStrings.join(', ');
      const storeEntries = store[entry.addr]
        .map(valId => {
          const { env, type, astString, valString } = vals[valId];
          
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

          let addEnvLink;
          if (env)
            addEnvLink = (
              <Tooltip title='View environment'>
                <Link onClick={ () => dispatch(showEnv(env)) }>
                  <sup>
                    { env }
                  </sup>
                </Link>
              </Tooltip>);

          return (
            <Typography key={ valId }>
              { string }
              { addEnvLink }
            </Typography>);
        });
      return [entry.varString, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}
