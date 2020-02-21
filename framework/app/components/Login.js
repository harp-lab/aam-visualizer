import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, TextField } from '@material-ui/core';
import { login } from 'store/actions'; 

function Login() {
  const dispatch = useDispatch();

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
        onClick={ () => dispatch(login(user)) }
        disabled={ error }>
        login
      </Button>
    </div>);
}

export default Login;