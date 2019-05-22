import React, { Component } from 'react';
import Fade from '@material-ui/core/Fade';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Pane from './Pane';

class Loading extends Component {
  render() {
    let element;
    switch (this.props.variant) {
      case 'linear':
        element = (
          <Pane>
            <LinearProgress />
            <Typography
              variant='h6'
              style={{
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              { this.props.status }
            </Typography>
          </Pane>
        );
        break;
      case 'circular':
        element = (
          <Pane
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Fade in style={{ transitionDelay: '1000ms' }}>
            <CircularProgress />
          </Fade>
          <Fade in style={{ transitionDelay: '200ms' }}>
            <Typography
              variant='h6'
              style={{ marginTop: '2em' }}>
              { this.props.status }
            </Typography>
          </Fade>
        </Pane>
        );
        break;
    }
    return element;
  }
}

export default Loading;
