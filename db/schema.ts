import { pgEnum, pgTable, text, uuid, timestamp, boolean, jsonb, date, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";

// Roles enum: 'admin' | 'institution' | 'acreditor'
export const userRole = pgEnum('user_role', ['admin', 'institution', 'acreditor']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  publicId: text('public_id').notNull().unique(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  isPartner: boolean('is_partner').notNull().default(false),
  taxNumber: text('tax_number'),
  taxOffice: text('tax_office'),
  infoEmail: text('info_email'),
  phone: text('phone'),
  website: text('website'),
  address: text('address'),
  about: text('about'),
  mission: text('mission'),
  vision: text('vision'),
  socialLinkedin: text('social_linkedin'),
  socialTwitter: text('social_twitter'),
  socialFacebook: text('social_facebook'),
  socialInstagram: text('social_instagram'),
  logo: text('logo'), // Base64 encoded string
  signature: text('signature'), // Base64 encoded PNG (transparent background required)
  signatureName: text('signature_name'), // Name to display under signature (e.g., "Jeffrey T. Sooey")
  signatureTitle: text('signature_title'), // Title to display under name (e.g., "Master Coach University")
  // Branding per institution (only meaningful for institution role)
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  defaultTemplate: text('default_template'),
  advantages: jsonb('advantages').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Last name display mode enum: which surname(s) to show on certificates and UI
// 'primary' = only lastName, 'secondary' = only otherLastName, 'both' = lastName + otherLastName
export const lastNameDisplayEnum = pgEnum('last_name_display', ['primary', 'secondary', 'both']);

// Students table
export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicId: text('public_id').notNull(), // Unique per institution, not globally
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nationalId: text('national_id').notNull(), //unique olmalı
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  otherLastName: text('other_last_name'), // Secondary surname (e.g., maiden name or married name)
  lastNameDisplay: lastNameDisplayEnum('last_name_display').notNull().default('primary'), // Which surname(s) to display
  birthDate: date('birth_date').notNull(),
  verifyBaseKey: text('verify_base_key'),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // publicId is unique per institution, not globally
  uniquePublicIdPerInstitution: uniqueIndex('students_institution_public_id_idx').on(table.institutionUserId, table.publicId),
}));

// Trainings/Educations table
export const trainingStatus = pgEnum('training_status', ['pending', 'approved', 'rejected']);

// Training level and language enums
export const trainingLevel = pgEnum('training_level', ['level_a', 'level_b', 'level_c', 'level_d']);
export const trainingLanguage = pgEnum('training_language', ['tr', 'en', 'de', 'fr']);
export const trainingModeEnum = pgEnum('training_mode', ['hybrid', 'online', 'onsite']);
export const trainingCountryEnum = pgEnum('training_country', ['tr', 'us', 'de', 'gb', 'fr']);

export const trainings = pgTable('trainings', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicId: text('public_id').notNull(), // Unique per institution, not globally
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  // New fields per requirements
  level: trainingLevel('level').notNull(),
  language: trainingLanguage('language').notNull(),
  totalHours: integer('total_hours').notNull(),
  // Added optional fields
  languages: jsonb('languages').$type<string[] | null>(),
  mode: trainingModeEnum('mode'),
  country: trainingCountryEnum('country'),

  status: trainingStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // publicId is unique per institution, not globally
  uniquePublicIdPerInstitution: uniqueIndex('trainings_institution_public_id_idx').on(table.institutionUserId, table.publicId),
}));

// Collaborations table (Kurum-Partner ilişkileri)
// Partner: isPartner=true olan organizations VEYA role=acreditor olan users
export const collaborationStatus = pgEnum('collaboration_status', ['pending', 'approved', 'rejected']);

export const collaborations = pgTable('collaborations', {
  id: uuid('id').defaultRandom().primaryKey(),
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  partnerUserId: uuid('partner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sinceDate: date('since_date'),
  status: collaborationStatus('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Certificates table
export const certificateStatus = pgEnum('certificate_status', ['pending', 'approved', 'rejected', 'archived']);

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicId: text('public_id').notNull(), // Unique per institution, not globally
  trainingId: uuid('training_id').notNull().references(() => trainings.id, { onDelete: 'cascade' }),
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dateIssued: date('date_issued').notNull(), // Legacy field, kept for compatibility
  // Certificate date range - startDate optional, endDate required (defaults to dateIssued if not set)
  startDate: date('start_date'), // Certificate start date (optional)
  endDate: date('end_date'), // Certificate end date (if null, use dateIssued)
  status: certificateStatus('status').notNull().default('pending'),

  // Onay mekanizmaları
  institutionApproved: boolean('institution_approved').notNull().default(false),
  partnerApproved: boolean('partner_approved').notNull().default(false),
  adminApproved: boolean('admin_approved').notNull().default(true),

  // UIA (Upper Institution Approval) - Üst Kurum Onayı
  uiaRequired: boolean('uia_required').notNull().default(false),
  uiaResponsibleId: uuid('uia_responsible_id').references(() => users.id),

  // Performans ve tema
  studentCount: text('student_count'),
  templateKey: text('template_key').notNull().default('classic'),
  colorPrimary: text('color_primary'),
  colorSecondary: text('color_secondary'),
  // Snapshot of external partners included in this certificate (public partners without user accounts)
  externalPartners: jsonb('external_partners').$type<Array<{ publicId: string; name: string; logo?: string | null }>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // publicId is unique per institution, not globally
  uniquePublicIdPerInstitution: uniqueIndex('certificates_institution_public_id_idx').on(table.institutionUserId, table.publicId),
}));

// Certificate-Student junction table (many-to-many)
export const certificateStudents = pgTable('certificate_students', {
  id: uuid('id').defaultRandom().primaryKey(),
  certificateId: uuid('certificate_id').notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sequenceNo: integer('sequence_no'),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});

// Certificate-Partner junction table (many-to-many)
export const certificatePartners = pgTable('certificate_partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  certificateId: uuid('certificate_id').notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  partnerUserId: uuid('partner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});

