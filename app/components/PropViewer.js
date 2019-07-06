import React, { Component, Fragment } from 'react';
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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import DeleteIcon from '@material-ui/icons/Delete';
import withTheme from '@material-ui/styles/withTheme';
import withStyles from '@material-ui/styles/withStyles';

import SplitPane from './SplitPane';
import Pane from './Pane';

function PropViewer(props) {
    const node = props.data;

    function deleteEnv(envId) {
      const envs = props.metadata.envs.filter(env => env.id !== envId);
      props.onSave({ envs });
    }

    let element;
    if (node) {
      const dataElement = <DataViewer data={ node.data } />;

      const states = node.states;
      const env = node.env;
      const mainContent = (
        <React.Fragment>
          { dataElement }
          { (states ? <StatesViewer data={ states } /> : undefined) }
        </React.Fragment>);
      //if (env)
        element = (
          <SplitPane>
            <Pane width="50%" overflow='auto'>
              { mainContent }
            </Pane>
            <Pane width="50%" overflow='auto'>
              <EnvsViewer
                envs={ props.metadata.envs }
                store={ props.store }
                onDelete={ deleteEnv } />
            </Pane>
          </SplitPane>);
      //else
      //  element = mainContent;
    } else
      element = <Message data='No element selected'/>;
    
    return element;
}

function Message(props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Typography variant='h6'>
        { props.data }
      </Typography>
    </div>);
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
    element = <Message data='No data available' />

  return element;
}

function StatesViewer(props) {
  let element;
  if (props.data.length > 0) {
    const labels = ['syntax', 'instr', 'stack']
      .map(label => {
        return <TableCell key={ label }>{ label }</TableCell>
      });
    
    const items = props.data
      .map((data, index) => {
        const stackItems = data.stack
          .map((data, index) => {
            return <Typography key={ index }>{ data }</Typography>;
          });

        return (
          <TableRow key={ index }>
            <TableCell>{ data.syntax }</TableCell>
            <TableCell>{ data.instr }</TableCell>
            <TableCell>{ stackItems }</TableCell>
          </TableRow>);
      });

    element = (
      <React.Fragment>
        <Toolbar
          variant='dense'
          style={{
            backgroundColor: props.theme.palette.secondary.main,
            color: props.theme.palette.secondary.contrastText
          }}>
          <Typography>States</Typography>
        </Toolbar>
        <Table size='small'>
          <TableHead>
            <TableRow>{ labels }</TableRow>
          </TableHead>
          <TableBody>
            { items }
          </TableBody>
        </Table>
      </React.Fragment>);
  } else
    element = <Typography variant='h6'>No states</Typography>;

  return element;
}
StatesViewer = withTheme(StatesViewer);


const styles = {
  content: {
    alignItems: 'center'
  }
};
function EnvsViewer(props) {
  let element;
  if (props.envs)
    element = props.envs.map(({id, env}, index) => {
      let label;
      if (Object.keys(env).length > 0) {
        label = id;
      } else {
        label = `${id} (empty)`;
      }

      return (
        <ExpansionPanel
          key={ index }>
          <ExpansionPanelSummary
            expandIcon={ <ExpandMoreIcon /> }
            classes={{ content: props.classes.content }}>
            <Tooltip title='Delete environment'>
              <IconButton
                size='small'
                onClick={ evt => {
                  evt.stopPropagation();
                  props.onDelete(id);
                }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Typography variant='body2'>{ label }</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <EnvItem env={ env } store={ props.store }/>
          </ExpansionPanelDetails>
        </ExpansionPanel>);
    });
  else
    element = (<Typography variant='h6'>Empty</Typography>);
  return (
    <Fragment>
      <Toolbar
        variant='dense'
        style={{
          backgroundColor: props.theme.palette.secondary.main,
          color: props.theme.palette.secondary.contrastText
        }}>
        <Typography>Environment</Typography>
      </Toolbar>
      { element }
    </Fragment>);
}
EnvsViewer = withTheme(EnvsViewer);
EnvsViewer = withStyles(styles)(EnvsViewer);

function EnvItem(props) {
  const labels = ['var', 'instr', 'store']
    .map(label => {
      return <TableCell key={ label }>{ label }</TableCell>
    });
  
  const items = Object.entries(props.env)
    .map(([id, data]) => {
      // get store value
      const storeItems = props.store[data.store]
        .map(data => {
          return <Typography key={ data }>{ data }</Typography>;
        });

      return (
        <TableRow key={ id }>
          <TableCell>{ id }</TableCell>
          <TableCell>{ data.instr }</TableCell>
          <TableCell>{ storeItems }</TableCell>
        </TableRow>);
    });
  
  return (
    <React.Fragment>
      <Table size='small'>
        <TableHead>
          <TableRow>{ labels }</TableRow>
        </TableHead>
        <TableBody>
          { items }
        </TableBody>
      </Table>
    </React.Fragment>);
}

export default PropViewer;
