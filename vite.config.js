import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: o mesmo build funciona em brunocarvalhs.github.io/bem-ti-click/ ou em qualquer domínio.
export default defineConfig({
  base: './',
  plugins: [react()],
});
