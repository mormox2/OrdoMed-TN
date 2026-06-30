import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * Plugin Vite : surveille liste_amm.xlsx et régénère pct_medications.json
 * automatiquement en mode dev, et avant chaque build.
 */
function ammWatcherPlugin(): Plugin {
  const xlsxPath = path.resolve(__dirname, 'liste_amm.xlsx');
  const scriptPath = path.resolve(__dirname, 'scripts/convert_amm_xlsx_to_json.cjs');

  function runConversion(label: string) {
    console.log(`\n[amm-watcher] ${label} — Régénération de pct_medications.json...`);
    try {
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
      console.log('[amm-watcher] ✅ pct_medications.json mis à jour.');
    } catch (err) {
      console.error('[amm-watcher] ❌ Erreur lors de la conversion:', err);
    }
  }

  return {
    name: 'amm-xlsx-watcher',

    // Exécuté au démarrage du serveur dev
    buildStart() {
      runConversion('Démarrage');
    },

    // Surveille liste_amm.xlsx en mode dev
    configureServer(server) {
      server.watcher.add(xlsxPath);
      server.watcher.on('change', (changedPath) => {
        if (changedPath === xlsxPath) {
          runConversion('Fichier xlsx modifié');
          // Notifie le navigateur pour recharger les données
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [ammWatcherPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
