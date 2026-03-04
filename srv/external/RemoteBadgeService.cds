// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

/* checksum : 634f822c2fdbe8ec7a174f1a5f704c8f */
/**
 * Manage your badges
 * 
 * Create, retrieve, and update your badges.
 */
@cds.external : true
@Common.Label : 'Badge'
@Authorization.Authorizations : [
  {
    $Type: 'Authorization.OAuth2ClientCredentials',
    TokenUrl: 'https://{identityzone}.authentication.{region}.hana.ondemand.com/oauth/token',
    Name: 'oAuth2',
    Description: 'Authentication via OAuth2 with client credentials flow',
    Scopes: [
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'SAP_EMSP_API_Badge_Read',
        Description: 'Retrieves badges and vehicle types.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'SAP_EMSP_API_Badge_Write',
        Description: 'Creates and updates badges excluding their companyId.'
      },
      {
        $Type: 'Authorization.AuthorizationScope',
        Scope: 'SAP_EMSP_API_Badge_Manage',
        Description: 'Creates, retrieves, and updates badges including their companyId.'
      }
    ]
  }
]
@Capabilities.BatchSupported : true
service RemoteBadgeService {
  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Badges'
  @Communication.Contact : {
    $Type: 'Communication.ContactType',
    n: {
      $Type: 'Communication.NameType',
      surname: user_surname,
      given: user_name
    }
  }
  @Capabilities.ReadRestrictions.Readable : true
  @Capabilities.ReadRestrictions.Description : 'Retrieves a list of badges.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to retrieve a list of badges.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Readable : true
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to retrieve a badge.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a badge.'
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.InsertRestrictions.Insertable : true
  @Capabilities.InsertRestrictions.Description : 'Creates a badge.'
  @Capabilities.InsertRestrictions.LongDescription : 'Use the following request to create a badge.'
  @Capabilities.InsertRestrictions.RequiredProperties : [ 'companyId' ]
  @Capabilities.UpdateRestrictions.Updatable : true
  @Capabilities.UpdateRestrictions.Description : 'Updates a badge.'
  @Capabilities.UpdateRestrictions.LongDescription : 'Use the following request to update information related to a badge.'
  @Capabilities.UpdateRestrictions.NonUpdatableProperties : [ 'companyId' ]
  entity Badges {
    /** The unique identifier used to authenticate a badge. Even if the maxLength indicated is 36 characters, the authenticationId has been restricted to 20 characters for the creation of new badges to comply with the OCPP 1.6 protocol. Only uppercase characters are supported, lowercase characters will be converted to uppercase for a new badge. */
    @Common.FieldControl : #Mandatory
    key authenticationId : String(36) not null;
    /** The badge's visual identifier */
    @Common.FieldControl : #Mandatory
    visualBadgeId : String(64) not null;
    /** Additional user identifier */
    userId : String(24);
    /** The first name of the user to whom the badge belongs */
    firstName : String(100);
    /** The last name of the user to whom the badge belongs */
    lastName : String(100);
    /** The email address of the user to whom the badge belongs */
    @Validation.Pattern : '[a-z0-9]+@[a-z]+\.[a-z]{2,3}'
    @Core.Example : { $Type: 'Core.ExampleValue', Description: 'bob@sap.com' }
    @Communication.IsEmailAddress : true
    email : String(100);
    /** The unique identifier of the vehicle assigned to the badge */
    vehicleId : String(64);
    /** The date on which the badge's validity starts */
    validFrom : Date;
    /** The date on which the badge's validity ends */
    validTo : Date;
    /** The type of vehicle assigned to the badge. Possible vehicle types are Battery-Powered Electric Vehicle (BEV) and Plug-In Hybrid Electric Vehicle (PHEV). */
    @Validation.AllowedValues : [
      { $Type: 'Validation.AllowedValue', Value: 'BEV' },
      { $Type: 'Validation.AllowedValue', Value: 'PHEV' }
    ]
    @Common.Text : ![to_ElectricVehicleTypes/electric_vehicle_type_description]
    @Common.Text.@UI.TextArrangement : #TextOnly
    @Common.ValueListWithFixedValues : true
    @PersonalData.IsPotentiallyPersonal : true
    vehicleType : String(20);
    /** The license plate of the vehicle assigned to the badge */
    licensePlate : String(100);
    /** Contains additional information. */
    description : String(100);
    /** Determines if a badge is active. To start a charging session, the badge must be active and valid. */
    active : Boolean not null default false;
    /** Contains additional information to categorize badges. */
    tags : String(1000);
    /** Identifies the company to which the badge is assigned. */
    @Core.Immutable : true
    @Common.Text : ![to_Companies/companyName]
    @Common.Text.@UI.TextArrangement : #TextOnly
    @Common.FieldControl : #Mandatory
    companyId : UUID;
  } actions {
    /**
     * Updates the companyId of a badge.
     * 
     * Use the following request to update the companyId of a badge.
     */
    @Core.OperationAvailable : true
    action UpdateCompany(
      ![in] : $self,
      companyId : LargeString
    ) returns Badges;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @Common.Label : 'Vehicle Types'
  @Capabilities.ReadRestrictions.Readable : false
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Readable : true
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.Description : 'Retrieves a vehicle type.'
  @Capabilities.ReadRestrictions.ReadByKeyRestrictions.LongDescription : 'Use the following request to retrieve a vehicle type.'
  @Capabilities.ReadRestrictions.Description : 'Retrieves information for vehicle types.'
  @Capabilities.ReadRestrictions.LongDescription : 'Use the following request to retrieve information related to your vehicle types.'
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  entity VehicleTypes {
    /** The acronym for the type of vehicle assigned to the badge. Possible acronyms are BEV (Battery-Powered Electric Vehicle) and PHEV (Plug-In Hybrid Electric Vehicle). */
    @Validation.AllowedValues : [
      { $Type: 'Validation.AllowedValue', Value: 'BEV' },
      { $Type: 'Validation.AllowedValue', Value: 'PHEV' }
    ]
    @Common.Text : electric_vehicle_type_description
    @Common.Text.@UI.TextArrangement : #TextOnly
    key vehicleTypeAcronym : String(20) not null;
    /** Specifies the language code. */
    @Validation.AllowedValues : [
      { $Type: 'Validation.AllowedValue', Value: 'en' },
      { $Type: 'Validation.AllowedValue', Value: 'de' },
      { $Type: 'Validation.AllowedValue', Value: 'es' },
      { $Type: 'Validation.AllowedValue', Value: 'fr' },
      { $Type: 'Validation.AllowedValue', Value: 'it' },
      { $Type: 'Validation.AllowedValue', Value: 'ja' },
      { $Type: 'Validation.AllowedValue', Value: 'pt' },
      { $Type: 'Validation.AllowedValue', Value: 'pt_PT' },
      { $Type: 'Validation.AllowedValue', Value: 'zh_CN' }
    ]
    @Common.Label : '{i18n>LanguageCode}'
    key locale : String(14) not null;
    /** The type of vehicle assigned to the badge. Possible vehicle types are Battery-Powered Electric Vehicle (BEV) and Plug-In Hybrid Electric Vehicle (PHEV). */
    vehicleType : String(200);
  };
};

