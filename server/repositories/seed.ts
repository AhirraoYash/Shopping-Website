import fs from 'fs';
import path from 'path';

// Seed initial data if doesn't exist
function ensureDataDir() {
  const dir = path.join(process.cwd(), 'server', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const catPath = path.join(dir, 'categories.json');
  if (!fs.existsSync(catPath)) {
    fs.writeFileSync(
      catPath,
      JSON.stringify([
        { id: 'cat-1', name: 'Lighting' },
        { id: 'cat-2', name: 'Wiring & Cables' },
        { id: 'cat-3', name: 'Switches & Sockets' },
      ], null, 2)
    );
  }

  const prodPath = path.join(dir, 'products.json');
  if (!fs.existsSync(prodPath)) {
    fs.writeFileSync(
      prodPath,
      JSON.stringify([
        {
          id: 'prod-1',
          name: 'LED Bulb 9W',
          price: 99,
          details: 'High quality energy efficient LED bulb. 1 year warranty.',
          categoryId: 'cat-1',
        },
        {
          id: 'prod-2',
          name: 'Copper Wire 1.5 sq mm (90m)',
          price: 1200,
          details: 'Fire resistant copper wire for domestic wiring.',
          categoryId: 'cat-2',
        },
        {
          id: 'prod-3',
          name: 'Modular Switch 6A',
          price: 45,
          details: 'Durable white modular switch.',
          categoryId: 'cat-3',
        },
      ], null, 2)
    );
  }
}

ensureDataDir();
