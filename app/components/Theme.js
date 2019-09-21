import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import deepPurple from '@material-ui/core/colors/deepPurple';
import yellow from '@material-ui/core/colors/yellow';

const theme = createMuiTheme({
  palette: {
    secondary: {
      light: blue[300],
      main: blue[500],
      dark: blue[700],
    },
    select: {
      light: blue[100],
      main: blue[400]
    },
    hover: {
      light: deepPurple[100],
      main: deepPurple[400]
    },
    suggest: {
      main: yellow[400],
      dark: yellow[700]
    },
    warn: {
      main: amber.A700,
      contrastText: '#fff'
    }
  },
});

export default theme;
