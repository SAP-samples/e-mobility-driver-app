// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/* checksum : f12b19cfce7b33cb11194339591d1d60 */
/**
 * Manage your charging stations
 * 
 * Retrieve charging station information, such as details related to your EVSEs (Electric Vehicle Supply Equipments).
 */
@cds.external : true
@Common.Label : 'Charging Station'
@Authorization.Authorizations : [
  {
    $Type: 'Authorization.OAuth2ClientCredentials',
    Name: 'oAuth2',
    Description: 'Authentication via OAuth2 with client credentials flow',
    TokenUrl: 'https://{identityzone}.authentication.{region}.hana.ondemand.com/oauth/token',
    Scopes: [
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'SAP_EMO_API_EVSE_READ',
        Description: 'Retrieves EVSEs.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_EVSE_READ',
        Description: 'Retrieves EVSEs.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_EVSE_UPDATE',
        Description: 'Updates EVSEs.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_READ',
        Description: 'Retrieves charging stations.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_TRANSFERDATA',
        Description: 'Transfers vendor-specific data to a charging station.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_RESET',
        Description: 'Reboots (hard resets) and soft resets charging stations.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_START',
        Description: 'Starts charging sessions on charging stations.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_STOP',
        Description: 'Stops charging sessions on charging stations.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGSTATION_UPDATE',
        Description: 'Assigns a charging station to another site area.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGPLAN_CREATE',
        Description: 'Creates a charging plan for a charging station.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGPLAN_UPDATE',
        Description: 'Updates a charging plan for a charging station.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGPLAN_READ',
        Description: 'Retrieves charging plans.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'API_CHARGINGPLAN_DELETE',
        Description: 'Deletes charging plans.'
      }
    ]
  }
]
@Capabilities.BatchSupported : false
@Capabilities.DeepUpdateSupport.Supported : true
service ChargingStationService {
  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Charging Stations'
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of charging stations.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to fetch data related to your charging stations.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a charging station with a specific identifier.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to fetch data related to a charging station by providing its ID.'
  @Capabilities.ReadRestrictions.Readable : true
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity ChargingStations {
    /** The charging station's unique identifier in SAP E-Mobility */
    @Core.Computed : true
    @Core.ComputedDefaultValue : true
    key id : UUID not null;
    /** The name of the charging station */
    name : String(50);
    /** The registration status of the charging station */
    registrationStatus : LargeString;
    /** The site's unique identifier associated with the charging station */
    siteId : UUID;
    /** The site area's unique identifier associated with the charging station */
    siteAreaId : UUID;
    /** The site area's name associated with the charging station */
    siteAreaName : String(100);
    /** The site's name associated with the charging station */
    siteName : String(100);
    /** The serial number of the charging station */
    @Core.Computed : true
    serialNumber : LargeString;
    /** The model of the charging station */
    model : String(20);
    /** The vendor of the charging station */
    vendor : String(25);
    /** The charging station's ICCID (Integrated Circuit Card Identifier) */
    iccid : String(20);
    /** The charging station's IMSI (International Mobile Subscriber Identity) */
    imsi : String(20);
    /** The energy meter type used by the charging station */
    meterType : String(25);
    /** The firmware version installed on the charging station */
    firmwareVersion : String(50);
    /** The status of the charging station's firmware update process */
    firmwareUpdateStatus : String(20);
    /** The serial number of the energy meter installed within the charging station */
    meterSerialNumber : String(25);
    /** The OCPP version of the charging station */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1.6' }
    ocppVersion : String(5);
    /** The OCPP format of the charging station */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'json' }
    ocppFormat : String(4);
    /** The URL the charging station connects to */
    publicUrl : String(2048);
    /** The time stamp when the charging station was seen online for the last time */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    lastSeenAt : Timestamp;
    /** Indicates if the charging station has been disabled by a user. */
    disabled : Boolean default false;
    /** Indicates if the charging station has been manually configured. */
    manualConfiguration : Boolean default false;
    /** The time stamp when the charging station was last rebooted */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    rebootedAt : Timestamp;
    /** The maximum power of the charging station */
    maximumPower : Double;
    /** The potential difference of the charging station expressed in volts (V) */
    voltage : Integer;
    /** Indicates if the charging station is excluded from dynamic load management. */
    excludedFromDynamicLoadManagement : Boolean default false;
    /**
     * The standard parameters defined by the OCPP specification
     * 
     * The standard parameters defined by the OCPP specification
     */
    ocppStandardParameters : many ChargingStations_ocppStandardParameters;
    /**
     * The vendor-specific parameters that extend the standard OCPP specification
     * 
     * The vendor-specific parameters that extend the standard OCPP specification
     */
    ocppVendorParameters : many ChargingStations_ocppVendorParameters;
    /**
     * The roaming status of the charging station
     * 
     * Indicates if the charging station is part of a roaming network.
     */
    roaming : Boolean default false;
  } actions {
    /**
     * Reboots (hard resets) or soft resets a charging station.
     * 
     * Use the following request to reboot (hard reset) a charging station if the type is set to 'Hard' or to soft reset a charging station if the type is set to 'Soft'.
     */
    action Reset(
      ![in] : $self,
      @Validation.AllowedValues : [
        {
          $Type: 'Validation.AllowedValue',
          @Core.SymbolicName: 'Soft',
          Value: 'Soft'
        },
        {
          $Type: 'Validation.AllowedValue',
          @Core.SymbolicName: 'Hard',
          Value: 'Hard'
        }
      ]
      type : LargeString
    ) returns emobility_cpo_api_odata_OCPPResetResponse;
    /**
     * Starts a charging session for a charging station and a badge.
     * 
     * Use the following request to start a charging session for a charging station and a badge, which must be identified by its authentication ID.
     */
    action Start(
      ![in] : $self,
      @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1234ABCD' }
      @Common.FieldControl : #Mandatory
      badgeAuthenticationId : LargeString,
      @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1' }
      @Common.FieldControl : #Mandatory
      connectorId : Integer
    ) returns emobility_cpo_api_odata_OCPPStartResponse;
    /**
     * Stops a charging session running at a charging station.
     * 
     * Use the following request to stop a charging session running at a charging station using the charging session ID.
     */
    action Stop(
      ![in] : $self,
      @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '12345678' }
      @Common.FieldControl : #Mandatory
      chargingSessionId : Integer
    ) returns emobility_cpo_api_odata_OCPPStopResponse;
    /**
     * Transfers vendor-specific data to a charging station.
     * 
     * Use the following request to transfer vendor-specific data to a charging station.
     */
    action TransferData(
      ![in] : $self,
      /**
       * Data
       * 
       * Data
       */
      data : emobility_cpo_api_odata_Data
    ) returns emobility_cpo_api_odata_OCPPDataTransferResponse;
    /**
     * Assigns a charging station to another site area.
     * 
     * Use the following request to assign a charging station to another site area.
     */
    action ChangeSiteArea(
      ![in] : $self,
      @Core.Example : {
        $Type: 'Core.PrimitiveExampleValue',
        Value: 'edff4c31-aa58-4801-8c46-972a78b93d4d'
      }
      @Common.FieldControl : #Mandatory
      siteAreaId : UUID
    ) returns LargeString;
    /**
     * Assigns a charging station to roaming.
     * 
     * Use the following request to assign a charging station to roaming.
     */
    action ChangeRoamingFlag(
      ![in] : $self,
      @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'true' }
      @Common.FieldControl : #Mandatory
      roaming : Boolean
    );
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Connectors'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Connectors {
    /** The unique identifier of the connector */
    key connectorId : Integer not null;
    /** The charging system type of the connector */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'CCS' }
    type : String(10);
    /** Indicates if the connector uses alternating current or direct current. */
    currentType : String(2);
    /** The potential difference of the connector expressed in volts (V) */
    voltage : Integer;
    /** The number of phases used by the connector */
    numberOfPhases : Double;
    /** The index of the EVSE to which the connector belongs */
    evseIndex : Integer;
    /** The electric current of the connector expressed in amperes (A) */
    current : Double;
    /** The current limit for the connector expressed in amperes (A), based on the load management configuration */
    currentLimit : Double;
    /** The connector status received from the charging station */
    status : String(15);
    /** The maximum power of the connector */
    maximumPower : Double;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Coordinates'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Coordinates {
    /** The latitude of the site in decimal degrees */
    key latitude : String(10);
    /** The longitude of the site in decimal degrees */
    key longitude : String(11);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Addresses'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Addresses {
    /** The number of the building (residential or commercial) that follows or precedes the street name in the site address */
    key number : String(8);
    /** The name of the street where the site is located */
    street : String(36);
    /** The postal code, ZIP code, or post code in the site address */
    postalCode : String(10);
    /** The name of the city or town in which the site is located */
    city : String(45);
    /** The ISO 3166-1 alpha-2 country code for the Country/Region where the site is located */
    @Common.Text : name
    @Common.Label : '{i18n>CountryCode}'
    countryCode : String(3);
    /** The Country/Region where the site is located */
    @Core.Computed : true
    @Common.Label : '{i18n>Name}'
    country : String(255);
    /** The State/Region where the site is located */
    state : String(20);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'EVSE Locations'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity EvseLocations {
    /** The floor of the parking facility on which the EVSE is located */
    parkingLevel : String(32);
    /** The name of the parking facility where the EVSE is located */
    parkingName : String(32);
    /** The name or identifier of the parking spot where the EVSE is located, and where a vehicle can charge */
    parkingSpace : String(32);
    /** The unique identifier of the company to which the EVSE belongs */
    companyId : UUID;
    /** The unique identifier of the site where the EVSE is located */
    siteId : UUID;
    /** The name of the site where the EVSE is located */
    siteName : String(100);
    /** The unique identifier of the site area where the EVSE is located */
    key siteAreaId : UUID;
    /** The name of the site area where the EVSE is located */
    siteAreaName : String(100);
    /** The address of the site where the EVSE is located */
    address : Composition of one Addresses {  };
    /** The coordinates of the site where the EVSE is located */
    coordinates : Composition of one Coordinates {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'EVSEs'
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of EVSEs.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to fetch data related to your charging station EVSEs. <br>An EVSE (Electric Vehicle Supply Equipment) is the independently operated and managed part of a charging station that can deliver energy to one vehicle at a time.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves an EVSE with a specific identifier.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to fetch data related to the EVSE of a charging station by providing the EVSE ID. <br>An EVSE (Electric Vehicle Supply Equipment) is the independently operated and managed part of a charging station that can deliver energy to one vehicle at a time.'
  @Capabilities.ReadRestrictions.Readable : true
  @Capabilities.UpdateRestrictions.Description : 'Updates an EVSE.'
  @Capabilities.UpdateRestrictions.LongDescription : 'Use the following request to update an EVSE. <br>An EVSE (Electric Vehicle Supply Equipment) is the independently operated and managed part of a charging station that can deliver energy to one vehicle at a time.'
  @Capabilities.UpdateRestrictions.Updatable : true
  @Capabilities.UpdateRestrictions.UpdateMethod : #PATCH
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.DeleteRestrictions.Deletable : false
  entity Evses {
    /** The unique identifier of the EVSE */
    @Core.ComputedDefaultValue : true
    key id : UUID not null;
    /** The eMI³ ID of the EVSE */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'DE*ABC*E1a2b3c' }
    @Validation.Pattern : '(^$)|^[A-Za-z]{2}\*[0-9A-Za-z]{3}\*E[0-9A-Za-z][0-9A-Za-z\*]{0,30}$'
    emi3Id : String(39);
    /** The index of the EVSE */
    index : Integer;
    /** The unique identifier used to identify and locate the EVSE */
    code : String(32);
    /** The user-friendly name used to identify and categorize the EVSE. The name doesn't have to be unique. */
    name : String(100);
    /** The name of the parking facility where the EVSE is located */
    parking : String(32);
    /** The floor of the parking facility on which the EVSE is located */
    parkingLevel : String(32);
    /** The name or identifier of the parking spot where the EVSE is located, and where a vehicle can charge */
    parkingSpace : String(32);
    /** The unique identifier of the charging station to which the EVSE belongs */
    chargingStationId : UUID;
    /** The name of the charging station to which the EVSE belongs */
    chargingStationName : String(50);
    /** The connectors belonging to the EVSE, and their technical information */
    connectors : Composition of many Connectors {  };
    /** Information related to where the EVSE is located */
    location : Composition of one EvseLocations {  };
    /** The charging station to which the EVSE belongs, and its technical information */
    chargingStation : Association to one ChargingStations {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Schedule'
  entity ChargingSchedule {
    /** The duration of the charging plan in seconds, meaning the sum of all its period durations */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 1500 }
    @Common.FieldControl : #Mandatory
    totalDuration : Double;
    /**
     * The start time of the charging plan
     * 
     * The start time of the charging plan
     */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    @Core.Example : {
      $Type: 'Core.PrimitiveExampleValue',
      Value: '2022-04-29T22:00:00.000Z'
    }
    @Common.FieldControl : #Mandatory
    key startTime : Timestamp;
    /**
     * The list of periods within the charging plan schedule
     * 
     * The list of periods within the charging plan schedule
     */
    @Core.Example : {
      $Type: 'Core.PrimitiveExampleValue',
      Value: '[{"startPeriod":0,"limit":96, "numberPhases":3},{"startPeriod":3600,"limit":150, "numberPhases":3}]'
    }
    @Common.FieldControl : #Mandatory
    periods : many ChargingSchedule_periods;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Profile'
  entity Profile {
    /**
     * Indicates how often a charging plan repeats itself. The possible values are None, Daily, Weekly.
     * 
     * Indicates how often a charging plan repeats itself. The possible values are None, Daily, Weekly.
     */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'Daily' }
    @Common.FieldControl : #Mandatory
    recurrencePattern : String(10);
    /**
     * The unique identifier of the charging session
     * 
     * The unique identifier of the charging session
     */
    @Core.Computed : true
    key chargingSessionId : Integer;
    /**
     * The date and time the charging plan was started and its duration
     * 
     * The date and time the charging plan was started and its duration
     */
    schedule : Association to one ChargingSchedule {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Charging Plans'
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of charging plans.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to fetch data related to your charging plans.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a charging plan with a specific identifier.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to fetch data related to a charging plan by providing its ID.'
  @Capabilities.InsertRestrictions.Description : 'Creates a charging plan.'
  @Capabilities.InsertRestrictions.LongDescription : 'Use the following request to create a charging plan.'
  @Capabilities.UpdateRestrictions.Description : 'Updates a charging plan.'
  @Capabilities.UpdateRestrictions.LongDescription : 'Use the following request to update a charging plan.'
  @Capabilities.DeleteRestrictions.Description : 'Deletes a charging plan.'
  @Capabilities.DeleteRestrictions.LongDescription : 'Use the following request to delete a charging plan by providing its ID.'
  @Capabilities.NavigationRestrictions.Navigability : #None
  entity ChargingPlans {
    /** The unique identifier of the charging plan */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '5bc92bcc' }
    key id : LargeString not null;
    /** The index of the EVSE */
    @Core.Computed : true
    evseIndex : Integer;
    /** The unique identifier of the connector */
    @Core.Computed : true
    connectorId : Integer;
    /** The unique identifier of the charging station */
    @Common.FieldControl : #Mandatory
    chargingStationId : UUID;
    /** Provides the charging session for which the charging plan was used, and the recurrence and schedule details. */
    profile : Association to one Profile {  };
  };

  @cds.external : true
  type ChargingStations_ocppStandardParameters {
    ![key] : LargeString;
    value : LargeString;
  };

  @cds.external : true
  type ChargingStations_ocppVendorParameters {
    ![key] : LargeString;
    value : LargeString;
  };

  /**
   * OCPP Reset Response
   * 
   * OCPP Reset Response
   */
  @cds.external : true
  type emobility_cpo_api_odata_OCPPResetResponse {
    /** The custom code of the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1900' }
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'ACCEPTED',
        Value: 1900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'REJECTED',
        Value: 1910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'CHARGING_STATION_NOT_CONNECTED',
        Value: 2900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'OCPP_SERVER_ERROR',
        Value: 3000
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'TIMEOUT',
        Value: 3900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UNKNOWN_TOKEN',
        Value: 2004
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'NOT_AUTHORIZED_TOKEN',
        Value: 2910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'EXPIRED_TOKEN',
        Value: 2911
      }
    ]
    responseCode : Integer;
    /** Information about the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'Accepted' }
    responseMessage : LargeString;
    /** The time stamp when the OCPP command response was sent */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /**
     * OCPP Response Data
     * 
     * The payload of the OCPP command response
     */
    responseData : emobility_cpo_api_odata_ResponseData;
  };

  /**
   * OCPP Response Data
   * 
   * OCPP Response Data
   */
  @cds.external : true
  type emobility_cpo_api_odata_ResponseData {
    /** The status of the OCPP response */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Accepted',
        Value: 'Accepted'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Rejected',
        Value: 'Rejected'
      }
    ]
    status : LargeString;
  };

  /**
   * OCPP Start Response
   * 
   * OCPP Start Response
   */
  @cds.external : true
  type emobility_cpo_api_odata_OCPPStartResponse {
    /** The custom code of the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1900' }
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'ACCEPTED',
        Value: 1900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'REJECTED',
        Value: 1910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'CHARGING_STATION_NOT_CONNECTED',
        Value: 2900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'OCPP_SERVER_ERROR',
        Value: 3000
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'TIMEOUT',
        Value: 3900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UNKNOWN_TOKEN',
        Value: 2004
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'NOT_AUTHORIZED_TOKEN',
        Value: 2910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'EXPIRED_TOKEN',
        Value: 2911
      }
    ]
    responseCode : Integer;
    /** Information about the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'Accepted' }
    responseMessage : LargeString;
    /** The time stamp when the OCPP command response was sent */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /**
     * OCPP Response Data
     * 
     * The payload of the OCPP command response
     */
    responseData : emobility_cpo_api_odata_ResponseData;
  };

  /**
   * OCPP Stop Response
   * 
   * OCPP Stop Response
   */
  @cds.external : true
  type emobility_cpo_api_odata_OCPPStopResponse {
    /** The custom code of the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1900' }
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'ACCEPTED',
        Value: 1900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'REJECTED',
        Value: 1910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'CHARGING_STATION_NOT_CONNECTED',
        Value: 2900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'OCPP_SERVER_ERROR',
        Value: 3000
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'TIMEOUT',
        Value: 3900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UNKNOWN_TOKEN',
        Value: 2004
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'NOT_AUTHORIZED_TOKEN',
        Value: 2910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'EXPIRED_TOKEN',
        Value: 2911
      }
    ]
    responseCode : Integer;
    /** Information about the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'Accepted' }
    responseMessage : LargeString;
    /** The time stamp when the OCPP command response was sent */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /**
     * OCPP Response Data
     * 
     * The payload of the OCPP command response
     */
    responseData : emobility_cpo_api_odata_ResponseData;
  };

  /**
   * OCPP Transfer Data Response
   * 
   * OCPP Transfer Data Response
   */
  @cds.external : true
  type emobility_cpo_api_odata_OCPPDataTransferResponse {
    /** The custom code of the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: '1900' }
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'ACCEPTED',
        Value: 1900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'REJECTED',
        Value: 1910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'CHARGING_STATION_NOT_CONNECTED',
        Value: 2900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'OCPP_SERVER_ERROR',
        Value: 3000
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'TIMEOUT',
        Value: 3900
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UNKNOWN_TOKEN',
        Value: 2004
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'NOT_AUTHORIZED_TOKEN',
        Value: 2910
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'EXPIRED_TOKEN',
        Value: 2911
      }
    ]
    responseCode : Integer;
    /** Information about the OCPP command response */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'Accepted' }
    responseMessage : LargeString;
    /** The time stamp when the OCPP command response was sent */
    @odata.Precision : 7
    @odata.Type : 'Edm.DateTimeOffset'
    timestamp : Timestamp;
    /**
     * OCPP Data Transfer Response Data
     * 
     * The payload of the OCPP command response
     */
    responseData : emobility_cpo_api_odata_TransferResponseData;
  };

  /**
   * OCPP Data Transfer Response Data
   * 
   * OCPP Data Transfer Response Data
   */
  @cds.external : true
  type emobility_cpo_api_odata_TransferResponseData {
    /** The status of the OCPP response */
    @Validation.AllowedValues : [
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Accepted',
        Value: 'Accepted'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'Rejected',
        Value: 'Rejected'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UnknownMessageId',
        Value: 'UnknownMessageId'
      },
      {
        $Type: 'Validation.AllowedValue',
        @Core.SymbolicName: 'UnknownVendorId',
        Value: 'UnknownVendorId'
      }
    ]
    status : LargeString;
    /** The data of the OCPP response */
    data : LargeString;
  };

  /**
   * Data
   * 
   * Data
   */
  @cds.external : true
  type emobility_cpo_api_odata_Data {
    /** The unique identifier of the charging station vendor */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'org.example.csms' }
    vendorId : String(255) not null;
    /** The technical identifier of the message parameter, as defined by the charging station vendor */
    @Core.Example : { $Type: 'Core.PrimitiveExampleValue', Value: 'unavailable_period' }
    messageId : String(50);
    /** The values provided for the data transfer */
    @Core.Example : {
      $Type: 'Core.PrimitiveExampleValue',
      Value: '{\"start\": \"11:00\",\"stop\": \"13:30\"}'
    }
    data : LargeString;
  };

  @cds.external : true
  type ChargingSchedule_periods {
    startPeriod : Double;
    limit : Double;
    numberPhases : Integer;
  };
};

