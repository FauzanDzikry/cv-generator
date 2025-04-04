/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./resources/**/*.{js,jsx,ts,tsx,blade.php}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
          primary: {
            DEFAULT: '#FF0000',
            foreground: '#FFFFFF',
          },
          // Anda juga bisa menambahkan variasi warna merah lainnya
          // seperti primary-light, primary-dark, dll.
        }
      },
    },
    plugins: [],
  }