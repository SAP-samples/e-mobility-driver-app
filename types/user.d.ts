import { User } from '@sap/cds';

export interface UserWithBadges extends User {
  badges?: string[];
}
