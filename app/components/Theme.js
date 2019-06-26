import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import deepPurple from '@material-ui/core/colors/deepPurple';
import yellow from '@material-ui/core/colors/yellow';

const theme = createMuiTheme({
  palette: {
    secondary: {
      light: blue.A200,
      main: blue.A400,
      dark: blue.A700,
    },
    select: {
      light: yellow[200]
    },
    hover: {
      light: deepPurple[100]
    },
    warn: {
      main: amber.A700,
      contrastText: '#fff'
    }
  }
});

export default theme;
