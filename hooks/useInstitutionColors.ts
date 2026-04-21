import { useState, useEffect } from 'react';

interface InstitutionColors {
  primaryColor: string;
  secondaryColor: string;
  loading: boolean;
}

const DEFAULT_PRIMARY = '#1e40af';
const DEFAULT_SECONDARY = '#7c3aed';

/**
 * Hook to fetch institution colors from settings
 * Falls back to default colors if not set
 */
export const useInstitutionColors = (): InstitutionColors => {
  const [colors, setColors] = useState<InstitutionColors>({
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY,
    loading: true,
  });

  useEffect(() => {
    const fetchColors = async () => {
      try {
        // 1) Try API (authoritative)
        const res = await fetch('/api/organization');
        if (res.ok) {
          const data = await res.json();
          const org = data.organization || {};
          if (org.primaryColor && org.secondaryColor) {
            setColors({
              primaryColor: org.primaryColor,
              secondaryColor: org.secondaryColor,
              loading: false,
            });
            return;
          }
        }

        // 2) Fallback to LocalStorage if present
        const storedPrimary = typeof window !== 'undefined' ? localStorage.getItem('institution_primary_color') : null;
        const storedSecondary = typeof window !== 'undefined' ? localStorage.getItem('institution_secondary_color') : null;
        if (storedPrimary && storedSecondary) {
          setColors({ primaryColor: storedPrimary, secondaryColor: storedSecondary, loading: false });
          return;
        }

        // 3) Defaults
        setColors({ primaryColor: DEFAULT_PRIMARY, secondaryColor: DEFAULT_SECONDARY, loading: false });
      } catch (error) {
        console.error('Error fetching institution colors:', error);
        setColors({ primaryColor: DEFAULT_PRIMARY, secondaryColor: DEFAULT_SECONDARY, loading: false });
      }
    };

    fetchColors();
  }, []);

  return colors;
};

/**
 * Get colors synchronously from localStorage
 * Use this when you need colors immediately without waiting
 */
export const getInstitutionColorsSync = (): { primaryColor: string; secondaryColor: string } => {
  if (typeof window === 'undefined') {
    return {
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
    };
  }

  const storedPrimary = localStorage.getItem('institution_primary_color');
  const storedSecondary = localStorage.getItem('institution_secondary_color');

  return {
    primaryColor: storedPrimary || DEFAULT_PRIMARY,
    secondaryColor: storedSecondary || DEFAULT_SECONDARY,
  };
};
