import React, { Component, useState } from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';
import { PaneMessage } from 'library/base';

function ErrorWrapper(props) {
  const { children } = props;
  const [errorKey, setErrorKey] = useState(0);

  return (
    <ErrorBoundary
      key={ errorKey }
      onReset={ () => setErrorKey(errorKey + 1) }>
      { children }
    </ErrorBoundary>);
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError(error) {
    return { error: true };
  }
  componentDidCatch(error, errorInfo) {}
  render() {
    const { children, onReset } = this.props;
    if (this.state.error)
      return <PaneMessage
        content='Error caught'
        buttons={ <RefreshButton onClick={ onReset } /> } />;
    return children;
  }
}

function RefreshButton(props) {
  const { onClick } = props;
  return (
    <Tooltip title={ 'Restart' }>
      <IconButton
        size='small'
        onClick={ onClick }>
        <Refresh />
      </IconButton>
    </Tooltip>);
}

export default ErrorWrapper;
