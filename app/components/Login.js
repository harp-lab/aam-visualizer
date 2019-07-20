import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

function Login(props) {
  const [user, setUser] = useState('guest');
  return (<div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
      }}>
      <TextField
        label='username'
        value={ user }
        onChange={ evt => setUser(evt.target.value) } />
      <Button onClick={ () => props.onSubmit(user || 'guest') }>login</Button>
    </div>);
}

export default Login;