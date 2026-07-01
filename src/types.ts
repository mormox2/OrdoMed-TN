/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType = 'pct' | 'dpm' | 'manual' | 'imported';
export type MedicineStatus = 'active' | 'suspended' | 'removed' | 'unknown';
export type PatientGroup = 'adult' | 'child' | 'pregnant' | 'elderly' | 'renal_impairment' | 'hepatic_impairment';
export type ValidationStatus = 'draft' | 'validated' | 'deprecated';
export type PrescriptionStatus = 'draft' | 'signed' | 'cancelled';
export type LanguageMode = 'fr' | 'ar' | 'bilingual';

export interface Medicine {
  id: string;
  source_type: SourceType;
  source_url?: string;
  source_updated_at?: string;
  pct_code?: string;
  amm_number?: string;
  amm_date?: string;
  name_brand: string;
  name_normalized: string;
  dci_name: string;
  dci_normalized: string;
  dosage_strength: string;
  pharmaceutical_form: string;
  route?: string;
  package_label?: string;
  supplier?: string;
  laboratory?: string;
  therapeutic_class?: string;
  status: MedicineStatus;
  is_available?: boolean;
  tableau?: string | null; // DPM: A = Liste I, B = stupéfiant, C = Liste II, O = hors tableaux
  requires_special_prescription?: boolean; // Ordonnance contrôlée spéciale (Tableau B)
  created_at: string;
  updated_at: string;
}

export interface MedicineAlias {
  id: string;
  medicine_id: string;
  alias: string;
  alias_normalized: string;
  language: 'fr' | 'ar' | 'en' | 'other';
  created_at: string;
}

export interface MedicineSource {
  id: string;
  medicine_id: string;
  source_name: string;
  source_url?: string;
  imported_at: string;
  checksum: string;
  raw_payload_json?: string;
}

export interface DosageTemplate {
  id: string;
  medicine_id?: string;
  dci_name?: string;
  indication: string;
  patient_group: PatientGroup;
  min_age?: number;
  max_age?: number;
  min_weight?: number;
  max_weight?: number;
  dose_text_fr: string;
  dose_text_ar: string;
  frequency_text_fr: string;
  frequency_text_ar: string;
  duration_text_fr: string;
  duration_text_ar: string;
  max_daily_dose?: string;
  warnings_fr?: string;
  warnings_ar?: string;
  contraindication_flags?: {
    pregnancy_alert?: boolean;
    renal_alert?: boolean;
    hepatic_alert?: boolean;
    breastfeeding_alert?: boolean;
  };
  requires_weight?: boolean;
  requires_diagnosis?: boolean;
  version?: number;
  clinical_review_status?: 'draft' | 'reviewed' | 'approved';
  clinical_rules?: TemplateClinicalRules;
  validation_status: ValidationStatus;
  validated_by?: string;
  validated_at?: string;
  source_reference?: string;
  created_at: string;
  updated_at: string;
}

export type ClinicalRuleAction = 'allowed' | 'caution' | 'adjust' | 'blocked' | 'specialist';
export type ClinicalIssueSeverity = 'caution' | 'blocked' | 'missing_data';
export type ClinicalEvaluationStatus = 'compatible' | ClinicalIssueSeverity;

export interface ClinicalRule {
  action: ClinicalRuleAction;
  message_fr: string;
  message_ar?: string;
  dose_override_fr?: string;
  dose_override_ar?: string;
}

export interface TemplateClinicalRules {
  age?: ClinicalRule & { min?: number; max?: number };
  weight?: ClinicalRule & { required?: boolean; min?: number; max?: number };
  pregnancy?: ClinicalRule;
  breastfeeding?: ClinicalRule;
  renal?: Array<ClinicalRule & { egfr_below?: number; egfr_at_or_above?: number }>;
  hepatic?: Array<ClinicalRule & { severity?: HepaticStatus | 'any_impairment' }>;
}

export interface ClinicalIssue {
  code: string;
  severity: ClinicalIssueSeverity;
  message_fr: string;
  message_ar?: string;
  suggested_adjustment_fr?: string;
  suggested_adjustment_ar?: string;
}

export interface ClinicalEvaluation {
  status: ClinicalEvaluationStatus;
  evaluated_at: string;
  template_id: string;
  template_version: number;
  issues: ClinicalIssue[];
}

export type RenalStatus = 'unknown' | 'normal' | 'mild' | 'moderate' | 'severe' | 'dialysis';
export type HepaticStatus = 'unknown' | 'normal' | 'mild' | 'moderate' | 'severe';
export type PregnancyStatus = 'unknown' | 'not_pregnant' | 'pregnant';

export interface CurrentMedication {
  id: string;
  medicine_label: string; // Brand/Label name
  dci_name?: string;      // DCI (active ingredient)
}

export interface VitalRecord {
  id: string;
  date: string;
  weight?: number; // in kg
  blood_pressure?: string; // e.g. "120/80"
  heart_rate?: number; // bpm
  notes?: string;
}

export interface Patient {
  id: string;
  name_first: string;
  name_last: string;
  birth_date: string;
  gender: 'M' | 'F';
  weight?: number; // Crucial for pediatrics
  allergies: string[]; // List of allergens or DCIs the patient is allergic to
  is_pregnant?: boolean;
  has_renal_impairment?: boolean;
  has_hepatic_impairment?: boolean;
  renal_status?: RenalStatus;
  egfr?: number;
  creatinine?: number;
  hepatic_status?: HepaticStatus;
  child_pugh?: 'A' | 'B' | 'C';
  pregnancy_status?: PregnancyStatus;
  gestational_age_weeks?: number;
  is_breastfeeding?: boolean;
  phone?: string;
  current_medications?: CurrentMedication[];
  vitals_history?: VitalRecord[];
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  prescription_number: string;
  prescription_date: string;
  notes_private?: string;
  print_language_mode: LanguageMode;
  status: PrescriptionStatus;
  created_at: string;
  updated_at: string;
  signed_at?: string;

  // Embedded denormalized patient data for historical freeze
  patient_name: string;
  patient_age_str: string;
  patient_gender: 'M' | 'F';
  patient_weight?: number;
  patient_allergies: string[];
  is_cnam_apci?: boolean;
  clinical_validation?: {
    status: ClinicalEvaluationStatus;
    evaluated_at: string;
    issues_count: number;
    override_reason?: string;
  };
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id?: string;
  custom_medicine_name?: string;
  line_order: number;
  medicine_label: string; // Dynamic label showing name, dosage, form, etc.
  dci_name?: string; // Cache the DCI name for warnings
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions_fr?: string;
  instructions_ar?: string;
  is_suggestion_used: boolean;
  doctor_modified_suggestion: boolean;
  template_id?: string;
  template_version?: number;
  clinical_evaluation?: ClinicalEvaluation;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json?: string;
  after_json?: string;
  ip_address?: string;
  created_at: string;
}

export interface DoctorConfig {
  name_fr: string;
  name_ar: string;
  specialty_fr: string;
  specialty_ar: string;
  order_number: string;
  address_fr: string;
  address_ar: string;
  phone: string;
  email?: string;
  matricule_fiscal?: string;
  code_cnam?: string;
  hours_fr?: string;
  hours_ar?: string;
  footer_fr?: string;
  footer_ar?: string;
  stamp_text?: string;
  logo_url?: string;
  show_automatic_stamp?: boolean;
  website?: string;
}
