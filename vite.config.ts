import { defineConfig } from 'vite';

// Deployment path on the FTP server: the built app is served from
// /Memory/dist/ (capital M – the server path is case-sensitive), not from
// /Memory/ itself and not from the domain root. Vite needs to know this
// path so the <script>/<link> tags it generates in dist/index.html
// correctly point to /Memory/dist/assets/... instead of /assets/....
export default defineConfig({
  base: '/Memory/dist/',
});
