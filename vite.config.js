import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// For GitHub Pages project sites, set VITE_BASE_PATH to '/<repo-name>/'.
// Local development can stay on '/' (default).
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        base: env.VITE_BASE_PATH || '/',
    };
});
