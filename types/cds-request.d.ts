import { Request as CdsBaseRequest, EventContext, Query } from '@sap/cds';

import { CdsSelectQuery } from './cds-query';

export interface RequestWithBadges {
  context?: EventContext;
  email?: string;
  attr?: {
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CdsRequestContext {
  headers?: Record<string, string>;
  user: RequestWithBadges;
  [key: string]: unknown;
}

export interface CdsRequestWithContext extends CdsBaseRequest {
  query: CdsSelectQuery | Query;
  context?: CdsRequestContext;
  reply: (body: unknown) => void;
}
