import React from 'react';
import { CircularProgress, Fade, LinearProgress, Typography } from '@material-ui/core';

import { Pane } from 'library/base';

function Loading(props) {
  const { status, variant = 'circular' } = props;

  let element;
  switch (variant) {
    case 'circular': {
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
              { status }
            </Typography>
          </Fade>
        </Pane>);
      break;
    }
    case 'linear': {
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
        </Pane>);
      break;
    }
  }

  return element;
}

export default Loading;
