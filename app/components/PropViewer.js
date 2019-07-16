import React, { Fragment, useEffect, useContext } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
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

function arrayFind(array, id) { return array.find(elem => elem.id == id); }
function arrayDelete(arr, id) { return arr.filter(elem => elem.id !== id); }

function PropViewer(props) {
    const { element, metadata } = props;
    const items = useContext(Context);
    const { configs, states } = items;

    const viewedConfigs = metadata.configs || [];
    const viewedEnvs = metadata.envs || [];
    if (viewedConfigs)
      viewedConfigs
        .filter(config => config.selected)
        .forEach(({ id }) => {
          const config = configs[id];

          if (config.states)
            config.states
              .forEach(stateId => {
                const state = states[stateId];
                if (state.env)
                  addEnv(state.env);
              });
        });
    
    function cleanEnvs() {
      const cleanedEnvs = viewedEnvs.filter(env => env.saved);
      props.onSave({ envs: cleanedEnvs });
    }
    function addEnv(envId) {
      const match = arrayFind(viewedEnvs, envId);
      if (!match) {
        viewedEnvs.unshift({
          label: envId,
          id: envId
        });
        props.onSave({ envs: viewedEnvs });
      }
    }

    /*let dataElement;
    if (element)
      dataElement = <DataViewer data={ element.data } />;
    else
      dataElement = <Typography variant='h6'>No element selected</Typography>;*/

    return (
      <SplitPane>
        <Pane width="50%" overflow='auto'>
          <ConfigsViewer
            configs={ viewedConfigs }
            onSave={ configs => props.onSave({ configs }) }
            onClean={ cleanEnvs } />
        </Pane>
        <Pane width="50%" overflow='auto'>
          <EnvsViewer
            envs={ viewedEnvs }
            onAdd={ addEnv }
            onSave={ envs => props.onSave({ envs }) } />
        </Pane>
      </SplitPane>);;
}

function DataViewer(props) {
  const data = props.data;
  let element;
  if (data) {
    const dataItems = Object.entries(data)
    .map(([id, data]) => {
      const string = typeof data == 'object' ? data.toString() : data;
      const output = string || 'undefined';
      return (
        <ListItem key={ id }>
          <ListItemText
            primary={ id }
            secondary={ output } />
        </ListItem>);
    });
    element = <List>{ dataItems }</List>;
  } else
    element = <PaneMessage content='No data available' />

  return element;
}

function ConfigsViewer(props) {
  const configs = props.configs;
  const items = useContext(Context);

  function deleteConfig(configId) { props.onSave( arrayDelete(configs, configId) ); }
  function save(configId) {
    arrayFind(configs, configId).saved = true;
    props.onSave(configs);
  }
  function unsave(configId) {
    arrayFind(configs, configId).saved = false;
    props.onSave(configs);
  }
  function select(configId) {
    arrayFind(configs, configId).selected = true;
    props.onSave(configs);
  }
  function unselect(configId) {
    props.onClean();
    arrayFind(configs, configId).selected = false;
    props.onSave(configs);
  }

  let element;
  if (configs && configs.length > 0) {
    function generatePanel(config) {
      const { label, id, selected, saved } = config;

      const panelProps = {};
      if (saved)
        panelProps.onUnsave = () => unsave(id);
      else
        panelProps.onSave = () => save(id);
      if (selected)
        panelProps.onUnselect = () => unselect(id);
      else
        panelProps.onSelect = () => select(id);
      
      const states = items.configs[id].states;
      let noEnvs = true;
      if (states)
        states.forEach(stateId => {
          const env = items.states[stateId].env;
          if (env)
            noEnvs = false;
        });
      if (noEnvs) {
        panelProps.disableSelect = true;
        panelProps.disableSelectMsg = 'No environments';
      }

      return (
        <Panel
          key={ id }
          label={ ( states ? label : `${label} (empty)`) }
          { ...panelProps }
          onDelete={ () => deleteConfig(id) }>
          <ConfigItem configId={ id } />
        </Panel>);
    }

    const savedElement = configs
      .filter(config => config.saved)
      .map(generatePanel);
    const unsavedElement = configs
      .filter(config => !config.saved)
      .map(generatePanel);

    element = savedElement.concat(unsavedElement);
  } else
    element = <PaneMessage content='Empty' />;
  return (
    <Fragment>
      <ViewerLabel content='Configurations' />
      { element }
    </Fragment>);
}
function EnvsViewer(props) {
  const envs = props.envs;
  const items = useContext(Context);

  function deleteEnv(envId) { props.onSave( arrayDelete(envs, envId) ); }
  function save(envId) {
    arrayFind(envs, envId).saved = true;
    props.onSave(envs);
  }
  function unsave(envId) {
    arrayFind(envs, envId).saved = false;
    props.onSave(envs);
  }
  function select(envId) {
    arrayFind(envs, envId).selected = true;
    props.onSave(envs);
  }
  function unselect(envId) {
    arrayFind(envs, envId).selected = false;
    props.onSave(envs);
  }

  let element;
  if (envs && envs.length > 0) {
    function generatePanel(env) {
      const { label, id, selected, saved } = env;

      const panelProps = {};
      if (saved)
        panelProps.onUnsave = () => unsave(id);
      else
        panelProps.onSave = () => save(id);
      if (selected)
        panelProps.onUnselect = () => unselect(id);
      else
        panelProps.onSelect = () => select(id);

      return (
        <Panel
          key={ id }
          label={ items.envs[id].length > 0 ? label : `${label} (empty)` }
          { ...panelProps }
          onDelete={ () => deleteEnv(id) }>
          <EnvItem
            envId={ id }
            onAdd={ props.onAdd } />
        </Panel>);
    }

    const savedElement = envs
      .filter(env => env.saved)
      .map(generatePanel);
    const unsavedElement = envs
      .filter(env => !env.saved)
      .map(generatePanel);

    element = savedElement.concat(unsavedElement);
  } else
    element = <PaneMessage content='Empty' />;
  return (
    <Fragment>
      <ViewerLabel content='Environments' />
      { element }
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
          .exprStrings
          .map(expr => {
            return <Typography key={ expr }>{ expr }</Typography>;
          });
        const kontEntries = konts[state.kont].string
          .map((kont, index) => <Typography key={ index }>{ kont }</Typography>);
        return [state.exprString, instrEntries, kontEntries]
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
        .exprStrings
        .map(expr => {
          return <Typography key={ expr }>{ expr }</Typography>;
        });
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
      return [entry.varString, instrEntries, storeEntries]
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