// UIA (Upper Institution Approval) Codes per certificate-student pair
// Partner tarafından her öğrenci için girilir
export const approvalCodes = pgTable('approval_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  certificateId: uuid('certificate_id').notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  approvalCode: text('approval_code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Balances table (Kurum kredi bakiyesi - sadece sertifika oluşturma için)
export const balances = pgTable('balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  institutionUserId: uuid('institution_user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 18, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// External Partners (hesapsız partnerler, sadece isim+logo)
export const externalPartners = pgTable('external_partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicId: text('public_id').notNull().unique(),
  name: text('name').notNull(),
  logo: text('logo'), // Base64 encoded string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Institution-Partner relationships (kurumların partnerleri ile ilişkisi - admin onayı gerekir)
export const partnershipStatus = pgEnum('partnership_status', ['pending', 'approved', 'rejected']);

// Accreditation duration options for special partners (RFR-000001, RFR-000002)
export const accreditationDuration = pgEnum('accreditation_duration', ['6_months', '1_year', '2_years']);

export const institutionPartners = pgTable('institution_partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  externalPartnerId: uuid('external_partner_id').notNull().references(() => externalPartners.id, { onDelete: 'cascade' }),
  status: partnershipStatus('status').default('pending').notNull(),
  // Accreditation fields (for special partners like RFR-000001, RFR-000002)
  accreditationStartDate: date('accreditation_start_date'),
  accreditationEndDate: date('accreditation_end_date'),
  accreditationDuration: accreditationDuration('accreditation_duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Balance Transactions (işlem geçmişi)
export const transactionType = pgEnum('transaction_type', ['credit', 'debit', 'refund']);

// Stripe payment status enum
export const stripePaymentStatus = pgEnum('stripe_payment_status', ['pending', 'succeeded', 'failed', 'cancelled']);

export const balanceTransactions = pgTable('balance_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  institutionUserId: uuid('institution_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: transactionType('type').notNull(), // credit (yükleme), debit (harcama), refund (iade)
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  description: text('description').notNull(), // deprecated - use metadata for i18n
  relatedCertificateId: uuid('related_certificate_id'), // opsiyonel, sertifika ile ilişkili ise
  // Stripe payment tracking fields
  stripePaymentIntentId: text('stripe_payment_intent_id'), // pi_xxx format
  stripeStatus: stripePaymentStatus('stripe_status').default('pending'), // Payment status from Stripe
  // i18n raw data - frontend will format based on locale
  metadata: jsonb('metadata').$type<{
    key: string; // translation key, e.g. 'admin_balance_loaded'
    params?: Record<string, string | number>; // e.g. { amount: 50, by: 'Admin' }
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Credit packages for purchase (admin managed)
export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  credits: integer('credits').notNull(), // e.g. 10, 25, 50, 100, 250, 500, 1000, 3000
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(), // e.g. 6, 17, 31, 52, 120, 200, 350, 600
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Site-wide settings (admin managed, single row)
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Branding
  siteName: text('site_name').notNull().default('Mert CIN Certificates'),
  siteUrl: text('site_url'),
  // SEO
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'), // comma-separated
  // Emails
  supportEmail: text('support_email'),
  noReplyEmail: text('no_reply_email'),
  // Credit system
  creditThreshold: integer('credit_threshold').notNull().default(10), // Warning threshold for low credits
  creditPerStudent: integer('credit_per_student').notNull().default(1), // Credits charged per student in a certificate
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Email logs
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: text('template_id').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  recipientUserId: uuid('recipient_user_id').references(() => users.id, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  status: text('status').notNull(), // 'sent', 'failed', 'pending'
  metadata: jsonb('metadata'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Accreditation reminder tracking
export const accreditationRemindersSent = pgTable('accreditation_reminders_sent', {
  id: uuid('id').defaultRandom().primaryKey(),
  partnershipId: uuid('partnership_id').notNull(), // Note: References can be complex if polymorphic, keeping simple ID for now
  reminderDay: integer('reminder_day').notNull(), // -60, -30, +30, etc.
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});
