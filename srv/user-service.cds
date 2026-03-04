// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

namespace emobility.cpo;

@protocol : 'rest'
@path     : '/user-api'
service UserService @(requires: 'authenticated-user') {

  function currentUser() returns {
    firstname: String;
    lastname: String;
    email : String;
  };
}
