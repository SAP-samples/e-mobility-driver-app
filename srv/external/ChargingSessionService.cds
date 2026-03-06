// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/* checksum : 75a64d6341a056b4428765ccb1358690 */
/**
 * Manage your charging sessions
 * 
 * From the entity Charging Sessions, retrieve information about your SAP E-Mobility charging sessions, whether they are ongoing or finished, for reporting or support purposes. The values include: authorizations, start and stop details, and signed meter values. From the entity Charge Detail Records, retrieve information about any finished charging session for billing, reimbursement, and reporting, regardless of their source – SAP E-Mobility or another solution. You can also import charge detail records created in external systems, and update or delete them.
 */
@cds.external : true
@Common.Label : 'Charging Session'
@Authorization.Authorizations : [
  {
    $Type: 'Authorization.OAuth2ClientCredentials',
    Name: 'oAuth2',
    Description: 'Authentication via OAuth2 with client credentials flow',
    TokenUrl: 'https://{identityzone}.authentication.{region}.hana.ondemand.com/oauth/token',
    Scopes: [
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSESSION_READ',
        Description: 'Retrieves charging sessions.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGEDETAILRECORD_CREATE',
        Description: 'Imports charge detail records that were created in an external system.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGEDETAILRECORD_UPDATE',
        Description: 'Updates charge detail records that were imported from an external system.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGEDETAILRECORD_DELETE',
        Description: 'Deletes charge detail records that were imported from an external system.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGEDETAILRECORD_READ',
        Description: 'Retrieves charge detail records.'
      }
    ]
  }
]
@Capabilities.BatchSupported : true
service ChargingSessionService {
  /**
   * Retrieves calculated charging periods for a list of charging sessions.
   * 
   * Use the following request to calculate charging periods for a list of charging sessions.
   */
  @cds.external : true
  @Common.Label : 'Calculate Charging Periods'
  action CalculateChargingPeriods(
    @Common.FieldControl : #Mandatory
    chargingPeriodDefinitions : many ChargingPeriodDefinition,
    @Common.FieldControl : #Mandatory
    chargingSessionIds : many Integer
  ) returns many ChargingPeriodResponse;

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Authorizations'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Authorizations {
    /** The unique identifier of the authorization */
    @Core.ComputedDefaultValue : true
    key id : UUID not null;
    /** The time stamp when the charging session was authorized */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /** The badge authentication ID associated with the authorization */
    badgeAuthenticationId : LargeString;
    /** The reference to the authorization given by the mobility service provider */
    reference : LargeString;
    /** The authorization method of the charging session */
    method : LargeString;
    /** Indicates the status of the authorization, such as allowed or blocked. */
    status : LargeString;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Sessions'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Sessions {
    /** The charging session's unique identifier in SAP E-Mobility */
    @Core.ComputedDefaultValue : true
    key id : UUID not null;
    /** The unique OCPP transaction identifier in SAP E-Mobility, from which the charging session originates */
    parentOcppTransactionId : Integer;
    /** The validation channel used for the charging session */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'INTERNAL',
        Value: 'INTERNAL'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'GIREVE',
        Value: 'GIREVE'
      }
    ]
    validationChannel : LargeString;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'ErrorMessages'
  @UI.Identification : [ { $Type: 'UI.DataField', Value: name } ]
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity ErrorMessages {
    /** The code of the error message */
    @Common.Text : name
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'no_consumption',
        Value: 'no_consumption'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'average_consumption_greater_than_connector_capacity',
        Value: 'average_consumption_greater_than_connector_capacity'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'negative_inactivity',
        Value: 'negative_inactivity'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'long_inactivity',
        Value: 'long_inactivity'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'negative_duration',
        Value: 'negative_duration'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'incorrect_starting_date',
        Value: 'incorrect_starting_date'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'missing_price',
        Value: 'missing_price'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'data_transfer_in_progress',
        Value: 'data_transfer_in_progress'
      }
    ]
    key code : LargeString not null;
    /** The description of the error message */
    @Common.Label : '{i18n>Description}'
    description : String(1000);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'RemoteStops'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity RemoteStops {
    key ID: String not null;
    /** Indicates the source that initiated the charging session's remote stop. */
    createdBy : LargeString;
    /** The time stamp when the charging session's remote stop was initiated */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Errors'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Errors {
    /** The unique identifier of the error */
    key ID: String not null;
    /** Detailed information about the error message */
    errorMessage : Composition of many ErrorMessages {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Stops'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Stops {
    key ID: String not null;
    /** The time stamp when the charging session's stop was initiated */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /** The value of the meter after the charging session was stopped */
    stopMeterValue : Double;
    /** Inactivity related to smart charging: The total duration in seconds during which no energy has been delivered because of charging station power limits or charging de-prioritization. */
    extraInactivity : Double;
    /** A letter indicating how long the charging session has been inactive. Possible values: * I: Informative inactivity, less than 30 minutes * W: Inactivity warning, between 30 and 60 minutes * E: Extensive inactivity, greater than 60 minutes */
    @Validation.AllowedValues : [
      { $Type: 'Validation.AllowedValue', @Core.SymbolicName: 'I', Value: 'I' },
      { $Type: 'Validation.AllowedValue', @Core.SymbolicName: 'W', Value: 'W' },
      { $Type: 'Validation.AllowedValue', @Core.SymbolicName: 'E', Value: 'E' }
    ]
    inactivityStatus : LargeString;
    /** The last signed meter value retrieved when the charging session was stopped */
    stopSignedMeterValue : LargeString;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Charging Sessions'
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of charging sessions.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to fetch data related to your charging sessions.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a charging session with a specific identifier.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to fetch data related to a specific charging session.'
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  entity ChargingSessions {
    /** The unique OCPP transaction identifier in SAP E-Mobility and its resulting charging session ID in SAP E-Mobility */
    @Core.Computed : true
    key id : Integer not null;
    /** The charging session's OCPI identifier used for roaming */
    sessionId : UUID;
    /** The site's unique identifier associated with the charging session */
    siteId : UUID;
    /** The site area's unique identifier associated with the charging session */
    siteAreaId : UUID;
    /** The site area's name associated with the charging session */
    siteAreaName : String(100);
    /** The site's name associated with the charging session */
    siteName : String(100);
    /** The total amount of energy delivered during the charging session in watt-hours (Wh) */
    @Core.Computed : true
    totalEnergyDelivered : Double;
    /** The authentication identifier of the badge used to initiate the charging session */
    badgeAuthenticationId : LargeString;
    /** The visual identifier of the badge used to initiate the charging session */
    badgeVisualBadgeId : LargeString;
    /** The value of the meter when the charging session was started */
    startMeterValue : Double;
    /** The time stamp when the charging session was started */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /** The cost of the charging session */
    @Core.Computed : true
    cumulatedPrice : Double;
    /** The charging session's cost per kWh */
    pricePerKwh : Double;
    /** The currency used for the cost of the charging session */
    currency : LargeString;
    /** The total sales amount of the charging session */
    @Core.Computed : true
    cumulatedSalesAmount : Double;
    /** The charging session's sales amount per kWh */
    @Core.Computed : true
    salesAmountPerKwh : Double;
    /** The currency used for the sales amount of the charging session */
    salesAmountCurrency : LargeString;
    /** The last known state of charge, expressed as a percentage, of the vehicle during the charging session, or 0 when the state of charge is unknown */
    stateOfCharge : Double;
    /** The time zone of the charging session */
    timezone : LargeString;
    /** The time stamp during the ongoing charging session */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    currentTimestamp : Timestamp;
    /** Inactivity related to the state of charge: The total duration in seconds during which no energy has been delivered because the vehicle's battery is already full. */
    @Core.Computed : true
    totalInactivity : Double;
    /** The charging session's entire duration in seconds. It includes the inactivity and the extra inactivity. */
    @Core.Computed : true
    totalDuration : Double;
    /** The status of the charging session */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'InProgress',
        Value: 'InProgress'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Finished',
        Value: 'Finished'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'InError',
        Value: 'InError'
      }
    ]
    status : LargeString;
    /** The list of errors that occurred during the charging session */
    errors : Composition of many Errors {  };
    /** The status of the connector used for the charging session */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Available',
        Value: 'Available'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Preparing',
        Value: 'Preparing'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Charging',
        Value: 'Charging'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Occupied',
        Value: 'Occupied'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'SuspendedEVSE',
        Value: 'SuspendedEVSE'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'SuspendedEV',
        Value: 'SuspendedEV'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Finishing',
        Value: 'Finishing'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Reserved',
        Value: 'Reserved'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Unavailable',
        Value: 'Unavailable'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Faulted',
        Value: 'Faulted'
      }
    ]
    connectorStatus : LargeString;
    /** Refers to the count of meter values included in the charging session. */
    numberOfMeterValues : Double;
    /** The vehicle model's unique identifier associated with the charging session */
    vehicleModelId : String(36);
    /** The unique identifier of the connector used for the charging session */
    connectorId : Integer;
    /** The first signed meter value retrieved from the charging session */
    startSignedMeterValue : LargeString;
    /** Detailed information when the charging session was stopped. Attribute values may change if additional OCPP operations are received between the processing of the StopTransaction and the complete closure of the charging session. */
    stop : Composition of one Stops {  };
    /** Detailed information about the charging session's remote stop */
    remoteStop : Composition of one RemoteStops {  };
    /** The authorization of the charging session */
    authorization : Association to one Authorizations {  };
    /** The authorization of the charging session */
    authorization_ID : UUID;
    /** The code of the EVSE used for the charging session */
    evseCode : String(32);
    /** The eMi³ identifier of the EVSE used for the charging session */
    @Validation.Pattern : '(^$)|^[A-Za-z]{2}\*[0-9A-Za-z]{3}\*E[0-9A-Za-z][0-9A-Za-z\*]{0,30}$'
    emi3Id : String(39);
    /** The name of the charging station */
    chargingStationName : String(50);
    /** The external EMSP provider ID */
    badgeProviderId : String(64);
    /** The validation channel used for the charging session */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'INTERNAL',
        Value: 'INTERNAL'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'GIREVE',
        Value: 'GIREVE'
      }
    ]
    validationChannel : LargeString;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Charge Detail Records'
  @Capabilities.ReadRestrictions.Readable : true
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of charge detail records.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to fetch data related to your charge detail records.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a charge detail record with a specific identifier.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to fetch data related to a charge detail record.'
  @Capabilities.UpdateRestrictions.Updatable : true
  @Capabilities.UpdateRestrictions.Description : 'Updates a charge detail record.'
  @Capabilities.UpdateRestrictions.LongDescription : 'Use the following request to update a charge detail record that was imported from an external system.'
  @Capabilities.InsertRestrictions.Insertable : true
  @Capabilities.InsertRestrictions.Description : 'Creates a charge detail record.'
  @Capabilities.InsertRestrictions.LongDescription : 'Use the following request to import a charge detail record that was created in an external system.'
  @Capabilities.DeleteRestrictions.Deletable : true
  @Capabilities.DeleteRestrictions.Description : 'Deletes a charge detail record.'
  @Capabilities.DeleteRestrictions.LongDescription : 'Use the following request to delete a charge detail record that was imported from an external system.'
  entity ChargeDetailRecords {
    /** The unique identifier of the charge detail record in SAP E-Mobility */
    @Core.ComputedDefaultValue : true
    key id : UUID not null;
    /** The origin of the charge detail record, whether it was created in SAP E-Mobility or in another solution */
    @Core.Computed : true
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Internal',
        Value: 'Internal'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'External',
        Value: 'External'
      }
    ]
    source : LargeString;
    /** The authentication identifier of the badge used to initiate the charging session */
    @Common.FieldControl : #Mandatory
    badgeAuthenticationId : LargeString;
    /** An additional user identifier associated with the charging session */
    userId : LargeString;
    /** The license plate of the vehicle for which the charging session was initiated */
    licensePlate : LargeString;
    /** The charging session's technical identifier */
    @Core.Computed : true
    chargingSessionId : LargeString;
    /** The time stamp when the charging session was started */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    @Common.FieldControl : #Mandatory
    startTimestamp : Timestamp;
    /** The time stamp when the charging session was stopped */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    @Common.FieldControl : #Mandatory
    stopTimestamp : Timestamp;
    /** The charging session's entire duration in seconds. It includes the inactivity and the extra inactivity. */
    @Common.FieldControl : #Mandatory
    duration : Double;
    /** Inactivity related to the state of charge: The total duration in seconds during which no energy has been delivered because the vehicle's battery is already full. */
    inactivity : Double;
    /** The total amount of energy delivered during the charging session in watt-hours (Wh) */
    @Common.FieldControl : #Mandatory
    energyDelivered : Double;
    /** The price of the charging session */
    @Common.FieldControl : #Mandatory
    price : Double;
    /** The currency of the charging session */
    @Common.FieldControl : #Mandatory
    currency : LargeString;
    /** The name of the charging station */
    chargingStationName : LargeString;
    /** The unique identifier of the connector */
    connectorId : Integer;
    /** The name of the company */
    companyName : LargeString;
    /** The name of the site */
    siteName : LargeString;
    /** The name of the site area */
    siteAreaName : LargeString;
  };

  @cds.external : true
  type ChargingPeriodResponse {
    /** The charging session's technical identifier */
    chargingSessionId : Integer;
    /** A list of charging periods */
    chargingPeriods : many ChargingPeriods;
    /** A list of totals */
    total : many Total;
  };

  @cds.external : true
  type ChargingPeriods {
    /** The start date and time of a charging period. If energy starts being delivered in this charging period, it is considered part of this charging period. */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    startDateTime : Timestamp;
    /** The end date and time of a charging period. If energy starts being delivered in this charging period, it is considered part of this charging period. */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    endDateTime : Timestamp;
    /** The name of a charging period */
    name : LargeString;
    /** A list of characteristics that define the charging period */
    characteristics : many Characteristics;
    /** A sequential identifier representing the order of charging periods, starting from 1 for the first period and incrementing by 1 for each subsequent period */
    index : Integer;
  };

  @cds.external : true
  type Characteristics {
    /** The type of charging period. Can be either measured in time or energy. */
    type : LargeString;
    /** The length of a charging period or the amount of energy delivered during a charging period */
    volume : Double;
    /** The unit of the length of a charging period or of the amount of energy delivered during a charging period */
    unit : LargeString;
  };

  @cds.external : true
  type Total {
    /** The name of a charging period */
    name : LargeString;
    /** A list of characteristics that define different total amounts for a charging period */
    characteristics : many Characteristics;
  };

  @cds.external : true
  type ChargingPeriodDefinition {
    /** The name of a charging period */
    @Common.FieldControl : #Mandatory
    name : LargeString not null;
    /** The start time of a charging period */
    @Common.FieldControl : #Mandatory
    startedAt : Time not null;
    /** The end time of a charging period */
    @Common.FieldControl : #Mandatory
    endedAt : Time not null;
  };
};

