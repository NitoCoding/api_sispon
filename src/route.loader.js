import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import * as path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesPath = path.join(__dirname, 'routes');

async function loadRoutes(app) {
  try {
    const files = await fs.readdir(routesPath);

    for (const file of files) {
      if (!file.endsWith('.js') || file === 'index.js') continue;

      const filePath = path.join(routesPath, file);
      const routeModule = await import(`file://${filePath}`); // Ensure ESM compatibility
      const route = routeModule.default;

      if (!route || typeof route !== 'function') {
        console.warn(`Skipping invalid route module: ${file}`);
        continue;
      }

      // Convert filename to route path (e.g., user_routes.js -> /user-routes)
      const routeName = path.basename(file, '.js').replace('_', '-');
      app.use(`/${routeName}`, route);
      console.log(`Loaded route: /${routeName}`);
    }
  } catch (err) {
    console.error('Error loading routes:', err);
    throw err; // Propagate error to caller
  }
}

export default loadRoutes;