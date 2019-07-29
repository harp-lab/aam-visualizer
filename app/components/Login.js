import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

function Login(props) {
  const [user, setUser] = useState('guest');
  const re = /^\w+$/;
  const error = !re.test(user);
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
        onChange={ evt => setUser(evt.target.value) }
        error={ error }
        helperText={ 'You can use letters, numbers, & underscores' } />
      <Button
        onClick={ () => props.onSubmit(user) }
        disabled={ error }>
        login
      </Button>
    </div>);
}

export default Login;