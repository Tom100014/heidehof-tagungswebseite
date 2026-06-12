
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				xs: '320px',
			},
			spacing: {
				'4.5': '1.125rem',
				'18': '4.5rem',  // 72px
				'30': '7.5rem',  // 120px
			},
			scale: {
				'115': '1.15',
			},
			fontSize: {
				'display': ['clamp(3rem, 6vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
				'h1': ['clamp(2.25rem, 4vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
				'h2': ['clamp(1.75rem, 3vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
				'h3': ['clamp(1.375rem, 2vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
				'body': ['1rem', { lineHeight: '1.6' }],
				'caption': ['0.875rem', { lineHeight: '1.5' }],
				'eyebrow': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.25em', fontWeight: '500' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				hotel: {
					DEFAULT: '#0A0A0A', // Obsidian
					gold: '#C9A961',    // Champagne
					light: '#F5EFE6',
					dark: '#000000',
				},
				gold: {
					DEFAULT: '#C9A961',  // Rolls-Royce champagne
					dark: '#8C7437',
					light: '#E6D9B0',
				},
				heide: {
					// Legacy "Heide" token — retuned to warm champagne (no more green).
					DEFAULT: '#C9A961',
					dark: '#8C7437',
					soft: '#E0CB94',
					glow: '#EFE0B5',
				},
				apple: {
					DEFAULT: 'hsl(var(--apple) / <alpha-value>)',
					bright: 'hsl(var(--apple-bright) / <alpha-value>)',
					deep: 'hsl(var(--apple-deep) / <alpha-value>)',
					foreground: 'hsl(var(--apple-foreground) / <alpha-value>)',
				},
				// Semantic status colors (HSL via CSS vars w/ fallbacks)
				success: {
					DEFAULT: 'hsl(var(--success, 142 71% 45%))',
					foreground: 'hsl(var(--success-foreground, 0 0% 100%))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning, 38 92% 50%))',
					foreground: 'hsl(var(--warning-foreground, 0 0% 10%))',
				},
				info: {
					DEFAULT: 'hsl(var(--info, 217 91% 60%))',
					foreground: 'hsl(var(--info-foreground, 0 0% 100%))',
				},
				// Apple iOS System Colors
				ios: {
					blue: 'hsl(var(--ios-blue))',
					green: 'hsl(var(--ios-green))',
					orange: 'hsl(var(--ios-orange))',
					red: 'hsl(var(--ios-red))',
					gray: 'hsl(var(--ios-gray))',
					gray2: 'hsl(var(--ios-gray2))',
					gray3: 'hsl(var(--ios-gray3))',
					gray4: 'hsl(var(--ios-gray4))',
					gray5: 'hsl(var(--ios-gray5))',
					gray6: 'hsl(var(--ios-gray6))',
					systemBackground: 'hsl(var(--ios-system-background))',
					secondarySystemBackground: 'hsl(var(--ios-secondary-system-background))',
					tertiarySystemBackground: 'hsl(var(--ios-tertiary-system-background))',
					systemGroupedBackground: 'hsl(var(--ios-system-grouped-background))',
					secondarySystemGroupedBackground: 'hsl(var(--ios-secondary-system-grouped-background))',
					tertiarySystemGroupedBackground: 'hsl(var(--ios-tertiary-system-grouped-background))',
					systemFill: 'hsl(var(--ios-system-fill))',
					secondarySystemFill: 'hsl(var(--ios-secondary-system-fill))',
					tertiarySystemFill: 'hsl(var(--ios-tertiary-system-fill))',
					quaternarySystemFill: 'hsl(var(--ios-quaternary-system-fill))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			zIndex: {
				'dropdown': '1000',
				'sticky': '1010', 
				'banner': '1020',
				'overlay': '1030',
				'modal': '1040',
				'popover': '1050',
				'tooltip': '1060',
				'toast': '1070'
			},
			boxShadow: {
				// Elevation ladder
				'elev-sm': '0 1px 2px 0 hsl(0 0% 0% / 0.06), 0 1px 1px 0 hsl(0 0% 0% / 0.04)',
				'elev-md': '0 4px 8px -2px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.06)',
				'elev-lg': '0 12px 24px -8px hsl(0 0% 0% / 0.16), 0 4px 8px -4px hsl(0 0% 0% / 0.08)',
				'elev-xl': '0 24px 48px -12px hsl(0 0% 0% / 0.22), 0 8px 16px -8px hsl(0 0% 0% / 0.10)',
				'elev-2xl': '0 40px 80px -20px hsl(0 0% 0% / 0.30), 0 12px 24px -12px hsl(0 0% 0% / 0.14)',
				// Brand
				'elegant': '0 10px 30px -10px rgba(192, 160, 128, 0.2)',
				'gold': '0 5px 15px rgba(192, 160, 128, 0.15)',
				'dark': '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
				// Apple iOS Liquid Glass Shadows
				'ios-card': '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 1px rgba(0, 0, 0, 0.05)',
				'ios-elevated': '0 16px 64px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
				'ios-input': '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
				'ios-button': '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
				'ios-button-pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
				'ios-glass': '0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(255, 255, 255, 0.2) inset',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-in-left': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				// Apple iOS Animations
				'ios-bounce': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.96)' }
				},
				'ios-spring': {
					'0%': { transform: 'scale(0.95) translateY(8px)', opacity: '0' },
					'60%': { transform: 'scale(1.02) translateY(-2px)', opacity: '1' },
					'100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
				},
				'ios-slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'ios-blur-in': {
					// backdropFilter is not GPU-composited — use opacity+scale (both are)
					'0%': { opacity: '0', transform: 'scale(0.98)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in-left': 'slide-in-left 0.5s ease forwards',
				'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out',
				'float': 'float 6s infinite ease-in-out',
				'shimmer': 'shimmer 2s infinite linear',
				// Apple iOS Animations
				'ios-bounce': 'ios-bounce 0.15s ease-out',
				'ios-spring': 'ios-spring 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'ios-slide-up': 'ios-slide-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'ios-blur-in': 'ios-blur-in 0.3s ease-out'
			},
			fontFamily: {
				serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
				display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
				'sf-pro': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
				'inter': ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
