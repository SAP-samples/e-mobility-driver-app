import { User } from '@sap/cds';

/**
 * Strongly-typed request interfaces for CAP services
 */

// Extend the express Request type to include CDS user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      context?: {
        user?: User;
      };
    }
  }
}
