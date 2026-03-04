// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

namespace emobility.qr;

@protocol: 'rest'
@path: '/rest/qr'
@requires: 'Driver'
service QRService {

  action decryptQRData(encryptedData: String) returns {
    evseId: String;
  };

  function ping() returns String;
  
}
