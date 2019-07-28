import React, { Fragment, useEffect, useContext } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import DeleteIcon from '@material-ui/icons/Delete';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import withTheme from '@material-ui/styles/withTheme';
import withStyles from '@material-ui/styles/withStyles';

import SplitPane from './SplitPane';
import Pane from './Pane';
import PaneMessage from './PaneMessage';
import Context from './Context';
import PanelData from './data/Panel';

function PropViewer(props) {
    const { selectedNodes, metadata } = props;
    const items = useContext(Context);

    let configs = metadata.configs || {};
    let envs = metadata.envs || {};
    useEffect(() => {
      if (Object.entries(configs).length == 0)
        Object.entries(items.configs)
          .forEach(([configId, config]) => {
            const configPanel = new PanelData(configId);

            configPanel.noItems = true;
            configPanel.noEnvs = true;

            const stateIds = config.states;
            if (stateIds) {
              configPanel.noItems = false;

              for (const stateId of stateIds) {
                const envId = items.states[stateId].env;
                if (envId)
                  configPanel.noEnvs = false;
              }
            }
            configs[configId] = configPanel;
          });
      if (Object.entries(envs).length == 0)
        Object.keys(items.envs)
          .forEach(envId => envs[envId] = new PanelData(envId));
      props.onSave({ configs, envs });
    }, []);

    // TODO make below code only run on selectedNodes change
    // show configs if node selected
    const selectedConfigIds = selectedNodes;
    for (const [configId, config] of Object.entries(configs)) {
      if (selectedConfigIds.includes(configId)) {
        if (items.configs[configId].form !== 'not found')  // TODO remove check for not adding 'not found' state configs
          config.show();
      } else
        config.hide();
    }

    // show envs of visible and selected configs
    for (const [configId, config] of Object.entries(configs)) {
      if (config.visible && config.selected) {
        // get states
        const statesIds = items.configs[configId].states;
        if (statesIds)
          for (const stateId of statesIds) {
            const state = items.states[stateId];
            // get env
            const envId = state.env;
            if (envId)
              envs[envId].show();
          }
      }
    }

    
    function cleanEnvs() {
      for (const env of Object.values(envs))
        env.hide();
      props.onSave({ envs: envs });
    }
    function addEnv(envId) {
      envs[envId].show();
      props.onSave({ envs: envs });
    }

    return (
      <SplitPane>
        <Pane width="50%" overflow='auto'>
          <ConfigsViewer
            configs={ configs }
            onSave={ configs => props.onSave({ configs }) }
            onClean={ cleanEnvs } />
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
  const configs = props.configs;

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
    props.onSave(configs);
  }
  function unselect(configId) {
    //props.onClean();
    configs[configId].unselect();
    props.onSave(configs);
  }

  let element;
  if (configs) {
    function generatePanel([configId, config]) {
      const { label, selected, saved } = config;

      const panelProps = {};
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
          label={ ( config.noItems ? label : `${label} (empty)`) }
          { ...panelProps }
          onDelete={ () => deleteConfig(configId) }>
          <ConfigItem configId={ configId } />
        </Panel>);
    }

    const savedElement = Object.entries(configs)
      .filter(([configId, config]) => config.saved)
      .map(generatePanel);
    const unsavedElement = Object.entries(configs)
      .filter(([configId, config]) => !config.saved && config.visible)
      .map(generatePanel);

    element = savedElement.concat(unsavedElement);
  } else
    element = <PaneMessage content='Empty' />;
  return (
    <Fragment>
      <ViewerLabel content='Configurations' />
      <div style={{ overflowY: 'auto' }}>
        { element }
      </div>
    </Fragment>);
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

  let element;
  if (envs) {
    function generatePanel([envId, env]) {
      const { label, selected, saved } = env;

      const panelProps = {};
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
          { ...panelProps }
          onDelete={ () => deleteEnv(envId) }>
          <EnvItem
            envId={ envId }
            onAdd={ props.onAdd } />
        </Panel>);
    }

    const savedElement = Object.entries(envs)
      .filter(([envId, env]) => env.saved)
      .map(generatePanel);
    const unsavedElement = Object.entries(envs)
      .filter(([envId, env]) => !env.saved && env.visible)
      .map(generatePanel);

    element = savedElement.concat(unsavedElement);
  } else
    element = <PaneMessage content='Empty' />;
  return (
    <Fragment>
      <ViewerLabel content='Environments' />
      <div style={{ overflowY: 'auto' }}>
        { element }
      </div>
    </Fragment>);
}

function ViewerLabel(props) {
  const theme = props.theme;
  return (
    <Toolbar
      variant='dense'
      style={{
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        minHeight: 'auto'
      }}>
      <Typography>{ props.content }</Typography>
    </Toolbar>);
}
ViewerLabel = withTheme(ViewerLabel);

function Panel(props) {
  let saveButton, selectButton;
  if (props.onSave)
    saveButton = <Button
      icon={ <StarBorderIcon /> }
      tooltip='Save'
      onClick={ props.onSave } />;
  else if (props.onUnsave)
    saveButton = <Button
      icon={ <StarIcon /> }
      tooltip='Unsave'
      onClick={ props.onUnsave } />;

  if (props.disableSelect)
    selectButton = <Button
      icon={ <IndeterminateCheckBoxIcon color='disabled'/> }
      tooltip={ props.disableSelectMsg }
      disabled />;
  else if (props.onSelect)
    selectButton = <Button
      icon={ <CheckBoxOutlineBlankIcon /> }
      tooltip='Select'
      onClick={ props.onSelect } />;
  else if (props.onUnselect)
    selectButton = <Button
      icon={ <CheckBoxIcon /> }
      tooltip='Unselect'
      onClick={ props.onUnselect } />;
  
  const deleteButton = <Button
    icon={ <DeleteIcon /> }
    tooltip='Delete'
    onClick={ props.onDelete } />;
  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={ <ExpandMoreIcon /> }
        classes={{ content: props.classes.content }}>
        { selectButton }
        { saveButton }
        { deleteButton }
        <Typography variant='body2'>{ props.label }</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>{ props.children }</ExpansionPanelDetails>
    </ExpansionPanel>);
}
Panel = withStyles({
  content: { alignItems: 'center' }
})(Panel);
function Button(props) {
  const { icon, tooltip, disabled, onClick } = props;
  const iconButtonProps = {};
  if (disabled) {
    iconButtonProps.disableRipple = true;
    iconButtonProps.onClick = evt => {
      evt.stopPropagation();
    };
  }
  else {
    iconButtonProps.onClick = evt => {
      evt.stopPropagation();
      onClick();
    };
  }
  return (
    <Tooltip title={ tooltip }>
      <IconButton
        size='small'
        { ...iconButtonProps }>
        { icon }
      </IconButton>
    </Tooltip>);
}

function ConfigItem(props) {
  const items = useContext(Context);
  const labels = ['syntax', 'instr', 'stack'];
  const { configs, states, instr, konts } = items;
  const config = configs[props.configId];
  let entries = [];
  if (config.states)
    entries = config.states
      .map(stateId => {
        const state = states[stateId];
        const instrEntries = instr[state.instr]
          .exprStrings.join(', ');
        const kontEntries = konts[state.kont].string
          .map((kont, index) => <Typography key={ index }>{ kont }</Typography>);
        return [state.exprString, `[ ${instrEntries} ]`, kontEntries]
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
          const { astString, env } = vals[valId];
          return (
            <Typography key={ valId }>
              <Tooltip title='View environment'>
                <Link onClick={ () => onAdd(env) }>{ astString }</Link>
              </Tooltip>
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
