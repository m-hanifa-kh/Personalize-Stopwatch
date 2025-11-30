// tailwind.config.js
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito-Regular', ...defaultTheme.fontFamily.sans],
                'custom-interface': ['HanifHandwritingV5-Regular', 'sans-serif'],
                'custom-brand': ['spiritmedium', 'sans-serif'],
                'custom-timer': ['Nunito-Regular', 'sans-serif'],
            },
        },
    },
    content: [
        // Paths to your template files
        './src/**/*.{html,js,jsx,ts,tsx}',
    ],
    plugins: [],
};
