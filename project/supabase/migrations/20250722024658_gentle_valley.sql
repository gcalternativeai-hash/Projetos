/*
  # Fix RLS policy for anonymous order insertion

  1. Security Changes
    - Drop all existing conflicting policies on pedidos table
    - Create simple policy allowing anonymous users to insert orders
    - Maintain security for read/update operations (authenticated only)
    
  2. Policy Details
    - Allow INSERT for anonymous users (anon role)
    - Allow SELECT/UPDATE for authenticated users only
    - Use simple WITH CHECK (true) for maximum compatibility
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous order creation" ON pedidos;
DROP POLICY IF EXISTS "Allow authenticated order creation" ON pedidos;
DROP POLICY IF EXISTS "Permitir atualização autenticada de pedidos" ON pedidos;
DROP POLICY IF EXISTS "Permitir leitura autenticada de pedidos" ON pedidos;
DROP POLICY IF EXISTS "Permitir pedidos anônimos" ON pedidos;
DROP POLICY IF EXISTS "Allow anonymous insert for pedidos" ON pedidos;

-- Create new simple policy for anonymous order insertion
CREATE POLICY "Enable insert for anon users" ON pedidos
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Create policy for authenticated users to read orders
CREATE POLICY "Enable read for authenticated users" ON pedidos
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policy for authenticated users to update orders
CREATE POLICY "Enable update for authenticated users" ON pedidos
  FOR UPDATE 
  TO authenticated 
  USING (true);