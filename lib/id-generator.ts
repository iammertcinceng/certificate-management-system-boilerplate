export type { IdPrefix } from '@/utils/id';
export {
  // Robust server-side
  generateUniqueId,
  generateTrainingId,
  generateCertificateId,
  generateStudentId,
  generateInstitutionId,
  generateReferencePartnerId,
  // Client-side helpers and simple server helper
  generateId,
  isValidId,
  generatePublicId,
} from '@/utils/id';
