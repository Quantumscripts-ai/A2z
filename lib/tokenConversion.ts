// Token conversion utilities

export const TOKEN_CONVERSION = {
  USD_TO_TOKENS: 100, // $1 = 100 tokens
  TOKENS_TO_USD: 0.01, // 1 token = $0.01
};

export const convertUSDToTokens = (amountUSD: number): number => {
  return Math.floor(amountUSD * TOKEN_CONVERSION.USD_TO_TOKENS);
};

export const convertTokensToUSD = (tokens: number): number => {
  return Number((tokens * TOKEN_CONVERSION.TOKENS_TO_USD).toFixed(2));
};
