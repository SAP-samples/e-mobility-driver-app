import { Query } from '@sap/cds';

export interface UaaCredentials {
  uaa: object;
}

export interface ServiceWithUaa {
  options: {
    credentials: UaaCredentials;
  };
  run: (query: Query) => Promise<unknown>;
}
