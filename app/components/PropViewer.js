import React, { Fragment, useEffect, useContext } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
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

function PropViewer(props) {
    const { element, metadata } = props;
    const items = useContext(Context);
    const { configs, envs, states } = items;
    //const { configs, envs } = metadata;
    const viewedConfigs = metadata.configs;
    let viewedEnvs;
    if (viewedConfigs)
      viewedEnvs = viewedConfigs
        .filter(config => config.selected)
        .map(({ id }) => {
          const config = configs[id];
          return config.states
            .map(stateId => {
              const state = states[stateId];
              const envId = state.env;
              console.log(envs);
              console.log(envId);
              return envs[envId];
            });
        });
    console.log(viewedEnvs);

    function deleteConfig(configId) {
      const newConfigs = viewedConfigs.filter(config => config.id !== configId);
      props.onSave({ configs: newConfigs });
    }
    function saveConfig(configId) {
      const config = viewedConfigs.find(config => config.id == configId);
      config.saved = true;
      props.onSave({ configs: viewedConfigs });
    }
    function unsaveConfig(configId) {
      const config = viewedConfigs.find(config => config.id == configId);
      config.saved = false;
      props.onSave({ configs: viewedConfigs });
    }
    function selectConfig(configId) {
      const config = viewedConfigs.find(config => config.id == configId);
      config.selected = true;
      props.onSave({ configs: viewedConfigs });
    }
    function unselectConfig(configId) {
      const config = viewedConfigs.find(config => config.id == configId);
      config.selected = false;
      props.onSave({ configs: viewedConfigs });
    }
    function deleteEnv(envId) {
      const newEnvs = viewedEnvs.filter(env => env.id !== envId);
      props.onSave({ envs: newEnvs });
    }
    function saveEnv(envId) {
      const env = viewedEnvs.find(env => env.id == envId);
      env.saved = true;
      props.onSave({ envs: viewedEnvs });
    }
    function unsaveEnv(envId) {
      const env = viewedEnvs.find(env => env.id == envId);
      env.saved = false;
      props.onSave({ envs: viewedEnvs });
    }
    function selectEnv(envId) {
      const env = viewedEnvs.find(env => env.id == envId);
      env.selected = true;
      props.onSave({ envs: viewedEnvs });
    }
    function unselectEnv(envId) {
      const env = viewedEnvs.find(env => env.id == envId);
      env.selected = false;
      props.onSave({ envs: viewedEnvs });
    }

    let dataElement;
    if (element)
      dataElement = <DataViewer data={ element.data } />;
    else
      dataElement = <Typography variant='h6'>No element selected</Typography>;

    return (
      <SplitPane>
        <Pane width="50%" overflow='auto'>
          { dataElement }
          <ConfigsViewer
            configs={ viewedConfigs }
            onSave={ saveConfig }
            onUnsave = { unsaveConfig }
            onSelect={ selectConfig }
            onUnselect={ unselectConfig }
            onDelete={ deleteConfig } />
        </Pane>
        <Pane width="50%" overflow='auto'>
          <EnvsViewer
            envs={ viewedEnvs }
            store={ props.store }
            onSave={ saveEnv }
            onUnsave = { unsaveEnv }
            onSelect={ selectEnv }
            onUnselect={ unselectEnv }
            onDelete={ deleteEnv } />
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
  let element;
  if (configs && configs.length > 0) {
    const savedElement = configs.filter(config => config.saved)
      .map(({label, id, selected}) => {
        return (
          <Panel
            key={ id }
            label={ label }
            onUnsave={ () => props.onUnsave(id) }
            onSelect={ selected ? undefined : () => props.onSelect(id) }
            onUnselect={ selected ? () => props.onUnselect(id) : undefined }
            onDelete={ () => props.onDelete(id) }>
            <ConfigItem configId={ id } />
          </Panel>);
      });
    const unsavedElement = configs.filter(config => !config.saved)
      .map(({label, id, selected}) => {
        return (
          <Panel
            key={ id }
            label={ label }
            onSave={ () => props.onSave(id) }
            onSelect={ selected ? undefined : () => props.onSelect(id) }
            onUnselect={ selected ? () => props.onUnselect(id) : undefined }
            onDelete={ () => props.onDelete(id) }>
            <ConfigItem configId={ id } />
          </Panel>);
      });
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
  let element;
  if (envs && envs.length > 0) {
    const savedElement = envs.filter(env => env.saved)
      .map(({id, env, selected}) => {
        let label;
        if (Object.keys(env).length > 0)
          label = id;
        else
          label = `${id} (empty)`;

        return (
          <Panel
            key={ label }
            label={ label }
            onUnsave={ () => props.onUnsave(id) }
            onSelect={ selected ? undefined : () => props.onSelect(id) }
            onUnselect={ selected ? () => props.onUnselect(id) : undefined }
            onDelete={ () => props.onDelete(id) }>
            <EnvItem
              env={ env }
              store={ props.store }/>
          </Panel>);
      });
    const unsavedElement = envs.filter(env => !env.saved)
      .map(({id, env, selected}) => {
        let label;
        if (Object.keys(env).length > 0)
          label = id;
        else
          label = `${id} (empty)`;

        return (
          <Panel
            key={ label }
            label={ label }
            onSave={ () => props.onSave(id) }
            onSelect={ selected ? undefined : () => props.onSelect(id) }
            onUnselect={ selected ? () => props.onUnselect(id) : undefined }
            onDelete={ () => props.onDelete(id) }>
            <EnvItem
              env={ env }
              store={ props.store }/>
          </Panel>);
      });

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
        color: theme.palette.secondary.contrastText
      }}>
      <Typography>{ props.content }</Typography>
    </Toolbar>);
}
ViewerLabel = withTheme(ViewerLabel);

