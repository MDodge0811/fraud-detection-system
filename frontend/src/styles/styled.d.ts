import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
        card: string;
        overlay: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
      };
      status: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
      risk: {
        low: string;
        medium: string;
        high: string;
      };
      border: {
        primary: string;
        secondary: string;
        accent: string;
      };
      button: {
        primary: string;
        primaryHover: string;
        secondary: string;
        secondaryHover: string;
        danger: string;
        dangerHover: string;
        success: string;
        successHover: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    typography: {
      fontSizes: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
      };
      fontWeights: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
      };
      lineHeights: {
        tight: number;
        normal: number;
        relaxed: number;
      };
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
  }
}
