import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';

class NodeViewer extends Component {
  render() {
    let element;
    if (this.props.data) {
      const info = Object.entries(this.props.data)
      .map(([id, data]) => {
        return (
          <div key={ id }>
            <Typography variant='h6'>{ id }</Typography>
            <Typography>{ (typeof data == 'object' ? data.toString() : data) }</Typography>
          </div>);
      });
      element = (
        <div style={{
          padding: '1em',
          overflow: 'auto'
        }}>
          { info }
        </div>
      );
    } else {
      element = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Typography variant='h6'>
            No node selected
          </Typography>
        </div>
      );
    }
    return element;
  }
}

export default NodeViewer;