function Panel(props) {
  let saveButton, selectButton;
  if (props.onSave)
    saveButton = (
      <Tooltip title='Save'>
        <IconButton
          size='small'
          onClick={ evt => {
            evt.stopPropagation();
            props.onSave();
          }}>
          <StarBorderIcon />
        </IconButton>
      </Tooltip>);
  else if (props.onUnsave)
    saveButton = (
      <Tooltip title='Unsave'>
        <IconButton
          size='small'
          onClick={ evt => {
            evt.stopPropagation();
            props.onUnsave();
          }}>
          <StarIcon />
        </IconButton>
      </Tooltip>);
  if (props.onSelect)
    selectButton = (
      <Tooltip title='Select'>
        <IconButton
          size='small'
          onClick={ evt => {
            evt.stopPropagation();
            props.onSelect();
          }}>
          <CheckBoxOutlineBlankIcon />
        </IconButton>
      </Tooltip>);
  else if (props.onUnselect)
    selectButton = (
      <Tooltip title='Unselect'>
        <IconButton
          size='small'
          onClick={ evt => {
            evt.stopPropagation();
            props.onUnselect();
          }}>
          <CheckBoxIcon />
        </IconButton>
      </Tooltip>);
  const deleteButton = (
    <Tooltip title='Delete'>
      <IconButton
        size='small'
        onClick={ evt => {
          evt.stopPropagation();
          props.onDelete();
        }}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>);
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

function ConfigItem(props) {
  const items = useContext(Context);
  const labels = ['syntax', 'instr', 'stack'];
  const { configs, states, instr, konts } = items;
  const config = configs[props.configId];
  const entries = config.states
    .map(stateId => {
      const state = states[stateId];
      const kontEntries = konts[state.kont].string
        .map((kont, index) => <Typography key={ index }>{ kont }</Typography>);
      return [state.expr, instr[state.instr], kontEntries]
    });
  return <Item
    labels={ labels }
    items={ entries }/>;
}
function EnvItem(props) {
  const labels = ['var', 'instr', 'store'];
  const items = Object.entries(props.env)
    .map(([id, env]) => {
      const storeItems = props.store[env.store]
        .map(data => <Typography key={ data }>{ data }</Typography>);
      return [id, env.instr, storeItems];
    });
  return <Item
    labels={ labels }
    items={ items }/>;
}
function Item(props) {
  const labels = props.labels
    .map(label => <TableCell key={ label }>{ label }</TableCell>);
  const items = props.items
    .map(item => {
      const fields = item.map((field, index) => <TableCell key={ index }>{ field }</TableCell>);
      return <TableRow key={ item[0] }>{ fields }</TableRow>;
    });
  return (
    <Fragment>
      <Table size='small'>
        <TableHead>
          <TableRow>{ labels }</TableRow>
        </TableHead>
        <TableBody>
          { items }
        </TableBody>
      </Table>
    </Fragment>);
}

export default PropViewer;
