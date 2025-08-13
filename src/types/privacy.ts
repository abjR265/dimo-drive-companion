export interface PrivacySettings {
  includeOwnerInfo: boolean;
  includeFinancialInfo: boolean;
  includePersonalDetails: boolean;
  includeServiceDetails: boolean;
  includeDocumentMetadata: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  includeOwnerInfo: false,
  includeFinancialInfo: false,
  includePersonalDetails: false,
  includeServiceDetails: true,
  includeDocumentMetadata: true
};
