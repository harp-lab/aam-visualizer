import React, { Component } from 'react';

class Pane extends Component {
  constructor(props) { super(props); }
  render() {
    const height = this.props.height;
    const width = this.props.width;
    const overflow = this.props.overflow;

    const children = React.Children.map(this.props.children, child => {
      const heightProps = (height ? { height } : {});
      const widthProps = (width ? { width } : {});
      const props = {...widthProps, ...heightProps};
      return React.cloneElement(child, props);
    });
    const style = {...{
      display: 'flex',
      flexDirection: 'column',
      height: height ? height : '100%',
      width: width ? width : '100%',
      overflow: overflow ? overflow : 'hidden'
    }, ...this.props.style};

    return <div style={ style }>{ children }</div>;
  }
}

export default Pane;
