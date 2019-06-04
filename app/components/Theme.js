import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import amber from '@material-ui/core/colors/amber';

const theme = createMuiTheme({
  palette: {
    warning: {
      main: amber[700],
      contrastText: '#fff'
    }
  }
});

export default theme;
