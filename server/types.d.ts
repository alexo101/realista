import 'express-session';
import { SessionUser } from './middleware/auth';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
    }
  }
}

export {};
