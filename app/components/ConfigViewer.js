import React, { useContext } from 'react';
import Link from '@material-ui/core/Link';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import Context from './Context';
import Panel from './Panel';
import PanelTable from './PanelTable';
import PanelViewer from './PanelViewer';

function ConfigViewer(props) {
  const { configs } = props;
  const items = useContext(Context);

  function deleteConfig(configId) {
    configs[configId].hide();
    props.onSave(configs);
  }
  function save(configId) {
    configs[configId].save();
    props.onSave(configs);
  }
  function unsave(configId) {
    configs[configId].unsave();
    props.onSave(configs);
  }
  function select(configId) {
    configs[configId].select();
    props.onRefresh();
    props.onSave(configs);
  }
  function unselect(configId) {
    configs[configId].unselect();
    props.onRefresh();
    props.onSave(configs);
  }

  function onGenerate([configId, config]) {
    const { label, selected, saved, noItems } = config;

    const panelProps = {
      defaultExpanded: config.default
    };
    if (saved)
      panelProps.onUnsave = () => unsave(configId);
    else
      panelProps.onSave = () => save(configId);
    if (selected)
      panelProps.onUnselect = () => unselect(configId);
    else
      panelProps.onSelect = () => select(configId);
    
    /*if (config.noEnvs) {
      panelProps.disableSelect = true;
      panelProps.disableSelectMsg = 'No environments';
    }*/

    return (
      <Panel
        key={ configId }
        label={ (noItems ? `${label} (empty)` : label) }
        onMouseOver={ () => props.onHover([configId]) }
        onMouseOut={ () => props.onHover([]) }
        { ...panelProps }
        onDelete={ () => deleteConfig(configId) }>
        <Config
          configId={ configId }
          onAdd={ props.onAdd } />
      </Panel>);
  }
  function onFilterSaved([configId, config]) {
    const saved = config.saved;
    const temp = !['not found', 'non-func'].includes(items.configs[configId].form);
    return saved && temp;
  }
  function onFilterUnsaved([configId, config]) {
    const unsaved = !config.saved && config.visible;
    const temp = !['not found', 'non-func'].includes(items.configs[configId].form);
    return unsaved && temp;
  }
  const funcProps = { onFilterSaved, onFilterUnsaved, onGenerate };
  return <PanelViewer
    label='Configurations'
    panels={ configs }
    { ...funcProps } />;
}
function Config(props) {
  const items = useContext(Context);
  const { configId, onAdd } = props;

  const labels = ['instr', 'stack', 'env'];
  const config = items.configs[configId];
  let entries = [];
  if (config.states)
    entries = config.states
      .map(stateId => {
        const { form, instr, kont, env } = items.states[stateId];
        let entry;
        switch (form) {
          case 'halt':
            entry = [];
            break;
          default:
            const instrEntries = items.instr[instr]
              .exprStrings.join(', ');
            let envElem;
            if (env)
              envElem = (
                <Tooltip title='View environment'>
                  <Link onClick={ () => onAdd(env) }>
                    { env }
                  </Link>
                </Tooltip>);

            const kontEntries = items.konts[kont].descs
              .map((kont, index) => <Typography key={ index }>{ kont }</Typography>);

            entry = [`[ ${instrEntries} ]`, kontEntries, envElem];
            break;
        }
        return entry;
      });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}

export default ConfigViewer;
