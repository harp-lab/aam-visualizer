import React, { Fragment, useEffect } from 'react';
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
import DeleteIcon from '@material-ui/icons/Delete';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import withTheme from '@material-ui/styles/withTheme';
import withStyles from '@material-ui/styles/withStyles';

import SplitPane from './SplitPane';
import Pane from './Pane';
import PaneMessage from './PaneMessage';

function PropViewer(props) {
    const { element, metadata } = props;
    const { configs, envs } = metadata;

    function deleteConfig(configId) {
      const newConfigs = configs.filter(config => config.id !== configId);
      props.onSave({ configs: newConfigs });
    }
    function saveConfig(configId) {
      const config = configs.find(config => config.id == configId);
      config.saved = true;
      props.onSave({ configs });
    }
    function unsaveConfig(configId) {
      const config = configs.find(config => config.id == configId);
      config.saved = false;
      props.onSave({ configs });
    }
    function deleteEnv(envId) {
      const newEnvs = envs.filter(env => env.id !== envId);
      props.onSave({ envs: newEnvs });
    }
    function saveEnv(envId) {
      const env = envs.find(env => env.id == envId);
      env.saved = true;
      props.onSave({ envs });
    }
    function unsaveEnv(envId) {
      const env = envs.find(env => env.id == envId);
      env.saved = false;
      props.onSave({ envs });
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
            configs={ configs }
            onSave={ saveConfig }
            onUnsave = { unsaveConfig }
            onDelete={ deleteConfig } />
        </Pane>
        <Pane width="50%" overflow='auto'>
          <EnvsViewer
            envs={ envs }
            store={ props.store }
            onSave={ saveEnv }
            onUnsave = { unsaveEnv }
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
  let element;
  if (configs && configs.length > 0) {
    console.log(configs);
    const savedElement = configs.filter(config => config.saved)
      .map(({id, config}) => {
        return (
          <Panel
            key={ id }
            label={ id }
            onUnsave={ () => props.onUnsave(id) }
            onDelete={ () => props.onDelete(id) }>
            <ConfigItem config={ config } />
          </Panel>);
      });
    const unsavedElement = configs.filter(config => !config.saved)
      .map(({id, config}) => {
        return (
          <Panel
            key={ id }
            label={ id }
            onSave={ () => props.onSave(id) }
            onDelete={ () => props.onDelete(id) }>
            <ConfigItem config={ config } />
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
      .map(({id, env}) => {
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
            onDelete={ () => props.onDelete(id) }>
            <EnvItem
              env={ env }
              store={ props.store }/>
          </Panel>);
      });
    const unsavedElement = envs.filter(env => !env.saved)
      .map(({id, env}) => {
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
  let saveButton;
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
  const labels = ['syntax', 'instr', 'stack'];
  const items = props.config
    .map(state => {
      const stackItems = state.stack
        .map(data => <Typography key={ data }>{ data }</Typography>);
      return [state.syntax, state.instr, stackItems]
    });
  return <Item
    labels={ labels }
    items={ items }/>;
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
