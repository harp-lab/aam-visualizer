import React, { Component } from 'react';
import { PaneMessage } from 'library';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError(error) {
    return { error: true };
  }
  componentDidCatch(error, errorInfo) {

  }
  render() {
    if (this.state.error) return <PaneMessage content='Error caught' />;
    return this.props.children;
  }
}

export default ErrorBoundary;
