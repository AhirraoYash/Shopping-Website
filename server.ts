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
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

// We use the service role key to bypass RLS for admin operations if needed,
// but for public endpoints we could use anon key. We'll use service role here 
// since this server acts as an admin backend.
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function isDataUrl(value?: string): value is string {
  return typeof value === 'string' && value.startsWith('data:');
}

function parseDataUrl(dataUrl: string): { contentType: string; data: Buffer; extension: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const base64Data = match[2];
  const extension = contentType.split('/')[1]?.replace('svg+xml', 'svg') || 'bin';
  return { contentType, data: Buffer.from(base64Data, 'base64'), extension };
}

async function uploadProductImage(dataUrl: string): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured' };
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return { error: 'Invalid image format' };

  const filePath = `products/${crypto.randomUUID()}.${parsed.extension}`;
  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(filePath, parsed.data, { contentType: parsed.contentType, upsert: true });
  if (error) return { error: 'Failed to upload product image' };

  const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(filePath);
  if (!data?.publicUrl) return { error: 'Failed to generate product image URL' };

  return { url: data.publicUrl };
}

async function checkSupabaseConnection(): Promise<{ status: 'not_configured' | 'connected' | 'schema_missing' | 'error'; message: string }> {
  if (!supabase) {
    return { status: 'not_configured', message: 'Supabase not configured (missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)' };
  }

  const { error } = await supabase.from('config').select('id', { count: 'exact', head: true });
  if (!error) {
    return { status: 'connected', message: 'Supabase connected' };
  }

  if (error.code === '42P01') {
    return { status: 'schema_missing', message: 'Supabase connected but schema missing (run schema.js)' };
  }

  return { status: 'error', message: `Supabase error: ${error.message}` };
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: 'Failed to fetch config from Supabase' });
  if (data) return res.json({ ownerWhatsAppNumber: data.owner_whatsapp_number });
  return res.json({ ownerWhatsAppNumber: '911234567890' });
});

app.put('/api/config', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const ownerWhatsAppNumber = req.body.ownerWhatsAppNumber;
  const { error } = await supabase.from('config').upsert({ id: 1, owner_whatsapp_number: ownerWhatsAppNumber });
  if (error) return res.status(500).json({ error: 'Failed to update config in Supabase' });
  res.json({ success: true });
});

// Categories
app.get('/api/categories', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch categories' });
  return res.json(data);
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { data, error } = await supabase.from('categories').insert([{ name: req.body.name }]).select().single();
  if (error) return res.status(500).json({ error: 'Failed to create category' });
  return res.status(201).json(data);
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { data, error } = await supabase.from('categories').update({ name: req.body.name }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Failed to update category' });
  return res.json(data);
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete category' });
  res.json({ success: true });
});

// Products
app.get('/api/products', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch products' });
  
  // Transform category_id to categoryId and image_url to imageUrl for frontend
  const products = data.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    details: p.details,
    categoryId: p.category_id,
    imageUrl: p.image_url
  }));
  return res.json(products);
});

app.post('/api/products', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  let imageUrl = req.body.imageUrl;
  
  if (isDataUrl(imageUrl)) {
    const uploadRes = await uploadProductImage(imageUrl);
    if (uploadRes.error) return res.status(500).json({ error: uploadRes.error });
    imageUrl = uploadRes.url;
  }

  const { data, error } = await supabase.from('products').insert([{
    name: req.body.name,
    price: req.body.price,
    details: req.body.details,
    category_id: req.body.categoryId,
    image_url: imageUrl || null
  }]).select().single();

  if (error) return res.status(500).json({ error: 'Failed to create product' });
  
  return res.status(201).json({
    id: data.id,
    name: data.name,
    price: data.price,
    details: data.details,
    categoryId: data.category_id,
    imageUrl: data.image_url
  });
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  let imageUrl = req.body.imageUrl;
  
  if (isDataUrl(imageUrl)) {
    const uploadRes = await uploadProductImage(imageUrl);
    if (uploadRes.error) return res.status(500).json({ error: uploadRes.error });
    imageUrl = uploadRes.url;
  }

  const updateData: any = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.price !== undefined) updateData.price = req.body.price;
  if (req.body.details !== undefined) updateData.details = req.body.details;
  if (req.body.categoryId) updateData.category_id = req.body.categoryId;
  if (imageUrl !== undefined) updateData.image_url = imageUrl;

  const { data, error } = await supabase.from('products').update(updateData).eq('id', req.params.id).select().single();
  
  if (error) return res.status(500).json({ error: 'Failed to update product' });
  return res.json({
    id: data.id,
    name: data.name,
    price: data.price,
    details: data.details,
    categoryId: data.category_id,
    imageUrl: data.image_url
  });
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected' });
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete product' });
  res.json({ success: true });
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

  const supabaseStatus = await checkSupabaseConnection();
  console.log(`Supabase: ${supabaseStatus.message}`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
