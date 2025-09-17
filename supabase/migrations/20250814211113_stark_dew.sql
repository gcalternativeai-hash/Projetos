/*
  # Add ingredientes column to produtos table

  1. Changes
    - Add `ingredientes` column as text array to produtos table
    - Set default empty array for existing products
    - Update any existing products to have empty array if null

  2. Security
    - No changes to RLS policies needed
*/

-- Add ingredientes column as text array
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ingredientes text[] DEFAULT '{}';

-- Update any existing null values to empty array
UPDATE produtos SET ingredientes = '{}' WHERE ingredientes IS NULL;