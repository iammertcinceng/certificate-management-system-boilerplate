/**
 * Helper utilities for student name display
 * Handles the display logic for primary/secondary/both surname modes
 */

export type LastNameDisplay = 'primary' | 'secondary' | 'both';

export interface StudentNameFields {
    firstName: string;
    lastName: string;
    otherLastName?: string | null;
    lastNameDisplay?: LastNameDisplay | null;
}

/**
 * Returns the display name for a student based on their lastNameDisplay setting
 * 
 * @param student - Student object with name fields
 * @returns Formatted display name string
 * 
 * Examples:
 * - primary: "Ayşe YILMAZ"
 * - secondary: "Ayşe KAYA" (falls back to lastName if otherLastName is null)
 * - both: "Ayşe YILMAZ KAYA"
 */
export function getStudentDisplayName(student: StudentNameFields): string {
    const { firstName, lastName, otherLastName, lastNameDisplay = 'primary' } = student;

    let displayLastName = '';

    switch (lastNameDisplay) {
        case 'primary':
            displayLastName = lastName;
            break;
        case 'secondary':
            // Fallback to lastName if otherLastName is not set
            displayLastName = otherLastName || lastName;
            break;
        case 'both':
            // Show both surnames if otherLastName exists
            displayLastName = otherLastName ? `${lastName} ${otherLastName}` : lastName;
            break;
        default:
            displayLastName = lastName;
    }

    return `${firstName} ${displayLastName}`.trim();
}

/**
 * Returns only the display surname(s) based on lastNameDisplay setting
 * Useful when you need just the surname portion
 * 
 * @param student - Student object with name fields
 * @returns Formatted surname string
 */
export function getStudentDisplayLastName(student: StudentNameFields): string {
    const { lastName, otherLastName, lastNameDisplay = 'primary' } = student;

    switch (lastNameDisplay) {
        case 'primary':
            return lastName;
        case 'secondary':
            return otherLastName || lastName;
        case 'both':
            return otherLastName ? `${lastName} ${otherLastName}` : lastName;
        default:
            return lastName;
    }
}

/**
 * Check if student has an alternative surname set
 * Useful for showing indicators in UI
 * 
 * @param student - Student object
 * @returns true if otherLastName is set and non-empty
 */
export function hasAlternativeSurname(student: StudentNameFields): boolean {
    return !!(student.otherLastName && student.otherLastName.trim().length > 0);
}

/**
 * Get search-friendly name string that includes all possible surnames
 * Used for filtering/searching - always searches in both surnames
 * 
 * @param student - Student object with name fields
 * @returns String containing firstName, lastName, and otherLastName (if set)
 */
export function getStudentSearchableText(student: StudentNameFields): string {
    const parts = [
        student.firstName,
        student.lastName,
        student.otherLastName
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
}
