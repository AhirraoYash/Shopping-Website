// schema.js
// This file contains the SQL schema definitions required to migrate your data to Supabase (PostgreSQL).
// You can copy and paste these SQL commands directly into the Supabase SQL Editor dashboard.

const supabaseSchemaSQL = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Categories Table
-- ==========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==========================================
-- 2. Products Table
-- ==========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  details TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==========================================
-- 3. Config (Settings) Table
-- ==========================================
CREATE TABLE config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  owner_whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  -- Ensure only one config row can exist
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- ==========================================
-- 4. Initial Seed Data Configuration
-- ==========================================
INSERT INTO config (id, owner_whatsapp_number) 
VALUES (1, '911234567890')
ON CONFLICT (id) DO NOTHING;


/* 
=============================================================================
5. SETUP INSTRUCTIONS FOR SUPABASE STORAGE (For Product Images)
=============================================================================
If you plan to use Supabase Storage to store your product images instead of 
storing base64 data directly in the database:

1. Go to "Storage" in your Supabase dashboard.
2. Create a new bucket named "product-images".
3. Check the "Public" configuration so images can be viewed without logging in.
4. Execute the following Security Rules (Policies) in the SQL Editor to secure it:

   -- Allow public read access to images
   CREATE POLICY "Public Access" 
   ON storage.objects FOR SELECT 
   USING ( bucket_id = 'product-images' );

   -- Allow authenticated users to upload/update/delete images
   CREATE POLICY "Auth Upload" 
   ON storage.objects FOR INSERT 
   TO authenticated 
   WITH CHECK ( bucket_id = 'product-images' );
   
   CREATE POLICY "Auth Update" 
   ON storage.objects FOR UPDATE 
   TO authenticated 
   WITH CHECK ( bucket_id = 'product-images' );

   CREATE POLICY "Auth Delete" 
   ON storage.objects FOR DELETE 
   TO authenticated 
   USING ( bucket_id = 'product-images' );
*/
`;

export default supabaseSchemaSQL;

// If run directly via node, print the schema
if (typeof require !== 'undefined' && require.main === module) {
  console.log("Copy and paste the following SQL into your Supabase SQL Editor:\n");
  console.log(supabaseSchemaSQL);
}
