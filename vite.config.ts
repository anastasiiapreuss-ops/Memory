import { defineConfig } from 'vite';

// Deployment path on the FTP server: the app lives there under /memory/,
// not at the domain root. Vite needs to know this path so the <script>/
// <link> tags it generates in dist/index.html correctly point to
// /memory/assets/... instead of /assets/....
export default defineConfig({
  base: '/memory/',
});
