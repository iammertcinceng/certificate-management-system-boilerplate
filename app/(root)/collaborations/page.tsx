"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Lightweight listing item - optimized for performance (no logo data)
type OrgListItem = {
  id: string;          // INS-000001 or ACR-000001 (display)
  slug: string;        // URL key
  name: string;
  hasLogo?: boolean;   // Flag only, logo loaded on detail page
  role: 'institution' | 'acreditor';
  trainings?: { id: string; name: string }[];
};

export default function OurInstitutionsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<OrgListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'institution' | 'partner'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // Track if initial fetch completed

  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        fetchAbortRef.current?.abort();
        const ctrl = new AbortController();
        fetchAbortRef.current = ctrl;
        const res = await fetch('/api/collaborations/public-list', { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        const mapped: OrgListItem[] = (data.items || []).map((it: any) => ({
          id: it.id,
          slug: it.slug,
          name: it.name,
          hasLogo: it.hasLogo || false,
          role: it.role,
          trainings: it.trainings || [],
        }));
        setItems(mapped);
        setHasFetched(true); // Mark as fetched
      } catch { }
      finally { setIsLoading(false); }
    };
    load();
    return () => fetchAbortRef.current?.abort();
  }, []);

  // Debounced server-side search - skip initial render
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip initial render (handled by first useEffect)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const q = searchQuery.trim();
      const url = q ? `/api/collaborations/public-list?q=${encodeURIComponent(q)}` : '/api/collaborations/public-list';
      (async () => {
        try {
          setIsLoading(true);
          fetchAbortRef.current?.abort();
          const ctrl = new AbortController();
          fetchAbortRef.current = ctrl;
          const res = await fetch(url, { signal: ctrl.signal });
          if (!res.ok) return;
          const data = await res.json();
          const mapped: OrgListItem[] = (data.items || []).map((it: any) => ({
            id: it.id,
            slug: it.slug,
            name: it.name,
            hasLogo: it.hasLogo || false,
            role: it.role,
            trainings: it.trainings || [],
          }));
          setItems(mapped);
          setHasFetched(true);
        } catch { }
        finally { setIsLoading(false); }
      })();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    let result = items;
    // Filter by type (institution vs partner/acreditor)
    if (filterType !== 'all') {
      result = result.filter(item =>
        filterType === 'partner' ? item.role === 'acreditor' : item.role === 'institution'
      );
    }
    return result;
  }, [items, filterType]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('collaborations.title')}</h1>
          <p className="text-gray-600 mt-2">{t('collaborations.subtitle')}</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('collaborations.search.placeholder')}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0945A5] focus:border-[#0945A5] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${filterType !== 'all'
                ? 'border-[#0945A5] bg-[#0945A5]/5 text-[#0945A5]'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{t('collaborations.search.filter')}</span>
              {filterType !== 'all' && (
                <span className="w-2 h-2 bg-[#0945A5] rounded-full"></span>
              )}
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('collaborations.search.filterType')}
                  </div>
                  <button
                    onClick={() => { setFilterType('all'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filterType === 'all'
                      ? 'bg-[#0945A5] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {t('collaborations.search.all')}
                  </button>
                  <button
                    onClick={() => { setFilterType('institution'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filterType === 'institution'
                      ? 'bg-[#0945A5] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {t('collaborations.search.institutionsOnly')}
                  </button>
                  <button
                    onClick={() => { setFilterType('partner'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filterType === 'partner'
                      ? 'bg-[#0945A5] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {t('collaborations.search.partnersOnly')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterType !== 'all') && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-600">{t('collaborations.search.activeFilters')}</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                {t('collaborations.search.searchLabel')} "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                {filterType === 'institution' ? t('collaborations.badges.institutions') : t('collaborations.badges.partners')}
                <button onClick={() => setFilterType('all')} className="hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{isLoading ? t('collaborations.results.loading') : `${filtered.length} ${t('collaborations.results.found')}`}</span>
        {filtered.length !== items.length && (
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); }}
            className="text-[#0945A5] hover:underline font-medium"
          >
            {t('collaborations.search.clearFilters')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Link key={item.id} href={`/collaborations/${item.slug}`} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center">
                  {/* Logo loaded only on detail page for performance */}
                  <span className="text-2xl">{item.role === 'acreditor' ? '🛡️' : '🏛️'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-mono rounded-md border ${item.role === 'acreditor'
                      ? 'border-purple-200 bg-purple-50 text-purple-600'
                      : 'border-blue-200 bg-blue-50 text-blue-600'
                      }`}>{item.id}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !hasFetched ? (
        // Still loading initial data - show skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('collaborations.results.noResults')}</h3>
          <p className="text-gray-600 mb-4">{t('collaborations.results.noResultsDesc')}</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); }}
            className="btn-secondary"
          >
            {t('collaborations.search.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
