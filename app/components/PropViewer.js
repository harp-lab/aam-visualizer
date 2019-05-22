import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';

class PropViewer extends Component {
  render() {
    let element;
    if (this.props.data) {
      const info = Object.entries(this.props.data)
      .map(([id, data]) => {
        const string = typeof data == 'object' ? data.toString() : data;
        const output = string || 'undefined';
        return (
          <div key={ id }>
            <Typography variant='h6'>{ id }</Typography>
            <Typography>{ output }</Typography>
          </div>);
      });
      element = (
        <div style={{ overflow: 'auto' }}>
          <div style={{ padding: '1em' }}>
          { info }
          </div>
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
            No element selected
          </Typography>
        </div>
      );
    }
    return element;
  }
}

export default PropViewer;