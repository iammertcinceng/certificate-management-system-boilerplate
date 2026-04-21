'use client';
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from "@/components/ui/Loader";

type ApiCollision = { status: 'collision'; students: { id: string; name: string }[]; error?: string };
type ApiList = { status: 'list'; student: { id: string; name: string }; certificates: { n: number; id: string; publicId: string; certificateNumber: string; trainingName: string; dateIssued: string; institutionName: string }[] };
type ApiDetail = { status: 'detail'; student: { id: string; name: string }; certificate: { id: string; publicId: string; dateIssued: string; trainingName: string; institutionName: string } };

// Error types for better user messaging
type ErrorType = 'notFound' | 'noCertificates' | 'serverError' | 'networkError' | 'generic';

function VerifyResultContent() {
  const { t } = useLanguage();
  const sp = useSearchParams();
  const router = useRouter();
  const q = (sp.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('generic');
  const [collision, setCollision] = useState<ApiCollision | null>(null);
  const [list, setList] = useState<ApiList | null>(null);

  const [fullName, setFullName] = useState("");

  const fetchData = async (opts?: { fullName?: string }) => {
    if (!q) return;
    setLoading(true);
    setError(null);
    setErrorType('generic');
    setCollision(null);
    setList(null);
    try {
      const params = new URLSearchParams({ q });
      if (opts?.fullName) params.set('fullName', opts.fullName);
      const qs = params.toString();
      const res = await fetch(`/api/verify?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));

        // More specific error messages
        if (res.status === 400) {
          setErrorType('notFound');
          throw new Error(t('verifyResult.error.invalidCode'));
        } else if (res.status === 404) {
          if (err?.error === 'No match') {
            setErrorType('notFound');
            throw new Error(t('verifyResult.error.noStudentFound'));
          } else if (err?.error === 'No certificates for student') {
            setErrorType('noCertificates');
            throw new Error(t('verifyResult.error.noCertificates'));
          }
          setErrorType('notFound');
          throw new Error(t('verifyResult.error.notFound'));
        } else if (res.status === 500) {
          setErrorType('serverError');
          throw new Error(t('verifyResult.error.serverError'));
        }
        setErrorType('generic');
        throw new Error(err?.error || `${t('verifyResult.error.queryFailed')} (status ${res.status})`);
      }
      const data: ApiCollision | ApiList | ApiDetail = await res.json();
      if (data.status === 'collision') {
        setCollision(data as ApiCollision);
      } else if (data.status === 'list') {
        setList(data as ApiList);
      } else if (data.status === 'detail') {
        const d = data as ApiDetail;
        // Include studentId in URL for multi-student certificates
        const studentIdParam = d.student?.id ? `?studentId=${encodeURIComponent(d.student.id)}` : '';
        router.replace(`/verify/result/${d.certificate.id}${studentIdParam}`);
      }
    } catch (e: any) {
      // Network error check
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setErrorType('networkError');
        setError(t('verifyResult.error.networkError'));
      } else {
        setError(e.message || t('verifyResult.error.queryFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Get appropriate error title based on error type
  const getErrorTitle = () => {
    if (errorType === 'notFound' || errorType === 'noCertificates') {
      return t('verifyResult.error.noCertificateTitle');
    }
    return t('verifyResult.error.title');
  };

  if (!q) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center text-gray-600">{t('verifyResult.noQuery')}</div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] px-4 pt-24 md:pt-28 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{t('verifyResult.title')}</h1>
            <p className="text-sm text-gray-600 mt-2">{t('verifyResult.subtitle')}</p>
          </div>
          <a href="/verify" className="btn-secondary">{t('verifyResult.newQuery')}</a>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm flex items-center justify-center">
            <Loader />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">{getErrorTitle()}</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collision helper card */}
        {collision && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">{t('verifyResult.collision.title')}</h3>
                <p className="text-sm text-amber-700 mb-3">{t('verifyResult.collision.description')}</p>
                <ul className="text-sm text-amber-800 mb-4 space-y-1">
                  {collision.students.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      {s.name}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('verifyResult.collision.placeholder')}
                    className="flex-1 input"
                  />
                  <button
                    onClick={() => fetchData({ fullName })}
                    className="btn-primary"
                  >
                    {t('verifyResult.collision.verify')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {list && (
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-700">{t('verifyResult.success.title')}</div>
                  <div className="text-lg font-bold text-emerald-900">{t('verifyResult.success.welcome')} <span className="bg-emerald-100 px-3 py-1 rounded-full text-emerald-700">{list.student.name}</span></div>
                </div>
              </div>
            </div>

            {/* Certificates List */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('verifyResult.certificates.title')}</h2>
                  <p className="text-sm text-gray-600 mt-1">{list.certificates.length} {t('verifyResult.certificates.found')}</p>
                </div>
              </div>
              <div className="space-y-3">
                {list.certificates
                  .sort((a, b) => b.n - a.n) // Sort by sequence number DESC (newest first)
                  .map(c => (
                    <div key={c.id} className="group relative rounded-xl border border-gray-200 p-5 hover:border-[#0945A5] hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#0945A5] to-[#046358] text-white grid place-items-center font-bold text-sm">
                            {c.n}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{c.trainingName}</div>
                            <div className="text-xs text-gray-500 mb-2 font-mono">{c.certificateNumber}</div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {c.institutionName}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(c.dateIssued).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {t('verifyResult.certificates.verified')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a href={`/verify/result/${c.id}?studentId=${encodeURIComponent(list.student.id)}`} className="btn-primary ml-4">
                          {t('verifyResult.certificates.view')}
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{t('verifyResult.certificates.tip')}</span> {t('verifyResult.certificates.tipDescription')} <br />
                    <span className="text-xs text-blue-700 mt-1 inline-block">{t('verifyResult.certificates.tipExample')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center px-4">
          <Loading />
        </main>
      }
    >
      <VerifyResultContent />
    </Suspense>
  );
}
