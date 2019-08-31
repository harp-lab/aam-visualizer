import React, { useContext } from 'react';
import Link from '@material-ui/core/Link';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import Context from './Context';
import Panel from './Panel';
import PanelTable from './PanelTable';
import PanelViewer from './PanelViewer';

function EnvViewer(props) {
  const envs = props.envs;
  const items = useContext(Context);

  function deleteEnv(envId) {
    envs[envId].hide();
    props.onSave(envs);
  }
  function save(envId) {
    envs[envId].save();
    props.onSave(envs);
  }
  function unsave(envId) {
    envs[envId].unsave();
    props.onSave(envs);
  }
  function select(envId) {
    envs[envId].select();
    props.onSave(envs);
  }
  function unselect(envId) {
    envs[envId].unselect();
    props.onSave(envs);
  }

  function onGenerate([envId, env]) {
    const { label, selected, saved } = env;

    const panelProps = {
      defaultExpanded: env.default
    };
    if (saved)
      panelProps.onUnsave = () => unsave(envId);
    else
      panelProps.onSave = () => save(envId);
    if (selected)
      panelProps.onUnselect = () => unselect(envId);
    else
      panelProps.onSelect = () => select(envId);

    return (
      <Panel
        key={ envId }
        label={ items.envs[envId].length > 0 ? label : `${label} (empty)` }
        onMouseOver={ () => {} } // TODO implement env hovering
        onMouseOut={ () => {} }
        { ...panelProps }
        onDelete={ () => deleteEnv(envId) }>
        <EnvItem
          envId={ envId }
          onAdd={ props.onAdd } />
      </Panel>);
  }
  function onFilterSaved([envId, env]) {
    return env.saved;
  }
  function onFilterUnsaved([envId, env]) {
    return !env.saved && env.visible;
  }
  const funcProps = { onFilterSaved, onFilterUnsaved, onGenerate };
  return <PanelViewer
    label='Environments'
    panels={ envs }
    { ...funcProps } />;
}

function EnvItem(props) {
  const { envId, onAdd } = props
  const items = useContext(Context);
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
                <Link onClick={ () => onAdd(env) }>
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

export default EnvViewer;
