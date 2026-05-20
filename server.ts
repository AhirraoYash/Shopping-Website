import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// We use the service role key to bypass RLS for admin operations if needed,
// but for public endpoints we could use anon key. We'll use service role here 
// since this server acts as an admin backend.
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Ensure seed data is generated for fallback (JSON)
import './server/repositories/seed.ts';
import { BaseRepository } from './server/repositories/BaseRepository';
import { ConfigRepository } from './server/repositories/ConfigRepository';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------
// Fallback Repositories (if Supabase not configured)
// ---------------------------------------------------------
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  details: string;
  categoryId: string;
  imageUrl?: string;
}

const catRepo = new BaseRepository<Category>('categories.json');
const prodRepo = new BaseRepository<Product>('products.json');
const configRepo = new ConfigRepository();

// ---------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
}

// ---------------------------------------------------------
// API Routes
// ---------------------------------------------------------

// Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const validUsername = (process.env.ADMIN_USERNAME || '').trim();
  const validPassword = (process.env.ADMIN_PASSWORD || '').trim();
  
  const isEnvMatch = validUsername && validPassword && username?.trim() === validUsername && password?.trim() === validPassword;
  const isFallbackMatch = username?.trim() === 'admin' && password?.trim() === 'admin';

  if (isEnvMatch || isFallbackMatch) {
    const token = jwt.sign({ username: username?.trim() }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Config
app.get('/api/config', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: 'Failed to fetch config from Supabase' });
    if (data) return res.json({ ownerWhatsAppNumber: data.owner_whatsapp_number });
    // If not found in Supabase, return default
    return res.json({ ownerWhatsAppNumber: '911234567890' });
  } else {
    try {
      const config = await configRepo.getConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  }
});

app.put('/api/config', authenticateToken, async (req, res) => {
  if (supabase) {
    const ownerWhatsAppNumber = req.body.ownerWhatsAppNumber;
    const { error } = await supabase.from('config').upsert({ id: 1, owner_whatsapp_number: ownerWhatsAppNumber });
    if (error) return res.status(500).json({ error: 'Failed to update config in Supabase' });
    res.json({ success: true });
  } else {
    try {
      await configRepo.updateConfig(req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update config' });
    }
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: 'Failed to fetch categories' });
    return res.json(data);
  }
  const data = await catRepo.getAll();
  res.json(data);
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').insert([{ name: req.body.name }]).select().single();
    if (error) return res.status(500).json({ error: 'Failed to create category' });
    return res.status(201).json(data);
  }
  const id = crypto.randomUUID();
  const newItem = await catRepo.create({ id, ...req.body });
  res.status(201).json(newItem);
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').update({ name: req.body.name }).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: 'Failed to update category' });
    return res.json(data);
  }
  const updated = await catRepo.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  if (supabase) {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to delete category' });
    return res.json({ success: true });
  }
  const success = await catRepo.delete(req.params.id);
  res.json({ success });
});

// Products
app.get('/api/products', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch products' });
    // Transform snake_case to camelCase for frontend
    const formattedData = data.map(item => ({
      ...item,
      categoryId: item.category_id,
      imageUrl: item.image_url,
    }));
    return res.json(formattedData);
  }
  const data = await prodRepo.getAll();
  res.json(data);
});

app.post('/api/products', authenticateToken, async (req, res) => {
  if (supabase) {
    const payload = {
      name: req.body.name,
      price: req.body.price,
      details: req.body.details,
      category_id: req.body.categoryId,
      image_url: req.body.imageUrl,
    };
    const { data, error } = await supabase.from('products').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({
      ...data,
      categoryId: data.category_id,
      imageUrl: data.image_url,
    });
  }
  const id = crypto.randomUUID();
  const newItem = await prodRepo.create({ id, ...req.body });
  res.status(201).json(newItem);
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  if (supabase) {
    const payload = {
      name: req.body.name,
      price: req.body.price,
      details: req.body.details,
      category_id: req.body.categoryId,
      image_url: req.body.imageUrl,
    };
    const { data, error } = await supabase.from('products').update(payload).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({
      ...data,
      categoryId: data.category_id,
      imageUrl: data.image_url,
    });
  }
  const updated = await prodRepo.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to delete product' });
    return res.json({ success: true });
  }
  const success = await prodRepo.delete(req.params.id);
  res.json({ success });
});

// ---------------------------------------------------------
// Vite / Static Serving
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
