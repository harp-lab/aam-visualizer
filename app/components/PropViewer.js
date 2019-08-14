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
import AddCircleIcon from '@material-ui/icons/AddCircle';
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

function PropViewer(props) {
    const { metadata } = props;
    const { configs, envs } = metadata;
    
    function addEnv(envId) {
      envs[envId].show();
      props.onSave({ envs: envs });
    }

    return (
      <SplitPane>
        <Pane width="70%" overflow='auto'>
          <ConfigsViewer
            configs={ configs }
            onAdd={ addEnv }
            onHover={ props.onHover }
            onSave={ configs => props.onSave({ configs }) }
            onRefresh={ props.onRefreshEnvs } />
        </Pane>
        <Pane width="30%" overflow='auto'>
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

  let element;
  if (configs) {
    function generatePanel([configId, config]) {
      const { label, selected, saved, noItems } = config;

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

    const items = useContext(Context);

    const savedElement = Object.entries(configs)
      .filter(([configId, config]) => config.saved)
      .filter(([configId, config]) => !['not found', 'non-func'].includes(items.configs[configId].form)) // TODO remove special state config filtering
      .map(generatePanel);
    const unsavedElement = Object.entries(configs)
      .filter(([configId, config]) => !config.saved && config.visible)
      .filter(([configId, config]) => !['not found', 'non-func'].includes(items.configs[configId].form)) // TODO remove special state config filtering
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
          onMouseOver={ () => {} } // TODO implement env hovering
          onMouseOut={ () => {} }
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
    <ExpansionPanel
      onMouseOver={ () => props.onMouseOver() }
      onMouseOut={ () => props.onMouseOut() } >
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
  const { configId, onAdd } = props;

  const labels = ['syntax', 'instr', 'stack', 'env'];
  const config = items.configs[configId];
  let entries = [];
  if (config.states)
    entries = config.states
      .map(stateId => {
        const { form, exprString, instr, kont, env } = items.states[stateId];
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

            const kontEntries = items.konts[kont].string
              .map((kont, index) => <Typography key={ index }>{ kont }</Typography>);

            entry = [exprString, `[ ${instrEntries} ]`, kontEntries, envElem];
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
