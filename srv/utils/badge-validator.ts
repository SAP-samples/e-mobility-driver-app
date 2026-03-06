// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { LRUCache } from 'lru-cache';

import cds, { Request } from '@sap/cds';

import { getEmailFromRequest } from './user-utils';

import { Badge } from '#cds-models/BadgeService';

// Extend CDS User type to include badges
declare module '@sap/cds' {
  interface User {
    badges?: UserBadge[];
  }
}

export interface UserBadge {
  authenticationId: string;
  active: boolean;
}

export class BadgeValidator {
  private static instance: BadgeValidator;
  private readonly userBadgeCache: LRUCache<string, UserBadge[]>;
  private readonly logger = cds.log('BadgeValidator');

  constructor() {
    // LRU cache handles everything - no manual timestamp management needed
    this.userBadgeCache = new LRUCache<string, UserBadge[]>({
      max: 1000, // Maximum 1000 users in cache
      ttl: 5 * 60 * 1000, // 5 minutes TTL
      allowStale: false,
      updateAgeOnGet: true, // Reset TTL on access
    });
  }

  static getInstance(): BadgeValidator {
    if (!BadgeValidator.instance) {
      BadgeValidator.instance = new BadgeValidator();
    }
    return BadgeValidator.instance;
  }

  /**
   * Get user badges with caching (core method)
   */
  async getUserBadges(email: string): Promise<UserBadge[]> {
    // Check cache first - LRU handles TTL automatically
    const cached = this.userBadgeCache.get(email);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from external service
      const badgeService = await cds.connect.to('RemoteBadgeService');
      const selectQuery = SELECT.from('Badges')
        .columns('authenticationId', 'active')
        .where({ email });
      const badgeRows = await badgeService.run(selectQuery);

      const badges = badgeRows
        .filter((b: Badge) => b && b.authenticationId) // Ensure valid entries
        .map((b: Badge) => {
          return {
            authenticationId: b.authenticationId!,
            active: b.active ?? false,
          };
        });

      // Store in cache - LRU handles TTL and eviction
      this.userBadgeCache.set(email, badges);

      return badges;
    } catch (error) {
      console.error('❌ ERROR in getUserBadges:', error);
      this.logger.error(`Failed to fetch badges for user ${email}:`, error);
      return [];
    }
  }

  /**
   * Get user badges with caching and context population
   * This method ensures badges are available in cds.context.user.badges
   */
  async ensureUserBadgesInContext(email: string): Promise<UserBadge[]> {
    const badges = await this.getUserBadges(email);

    // Populate CDS context for downstream flexibility
    if (cds.context?.user && Array.isArray(badges) && badges.length > 0) {
      // @ts-expect-error context already checked
      cds.context.user.badges = badges;
    }

    return badges;
  }

  /**
   * Validate if user has at least one active badge
   */
  async validateBadgeAccess(email: string): Promise<boolean> {
    const userBadges = await this.getUserBadges(email);

    return userBadges.length > 0 && userBadges.some((badge) => badge.active);
  }

  /**
   * Clear cache for a specific user (useful for real-time updates)
   */
  invalidateUser(email: string): void {
    this.userBadgeCache.delete(email);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.userBadgeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.userBadgeCache.size,
      max: this.userBadgeCache.max,
    };
  }
}

export async function requireBadgeAccess(req: Request): Promise<void> {
  const email = getEmailFromRequest(req);

  if (!email) {
    req.reject(401, 'Authentication required - no user context found');
  }

  const validator = BadgeValidator.getInstance();
  const hasAccess = await validator.validateBadgeAccess(email);

  if (!hasAccess) {
    req.reject(403, 'No valid badges found for user. Access denied.');
  }

  await validator.ensureUserBadgesInContext(email);
}

export async function getCurrentUserBadges(): Promise<UserBadge[]> {
  const contextBadges = cds.context?.user?.badges;
  if (contextBadges && Array.isArray(contextBadges)) {
    return contextBadges;
  }

  const email = cds.context?.user?.attr?.email || cds.context?.user?.id;
  if (!email) {
    return [];
  }

  const validator = BadgeValidator.getInstance();
  return await validator.ensureUserBadgesInContext(email);
}

export async function getActiveUserBadge(): Promise<UserBadge | undefined> {
  const badges = await getCurrentUserBadges();
  return badges.find((badge) => badge.active);
}

export async function hasUserBadge(authenticationId: string): Promise<boolean> {
  const badges = await getCurrentUserBadges();
  return badges.some((badge) => badge.authenticationId === authenticationId);
}
