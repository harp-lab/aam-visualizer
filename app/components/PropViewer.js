import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import withTheme from '@material-ui/styles/withTheme';
import SplitPane from './SplitPane';
import Pane from './Pane';

class PropViewer extends Component {
  render() {
    const node = this.props.data;

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
      if (env)
        element = (
          <SplitPane>
            <Pane width="50%" overflow='auto'>
              { mainContent }
            </Pane>
            <Pane width="50%" overflow='auto'>
              <EnvViewer data={ env } store={ this.props.store }/>
            </Pane>
          </SplitPane>);
      else
        element = mainContent;
    } else
      element = <Message data='No element selected'/>;
    
    return element;
  }
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

class EnvViewer extends Component {
  render() {
    let element;
    if (Object.keys(this.props.data).length > 0) {
      const labels = ['var', 'instr', 'store']
        .map(label => {
          return <TableCell key={ label }>{ label }</TableCell>
        });
      
      const items = Object.entries(this.props.data)
        .map(([id, data]) => {
          // get store value
          const storeItems = this.props.store[data.store]
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
      
      element = (
        <React.Fragment>
          <Toolbar
            variant='dense'
            style={{
              backgroundColor: this.props.theme.palette.secondary.main,
              color: this.props.theme.palette.secondary.contrastText
            }}>
            <Typography>Environment</Typography>
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
    }
    else
      element = <Message data='Empty environment'/>;
    
    return element;
  }
}
EnvViewer = withTheme(EnvViewer);

export default PropViewer;
