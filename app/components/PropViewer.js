import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
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
      if (states && env)
        element = (
          <SplitPane>
            <Pane width="50%" overflow='auto'>
              { dataElement }
              <StatesViewer data={ node.states } />
            </Pane>
            <Pane width="50%" overflow='auto'>
              <EnvViewer data={ node.env } store={ this.props.store }/>
            </Pane>
          </SplitPane>);
      else
        element = dataElement;
    } else
      element = <Message data='No element selected'/>;
    
    return element;
  }
}

class Message extends Component {
  render() {
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
          { this.props.data }
        </Typography>
      </div>);
  }
}

class DataViewer extends Component {
  render() {
    const data = this.props.data;

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
}

class StatesViewer extends Component {
  render() {
    const states = this.props.data.map(data => {
      return (
        <ListItem key={ data }>
          <ListItemText>{ data[0] }</ListItemText>
          <ListItemText>{ data[1] }</ListItemText>
        </ListItem>);
    });

    return <List>{ states }</List>;
  }
}

class EnvViewer extends Component {
  render() {
    const envLabels = ['var', 'instr', 'addr', 'store']
      .map(label => {
        return <TableCell key={ label }>{ label }</TableCell>
      })
    
    const envItems = Object.entries(this.props.data)
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
            <TableCell>{ data.store }</TableCell>
            <TableCell>{ storeItems }</TableCell>
          </TableRow>);
      });
    const element = (
      <React.Fragment>
        <Typography variant='h5' align='center'>Environment</Typography>
        <Table size='small'>
          <TableHead>
            <TableRow>{ envLabels }</TableRow>
          </TableHead>
          <TableBody>
            { envItems }
          </TableBody>
        </Table>
      </React.Fragment>);

    return element;
  }
}

export default PropViewer;
