import { ThemeProvider } from 'styled-components';
import Dashboard from '@/components/Dashboard';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { theme } from '@/styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
