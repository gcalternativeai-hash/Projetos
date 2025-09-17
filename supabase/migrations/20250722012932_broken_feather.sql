/*
  # Fix RLS policy for pedidos table

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Create new policy allowing anonymous users to insert orders
    - Maintain security while allowing public order creation

  This fixes the "new row violates row-level security policy" error
  by allowing anonymous users to create orders.
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Permitir inserção pública de pedidos" ON pedidos;

-- Create a new policy that allows anonymous users to insert orders
CREATE POLICY "Allow anonymous order creation"
  ON pedidos
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert orders
CREATE POLICY "Allow authenticated order creation"
  ON pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);