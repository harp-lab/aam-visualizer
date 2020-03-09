import { createMuiTheme } from '@material-ui/core/styles';
import { amber, blue, deepPurple, yellow } from '@material-ui/core/colors';

import { theme as fextTheme } from 'extensions/themes';

const theme = createMuiTheme({
  mixins: {
    message: {
      minHeight: 24
    }
  },
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
    },
    background: {
      overlay: 'rgba(255, 255, 255, 0.5)'
    }
  },
}, fextTheme);

export default theme;
