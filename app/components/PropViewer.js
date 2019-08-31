import React, { Fragment, useContext } from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import SplitPane from './SplitPane';
import Pane from './Pane';
import Panel from './Panel';
import Context from './Context';
import PanelViewer from './PanelViewer';

function PropViewer(props) {
    const { metadata } = props;
    const { configs, envs } = metadata;
    
    function addEnv(envId) {
      envs[envId].show();
      props.onSave({ envs: envs });
    }

    return (
      <SplitPane>
        <Pane width="50%" overflow='auto'>
          <ConfigsViewer
            configs={ configs }
            onAdd={ addEnv }
            onHover={ props.onHover }
            onSave={ configs => props.onSave({ configs }) }
            onRefresh={ props.onRefreshEnvs } />
        </Pane>
        <Pane width="50%" overflow='auto'>
          <EnvsViewer
            envs={ envs }
            onAdd={ addEnv }
            onSave={ envs => props.onSave({ envs }) } />
        </Pane>
      </SplitPane>);
}

function ConfigsViewer(props) {
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
    
    if (config.noEnvs) {
      panelProps.disableSelect = true;
      panelProps.disableSelectMsg = 'No environments';
    }

    return (
      <Panel
        key={ configId }
        label={ (noItems ? `${label} (empty)` : label) }
        onMouseOver={ () => props.onHover([configId]) }
        onMouseOut={ () => props.onHover([]) }
        { ...panelProps }
        onDelete={ () => deleteConfig(configId) }>
        <ConfigItem
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
function EnvsViewer(props) {
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

function ConfigItem(props) {
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
  return <Item
    labels={ labels }
    entries={ entries }/>;
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
  return <Item
    labels={ labels }
    entries={ entries }/>;
}
function Item(props) {
  const labels = props.labels
    .map(label => <TableCell key={ label }>{ label }</TableCell>);
  const entries = props.entries
    .map((entry, row) => {
      const fields = entry.map((field, cell) => <TableCell key={ cell }>{ field }</TableCell>);
      return <TableRow key={ row }>{ fields }</TableRow>;
    });
  return (
    <Fragment>
      <Table size='small'>
        <TableHead>
          <TableRow>{ labels }</TableRow>
        </TableHead>
        <TableBody>
          { entries }
        </TableBody>
      </Table>
    </Fragment>);
}

export default PropViewer;
