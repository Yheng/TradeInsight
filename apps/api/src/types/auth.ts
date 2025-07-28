import { Request } from 'express';
import { UserRole } from '@tradeinsight/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}