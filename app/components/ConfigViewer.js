import React, { useContext } from 'react';
import { Link, Tooltip, Typography } from '@material-ui/core'

import ItemContext from './ItemContext';
import Panel from './Panel';
import PanelTable from './PanelTable';
import PanelViewer from './PanelViewer';

function ConfigViewer(props) {
  const { configs } = props;
  const items = useContext(ItemContext);

  function onGenerate([configId, config]) {
    const { label } = config;

    return (
      <Panel
        key={ configId }
        panelId={ configId }
        panelData={ config }
        label={ label }
        onMouseOver={ () => props.onHover([configId]) }
        onMouseOut={ () => props.onHover([]) }
        onSelect={ props.onRefresh }
        onUnselect={ props.onRefresh }
        onSave={ props.onSave }>
        <Config
          configId={ configId }
          onShowEnv={ props.onShowEnv }
          onShowKont={ props.onShowKont } />
      </Panel>);
  }
  function onFilterSaved([configId, config]) {
    return !['not found', 'non-func'].includes(items.configs[configId].form);
  }
  function onFilterUnsaved([configId, config]) {
    return !['not found', 'non-func'].includes(items.configs[configId].form);
  }
  const funcProps = { onFilterSaved, onFilterUnsaved };
  return <PanelViewer
    label='Configurations'
    panels={ configs }
    onGenerate={ onGenerate }
    { ...funcProps } />;
}
function Config(props) {
  const items = useContext(ItemContext);
  const { configId, onShowEnv, onShowKont } = props;

  const labels = ['instr', 'stack', 'env'];
  const config = items.configs[configId];
  const entries = []
  config.states.forEach(stateId => {
      const { form, instr, kont, env } = items.states[stateId];
      switch (form) {
        case 'halt': {
          entries.push([]);
          break;
        }
        default: {
          const instrEntries = items.instr[instr]
            .exprStrings.join(', ');

          let kontElem;
          if (kont)
            kontElem = (
              <Tooltip title='View environment'>
                <Link onClick={ () => onShowKont(kont) }>
                  { kont }
                </Link>
              </Tooltip>);
          
          let envElem;
          if (env)
            envElem = (
              <Tooltip title='View environment'>
                <Link onClick={ () => onShowEnv(env) }>
                  { env }
                </Link>
              </Tooltip>);

          entries.push([`[ ${instrEntries} ]`, kontElem, envElem]);
          break;
        }
      }
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}

export default ConfigViewer;
