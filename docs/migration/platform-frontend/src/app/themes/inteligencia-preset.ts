import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * InteligenciaPreset — PrimeNG theme preset for the Intelligence pillar.
 *
 * Based on Aura, overriding ONLY the semantic primary palette with
 * burgundy #72284B. All other tokens (surface, danger, info, success, warn)
 * are inherited from Aura unchanged.
 *
 * Used alongside ApoloPreset — the active preset is determined by route context.
 * ApoloPreset remains the default in providePrimeNG; InteligenciaPreset is
 * applied when the user navigates to /intelligence/person/ routes.
 */
export const InteligenciaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf2f6',
      100: '#fbe6ee',
      200: '#f9cedf',
      300: '#f4a5c4',
      400: '#ec6f9e',
      500: '#e1437c',
      600: '#c9265d',
      700: '#a91b48',
      800: '#8c193d',
      900: '#72284B',
      950: '#4a0e28',
    },
  },
});
