-- Migration to fix subscription_type values in users table
-- This script updates any subscription_type values that are not valid plan types
-- to proper plan types based on payment history or defaults to 'NA'

-- First, let's see what subscription_type values currently exist
-- (You can run this query first to see what needs to be cleaned up)
-- SELECT DISTINCT subscription_type FROM public.users;

-- Update any billing cycle values to proper plan types
UPDATE public.users 
SET subscription_type = 'STANDARD'
WHERE subscription_type IN ('monthly', 'yearly', 'instant', 'free', 'FREE');

-- Update any null or empty subscription_type to 'NA'
UPDATE public.users 
SET subscription_type = 'NA'
WHERE subscription_type IS NULL 
   OR subscription_type = '' 
   OR subscription_type NOT IN ('NA', 'STANDARD', 'PRO', 'BUSINESS', 'CUSTOM');

-- Add a check constraint to ensure only valid subscription types are allowed
-- (You may need to drop this constraint first if it already exists)
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_type_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_subscription_type_check 
CHECK (subscription_type IN ('NA', 'STANDARD', 'PRO', 'BUSINESS', 'CUSTOM'));

-- Optional: Update subscription_type based on payment history
-- This query attempts to determine the correct plan type based on the most recent payment
UPDATE public.users 
SET subscription_type = CASE 
    WHEN (
        SELECT payment_amount 
        FROM payment_transactions 
        WHERE user_id = users.id 
          AND payment_status = 'completed' 
        ORDER BY created_at DESC 
        LIMIT 1
    ) >= 99 THEN 'BUSINESS'
    WHEN (
        SELECT payment_amount 
        FROM payment_transactions 
        WHERE user_id = users.id 
          AND payment_status = 'completed' 
        ORDER BY created_at DESC 
        LIMIT 1
    ) >= 29 THEN 'PRO'
    WHEN (
        SELECT payment_amount 
        FROM payment_transactions 
        WHERE user_id = users.id 
          AND payment_status = 'completed' 
        ORDER BY created_at DESC 
        LIMIT 1
    ) > 0 THEN 'STANDARD'
    ELSE 'NA'
END
WHERE subscription_type = 'STANDARD' -- Only update those that were set to default STANDARD
  AND EXISTS (
      SELECT 1 FROM payment_transactions 
      WHERE user_id = users.id 
        AND payment_status = 'completed'
  );

-- If you have a payment_subscriptions table, you might also want to clean that up
-- UPDATE public.payment_subscriptions 
-- SET subscription_type = CASE 
--     WHEN payment_amount >= 99 THEN 'BUSINESS'
--     WHEN payment_amount >= 29 THEN 'PRO'
--     WHEN payment_amount > 0 THEN 'STANDARD'
--     ELSE 'STANDARD'
-- END
-- WHERE subscription_type IN ('monthly', 'yearly', 'instant', 'free', 'FREE')
--    OR subscription_type NOT IN ('STANDARD', 'PRO', 'BUSINESS', 'CUSTOM');