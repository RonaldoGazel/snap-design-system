import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * ApoloPreset — Custom PrimeNG theme preset for SNAP Apolo.
 *
 * Based on Aura, overriding color tokens with OKLCH palettes:
 * - Primary (steel/blue-gray): authoritative blue, low-fatigue
 * - Surface (gray-brand): UI chrome, cards, panels
 * - Danger (crimson), Info (blue), Success (green), Warn (orange)
 *
 * Light/dark mode is handled automatically by PrimeNG via the `p-dark` CSS class.
 */
export const ApoloPreset = definePreset(Aura, {
  primitive: {
    // steel → primary brand palette (authoritative blue, low-fatigue)
    steel: {
      50: 'oklch(97% 0.01 250)',
      100: 'oklch(93% 0.03 250)',
      200: 'oklch(87% 0.06 250)',
      300: 'oklch(78% 0.09 250)',
      400: 'oklch(67% 0.12 250)',
      500: 'oklch(55% 0.14 250)',
      600: 'oklch(47% 0.14 250)',
      700: 'oklch(40% 0.12 250)',
      800: 'oklch(33% 0.10 250)',
      900: 'oklch(27% 0.08 250)',
      950: 'oklch(20% 0.06 250)',
    },
    // crimson → danger/red palette
    crimson: {
      50: 'oklch(97.6% 0.02 10)',
      100: 'oklch(94.7% 0.05 10)',
      200: 'oklch(88.4% 0.1 12)',
      300: 'oklch(80.3% 0.17 14)',
      400: 'oklch(70.5% 0.23 18)',
      500: 'oklch(62% 0.26 22)',
      600: 'oklch(55.1% 0.23 24)',
      700: 'oklch(47.6% 0.21 25)',
      800: 'oklch(42.5% 0.19 24)',
      900: 'oklch(37.8% 0.17 22)',
      950: 'oklch(24.2% 0.12 18)',
    },
    // blue → info palette
    blue: {
      50: 'oklch(97.65% 0.0098 254.6)',
      100: 'oklch(95.12% 0.0294 254.6)',
      200: 'oklch(89.56% 0.049 254.6)',
      300: 'oklch(80.44% 0.0784 254.6)',
      400: 'oklch(69.84% 0.098 254.6)',
      500: 'oklch(59.72% 0.1078 254.6)',
      600: 'oklch(56.68% 0.1176 254.6)',
      700: 'oklch(46.08% 0.1176 254.6)',
      800: 'oklch(40.52% 0.1078 254.6)',
      900: 'oklch(37.48% 0.0931 254.6)',
      950: 'oklch(28.36% 0.0784 254.6)',
    },
    // green → success palette
    green: {
      50: 'oklch(97.28% 0.0294 155.83)',
      100: 'oklch(93.82% 0.0882 155.83)',
      200: 'oklch(88.7% 0.1323 155.83)',
      300: 'oklch(80.46% 0.1764 155.83)',
      400: 'oklch(69.34% 0.2058 155.83)',
      500: 'oklch(58.22% 0.2058 155.83)',
      600: 'oklch(48.58% 0.1911 155.83)',
      700: 'oklch(40.34% 0.1764 155.83)',
      800: 'oklch(34.1% 0.1617 155.83)',
      900: 'oklch(29.98% 0.147 155.83)',
      950: 'oklch(18.86% 0.1176 155.83)',
    },
    // orange → warn palette
    orange: {
      50: 'oklch(96.89% 0.0588 99.57)',
      100: 'oklch(92.03% 0.1617 99.57)',
      200: 'oklch(84.29% 0.2352 99.57)',
      300: 'oklch(76.55% 0.2646 99.57)',
      400: 'oklch(70.55% 0.2646 99.57)',
      500: 'oklch(63.81% 0.2499 99.57)',
      600: 'oklch(58.95% 0.2352 85.87)',
      700: 'oklch(51.21% 0.2058 70.67)',
      800: 'oklch(46.35% 0.1764 62.37)',
      900: 'oklch(42.61% 0.147 57.57)',
      950: 'oklch(30.75% 0.1176 52.47)',
    },
    // gray-brand → surface palette (UI chrome, cards, panels)
    'gray-brand': {
      50: 'oklch(98% 0.003 279.58)',
      100: 'oklch(95% 0.004 279.58)',
      200: 'oklch(91% 0.006 279.58)',
      300: 'oklch(84% 0.009 279.58)',
      400: 'oklch(73% 0.012 279.58)',
      500: 'oklch(60% 0.015 279.58)',
      600: 'oklch(48% 0.017 279.58)',
      700: 'oklch(36% 0.017 279.58)',
      800: 'oklch(25% 0.015 279.58)',
      900: 'oklch(18% 0.013 279.58)',
      950: 'oklch(13% 0.01 279.58)',
    },
  },
  semantic: {
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, -apple-system, sans-serif",
    // steel as the primary brand color
    primary: {
      50: '{steel.50}',
      100: '{steel.100}',
      200: '{steel.200}',
      300: '{steel.300}',
      400: '{steel.400}',
      500: '{steel.500}',
      600: '{steel.600}',
      700: '{steel.700}',
      800: '{steel.800}',
      900: '{steel.900}',
      950: '{steel.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{steel.600}',
          contrastColor: '#ffffff',
          hoverColor: '{steel.700}',
          activeColor: '{steel.800}',
        },
        surface: {
          0: '#ffffff',
          50: '{gray-brand.50}',
          100: '{gray-brand.100}',
          200: '{gray-brand.200}',
          300: '{gray-brand.300}',
          400: '{gray-brand.400}',
          500: '{gray-brand.500}',
          600: '{gray-brand.600}',
          700: '{gray-brand.700}',
          800: '{gray-brand.800}',
          900: '{gray-brand.900}',
          950: '{gray-brand.950}',
        },
      },
      dark: {
        primary: {
          color: '{steel.400}',
          contrastColor: '#ffffff',
          hoverColor: '{steel.300}',
          activeColor: '{steel.200}',
        },
        surface: {
          0: '#ffffff',
          50: '{gray-brand.50}',
          100: '{gray-brand.100}',
          200: '{gray-brand.200}',
          300: '{gray-brand.300}',
          400: '{gray-brand.400}',
          500: '{gray-brand.500}',
          600: '{gray-brand.600}',
          700: '{gray-brand.700}',
          800: '{gray-brand.800}',
          900: '{gray-brand.900}',
          950: '{gray-brand.950}',
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            danger: {
              background: '{crimson.500}',
              hoverBackground: '{crimson.600}',
              activeBackground: '{crimson.700}',
              borderColor: '{crimson.500}',
              hoverBorderColor: '{crimson.600}',
              activeBorderColor: '{crimson.700}',
              color: '#ffffff',
            },
            info: {
              background: '{blue.500}',
              hoverBackground: '{blue.600}',
              activeBackground: '{blue.700}',
              borderColor: '{blue.500}',
              hoverBorderColor: '{blue.600}',
              activeBorderColor: '{blue.700}',
              color: '#ffffff',
            },
            success: {
              background: '{green.500}',
              hoverBackground: '{green.600}',
              activeBackground: '{green.700}',
              borderColor: '{green.500}',
              hoverBorderColor: '{green.600}',
              activeBorderColor: '{green.700}',
              color: '#ffffff',
            },
            warn: {
              background: '{orange.500}',
              hoverBackground: '{orange.600}',
              activeBackground: '{orange.700}',
              borderColor: '{orange.500}',
              hoverBorderColor: '{orange.600}',
              activeBorderColor: '{orange.700}',
              color: '#ffffff',
            },
          },
        },
        dark: {
          root: {
            danger: {
              background: '{crimson.400}',
              hoverBackground: '{crimson.300}',
              activeBackground: '{crimson.200}',
              borderColor: '{crimson.400}',
              hoverBorderColor: '{crimson.300}',
              activeBorderColor: '{crimson.200}',
              color: '#ffffff',
            },
            info: {
              background: '{blue.400}',
              hoverBackground: '{blue.300}',
              activeBackground: '{blue.200}',
              borderColor: '{blue.400}',
              hoverBorderColor: '{blue.300}',
              activeBorderColor: '{blue.200}',
              color: '#ffffff',
            },
            success: {
              background: '{green.400}',
              hoverBackground: '{green.300}',
              activeBackground: '{green.200}',
              borderColor: '{green.400}',
              hoverBorderColor: '{green.300}',
              activeBorderColor: '{green.200}',
              color: '#ffffff',
            },
            warn: {
              background: '{orange.400}',
              hoverBackground: '{orange.300}',
              activeBackground: '{orange.200}',
              borderColor: '{orange.400}',
              hoverBorderColor: '{orange.300}',
              activeBorderColor: '{orange.200}',
              color: '#ffffff',
            },
          },
        },
      },
    },
  },
});
