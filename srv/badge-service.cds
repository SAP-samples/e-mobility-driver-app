// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

using {RemoteBadgeService} from './external/RemoteBadgeService';

service BadgeService @(requires: 'authenticated-user') {

  @restrict: [{ grant: ['READ'], to: ['Driver'] }]
  entity Badges as projection on RemoteBadgeService.Badges;
}
