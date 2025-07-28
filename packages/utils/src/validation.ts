export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>\-]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSymbol = (symbol: string): boolean => {
  // Basic forex symbol validation (e.g., EURUSD, GBPJPY)
  const symbolRegex = /^[A-Z]{6}$/;
  return symbolRegex.test(symbol);
};

export const validateVolume = (volume: number): boolean => {
  return volume > 0 && volume <= 100; // Max 100 lots
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"']/g, '');
};