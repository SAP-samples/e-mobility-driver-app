export interface BadgeFilter {
  ref: ['badgeAuthenticationId'];
}

export type BadgeFilterExpression = ['in', BadgeFilter, string[]];

export interface CdsSelect {
  from: string;
  columns?: string[];
  where?: (string | object | BadgeFilterExpression)[];
  [key: string]: unknown;
}

export interface CdsSelectQuery {
  SELECT: CdsSelect;
  [key: string]: unknown;
}
