import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import blue from '@material-ui/core/colors/blue';
import amber from '@material-ui/core/colors/amber';

const theme = createMuiTheme({
  palette: {
    secondary: {
      light: blue.A200,
      main: blue.A400,
      dark: blue.A700,
    },
    warning: {
      main: amber.A700,
      contrastText: '#fff'
    }
  }
});

export default theme;
