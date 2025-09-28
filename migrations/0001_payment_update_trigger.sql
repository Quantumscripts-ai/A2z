-- Create function to update user tokens
CREATE OR REPLACE FUNCTION update_user_tokens()
RETURNS TRIGGER AS $$
DECLARE
  tokens_to_add INTEGER;
BEGIN
  -- Convert amount_usd to tokens (assuming $1 = 100 tokens)
  tokens_to_add := NEW.amount_usd * 1;

  -- Update the user's token balance and total tokens purchased
  UPDATE users
  SET 
    token_balance = COALESCE(token_balance, 0) + tokens_to_add,
    total_tokens_purchased = COALESCE(total_tokens_purchased, 0) + tokens_to_add
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user tokens after payment
DROP TRIGGER IF EXISTS update_user_tokens_trigger ON payment_transactions;
CREATE TRIGGER update_user_tokens_trigger
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tokens();

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);