"use client";
import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Loading from '@/components/Loading';
import Loader from '@/components/ui/Loader';

type Collaboration = {
  id: string;
  partnerPublicId: string;
  partnerName: string;
  partnerRole: 'institution' | 'acreditor';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes: string | null;
};

const statusStyles = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const getStatusText = (status: 'pending' | 'approved' | 'rejected', t: any) => ({
  pending: t('institution.partners.status.pending'),
  approved: t('institution.partners.status.approved'),
  rejected: t('institution.partners.status.rejected'),
}[status]);

// Special partners that require accreditation
const SPECIAL_PARTNER_IDS = ['RFR-000001', 'RFR-000002'];

export default function PartnersPage() {
  const { t } = useLanguage();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [referencePartners, setReferencePartners] = useState<Array<{
    id: string;
    partnerId: string;
    partnerPublicId: string;
    partnerName: string;
    partnerLogo?: string | null;
    status: string;
    isSpecialPartner: boolean;
    accreditationStartDate?: string | null;
    accreditationEndDate?: string | null;
    accreditationDuration?: string | null;
    accreditationStatus?: 'active' | 'expiring_soon' | 'expired' | 'grace_period' | null;
    createdAt: string;
  }>>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Renew accreditation modal state
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPartner, setRenewPartner] = useState<{ id: string; name: string } | null>(null);
  const [renewDuration, setRenewDuration] = useState<string>('');

  // Incoming collaboration requests (where we are the partner)
  const [incomingRequests, setIncomingRequests] = useState<Collaboration[]>([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);

  useEffect(() => {
    fetchCollaborations();
    fetchReferencePartners();
    fetchIncomingRequests();
  }, []);

  const fetchCollaborations = async () => {
    try {
      const res = await fetch('/api/collaborations');
      if (res.ok) {
        const data = await res.json();
        // Map API response to our format
        const mapped = data.collaborations.map((c: any) => ({
          id: c.collaboration.id,
          partnerPublicId: c.partnerOrg?.publicId || 'N/A',
          partnerName: c.partnerOrg?.name || c.partnerUser?.email || 'Unknown',
          partnerRole: c.partnerUser?.role || 'institution',
          status: c.collaboration.status,
          createdAt: c.collaboration.createdAt,
          notes: c.collaboration.notes,
        }));
        setCollaborations(mapped);
      } else {
        console.error('Failed to fetch collaborations');
      }
    } catch (err) {
      console.error('Error fetching collaborations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch incoming requests from institutions that added us as partner
  const fetchIncomingRequests = async () => {
    try {
      setLoadingIncoming(true);
      const res = await fetch('/api/collaborations?side=partner');
      if (res.ok) {
        const data = await res.json();
        // Map for incoming requests - here partnerOrg is actually the institution that added us
        const mapped = data.collaborations.map((c: any) => ({
          id: c.collaboration.id,
          partnerPublicId: c.partnerOrg?.publicId || 'N/A',
          partnerName: c.partnerOrg?.name || c.partnerUser?.email || 'Unknown',
          partnerRole: c.partnerUser?.role || 'institution',
          status: c.collaboration.status,
          createdAt: c.collaboration.createdAt,
          notes: c.collaboration.notes,
        }));
        // Only show pending and approved (not rejected)
        setIncomingRequests(mapped.filter((r: Collaboration) => r.status !== 'rejected'));
      }
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
    } finally {
      setLoadingIncoming(false);
    }
  };

  // Approve incoming request
  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch('/api/collaborations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        await fetchIncomingRequests();
        alert(t('institution.partners.success.approved') || 'Onaylandı!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t('institution.partners.errors.approveFailed') || 'Onay başarısız');
      }
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  // Reject incoming request (deletes from table)
  const handleRejectRequest = async (id: string) => {
    if (!confirm(t('institution.partners.confirmReject') || 'Bu isteği reddetmek istediğinize emin misiniz?')) return;
    try {
      // Reject will set status to rejected, but we want to delete it
      // Using DELETE endpoint to remove it entirely
      const res = await fetch(`/api/collaborations?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchIncomingRequests();
        alert(t('institution.partners.success.rejected') || 'Reddedildi!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t('institution.partners.errors.rejectFailed') || 'Ret başarısız');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const deleteReferencePartner = async (id: string) => {
    if (!confirm(t('institution.partners.confirmDelete'))) return;
    try {
      const res = await fetch(`/api/external-partnerships?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchReferencePartners();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t('institution.partners.errors.cannotDelete'));
      }
    } catch (e) {
      console.error('Error deleting reference partner:', e);
      alert(t('institution.partners.errors.deleteError'));
    }
  };

  const fetchReferencePartners = async () => {
    try {
      setLoadingRefs(true);
      const res = await fetch('/api/external-partnerships?includeExpired=true');
      if (res.ok) {
        const data = await res.json();
        setReferencePartners(data.partnerships || []);
      } else {
        setReferencePartners([]);
      }
    } catch (err) {
      console.error('Error fetching reference partners:', err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const renewAccreditation = async () => {
    if (!renewPartner || !renewDuration) return;
    try {
      const res = await fetch('/api/external-partnerships/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnershipId: renewPartner.id, accreditationDuration: renewDuration }),
      });
      if (res.ok) {
        await fetchReferencePartners();
        setRenewModalOpen(false);
        setRenewPartner(null);
        setRenewDuration('');
        alert(t('institution.partners.success.renewed'));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t('institution.partners.errors.renewFailed'));
      }
    } catch (e) {
      console.error('Error renewing accreditation:', e);
      alert(t('institution.partners.errors.renewError'));
    }
  };

  const filtered = useMemo(() => {
    // Combine outgoing collaborations and incoming requests
    // Mark incoming with a flag so we can show different actions
    const outgoing = collaborations.map(c => ({ ...c, isIncoming: false }));
    const incoming = incomingRequests.map(c => ({ ...c, isIncoming: true }));
    let data = [...outgoing, ...incoming];

    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(c =>
        c.partnerName.toLowerCase().includes(q) ||
        c.partnerPublicId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter);
    }
    // Sort by date descending
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return data;
  }, [collaborations, incomingRequests, query, statusFilter]);

  // Add partner - supports both collaboration (INS/ACR) and external (RFR) partners
  const addPartner = async (partnerPublicId: string, isExternal: boolean, accreditationDuration?: string) => {
    try {
      if (isExternal) {
        // External/Reference partner (RFR) -> /api/external-partnerships
        const res = await fetch('/api/external-partnerships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerPublicId, accreditationDuration }),
        });

        if (res.ok) {
          await fetchReferencePartners();
          setAddOpen(false);
          alert(t('institution.partners.success.addedPending'));
        } else {
          const error = await res.json();
          alert(error.error ? t('institution.partners.errors.errorPrefix').replace('{error}', error.error) : t('institution.partners.errors.cannotAdd'));
        }
      } else {
        // Collaboration partner (INS/ACR) -> /api/collaborations
        const res = await fetch('/api/collaborations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerPublicId }),
        });

        if (res.ok) {
          await fetchCollaborations();
          setAddOpen(false);
          alert(t('institution.partners.success.addedPending'));
        } else {
          const error = await res.json();
          alert(error.error ? t('institution.partners.errors.errorPrefix').replace('{error}', error.error) : t('institution.partners.errors.cannotAdd'));
        }
      }
    } catch (err) {
      console.error('Error adding partner:', err);
      alert(t('institution.partners.errors.addError'));
    }
  };

  const deletePartner = async (collaborationId: string) => {
    if (!confirm(t('institution.partners.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/collaborations?id=${collaborationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchCollaborations();
      } else {
        alert(t('institution.partners.errors.cannotRemove'));
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
      alert(t('institution.partners.errors.removeError'));
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('institution.partners.title')}</h1>
          <p className="text-gray-600 mt-2">{t('institution.partners.subtitle').replace('{count}', String(collaborations.length))}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">{t('institution.partners.addNew')}</button>
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('institution.partners.searchPlaceholder')}
          className="input w-full md:w-96"
        />
        <div className="relative w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none input p-1 w-full border-gray-300 rounded-lg pr-10"
          >
            <option value="all">{t('institution.partners.filter.all')}</option>
            <option value="pending">{t('institution.partners.filter.pending')}</option>
            <option value="approved">{t('institution.partners.filter.approved')}</option>
            <option value="rejected">{t('institution.partners.filter.rejected')}</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">{t('institution.partners.table.partnerId')}</th>
              <th className="px-6 py-3">{t('institution.partners.table.partnerName')}</th>
              {/* <th className="px-6 py-3">Rol</th> */}
              <th className="px-6 py-3">{t('institution.partners.table.status')}</th>
              {/* <th className="px-6 py-3">ortak sertifikalar</th> */}
              <th className="px-6 py-3">{t('institution.partners.table.addedDate')}</th>
              <th className="px-6 py-3"><span className="sr-only">{t('institution.partners.table.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.partnerPublicId}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{c.partnerName}</td>
                {/* <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${c.partnerRole === 'acreditor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {c.partnerRole === 'acreditor' ? 'Akreditör' : 'Kurum'}
                  </span>
                </td> */}
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[c.status]}`}>
                    {getStatusText(c.status, t)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-6 py-4 text-right">
                  {c.isIncoming ? (
                    // Incoming request actions
                    c.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveRequest(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-200 text-green-700 hover:bg-green-50 text-xs font-medium"
                          title={t('institution.partners.incoming.approve') || 'Onayla'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {t('institution.partners.incoming.approve') || 'Onayla'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium"
                          title={t('institution.partners.incoming.reject') || 'Reddet'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                          {t('institution.partners.incoming.reject') || 'Reddet'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{t('institution.partners.incoming.alreadyApproved') || 'Onaylandı'}</span>
                    )
                  ) : (
                    // Outgoing collaboration actions
                    <button
                      onClick={() => deletePartner(c.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      title={t('institution.partners.table.remove')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incoming Collaboration Requests shown inline with main table if any */}
      {/* This is now removed - incoming requests are handled in the main collaborations table above */}


      {referencePartners.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">{t('institution.partners.references.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('institution.partners.references.subtitle')}</p>
          </div>
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">{t('institution.partners.references.referenceId')}</th>
                <th className="px-6 py-3">{t('institution.partners.references.partnerName')}</th>
                <th className="px-6 py-3">{t('institution.partners.references.logo')}</th>
                <th className="px-6 py-3">{t('institution.partners.references.addedDate')}</th>
                <th className="px-6 py-3"><span className="sr-only">{t('institution.partners.table.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {referencePartners.map((partner) => {
                const isExpired = partner.accreditationStatus === 'expired';
                const isGracePeriod = partner.accreditationStatus === 'grace_period';
                const isExpiringSoon = partner.accreditationStatus === 'expiring_soon';
                const isDisabled = isExpired;

                return (
                  <tr
                    key={partner.id}
                    className={`border-b border-gray-200 ${isDisabled ? 'bg-gray-100 opacity-60' : isGracePeriod ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{partner.partnerPublicId}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {partner.partnerName}
                      {isExpiringSoon && <span className="ml-2 text-xs text-amber-600">⚠️</span>}
                      {isGracePeriod && <span className="ml-2 text-xs text-orange-600">⏳</span>}
                      {isExpired && <span className="ml-2 text-xs text-red-600">❌</span>}
                    </td>
                    <td className="px-6 py-4">{partner.partnerLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partner.partnerLogo} alt={partner.partnerName} className="w-8 h-8 object-contain" />
                    ) : (
                      '-'
                    )}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                          partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {partner.status === 'approved' ? t('institution.partners.status.approved') :
                            partner.status === 'pending' ? t('institution.partners.status.pending') :
                              t('institution.partners.status.rejected')}
                        </span>
                      </div>

                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {partner.isSpecialPartner && partner.accreditationEndDate && (
                          <p className={`text-xs mt-1 mr-2 ${isDisabled ? 'text-red-500' : isGracePeriod ? 'text-orange-500' : 'text-gray-500'}`}>
                            {t('institution.partners.references.accreditationEnd')}: {new Date(partner.accreditationEndDate).toLocaleDateString('tr-TR')}
                          </p>
                        )}  {/* Renew button for special partners */}
                        {partner.isSpecialPartner && (
                          <button
                            onClick={() => {
                              setRenewPartner({ id: partner.id, name: partner.partnerName });
                              setRenewDuration('');
                              setRenewModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                            title={t('institution.partners.table.renew')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={() => deleteReferencePartner(partner.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          title={t('institution.partners.table.remove')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loadingRefs && (
            <Loader />
          )}
        </div>
      )}

      {/* Partner Ekle Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('institution.partners.addModal.title')}</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-500">✕</button>
            </div>
            <AddPartnerForm onCancel={() => setAddOpen(false)} onSubmit={(publicId, isExternal, accreditationDuration) => addPartner(publicId, isExternal, accreditationDuration)} />
          </div>
        </div>
      )}

      {/* Akreditasyon Yenileme Modal */}
      {renewModalOpen && renewPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('institution.partners.renewModal.title')}</h3>
              <button onClick={() => { setRenewModalOpen(false); setRenewPartner(null); }} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{renewPartner.name}</span> {t('institution.partners.renewModal.description')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('institution.partners.addModal.accreditationRequired')}</label>
                <select
                  value={renewDuration}
                  onChange={(e) => setRenewDuration(e.target.value)}
                  className="input w-full"
                >
                  <option value="">{t('institution.partners.addModal.selectDuration')}</option>
                  <option value="6_months">{t('institution.partners.addModal.duration6months')}</option>
                  <option value="1_year">{t('institution.partners.addModal.duration1year')}</option>
                  <option value="2_years">{t('institution.partners.addModal.duration2years')}</option>
                </select>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {t('institution.partners.renewModal.adminApprovalNote')}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setRenewModalOpen(false); setRenewPartner(null); }} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={renewAccreditation}
                disabled={!renewDuration}
                className={`btn-primary ${!renewDuration ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {t('institution.partners.renewModal.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddPartnerForm({ onSubmit, onCancel }: {
  onSubmit: (partnerPublicId: string, isExternal: boolean, accreditationDuration?: string) => void;
  onCancel: () => void
}) {
  const { t } = useLanguage();
  const [publicIdInput, setPublicIdInput] = useState('');
  const [searchedPartner, setSearchedPartner] = useState<{ publicId: string; name: string; role: string; alreadyAdded?: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if search has been performed for current input

  const [referencePartners, setReferencePartners] = useState<Array<{ id: string; name: string; publicId: string; logo?: string | null; partnershipStatus?: string | null }>>([]);
  const [loadingReferences, setLoadingReferences] = useState(true);

  const [selectedPartner, setSelectedPartner] = useState<{ publicId: string; name: string; role: string; alreadyAdded?: boolean; isExternal?: boolean } | null>(null);
  const [showReferenceList, setShowReferenceList] = useState(false);

  // Special partner için akreditasyon süresi
  const [accreditationDuration, setAccreditationDuration] = useState<string>('');
  const SPECIAL_PARTNER_IDS = ['RFR-000001', 'RFR-000002'];
  const isSpecialPartner = selectedPartner && SPECIAL_PARTNER_IDS.includes(selectedPartner.publicId);

  useEffect(() => {
    const fetchReferenceOrgs = async () => {
      try {
        setLoadingReferences(true);
        const res = await fetch('/api/reference-partners');
        if (res.ok) {
          const data = await res.json();
          setReferencePartners(data.partners || []);
        } else {
          console.error('Failed to fetch reference organizations');
          setReferencePartners([]);
        }
      } catch (err) {
        console.error('Error fetching reference orgs:', err);
      } finally {
        setLoadingReferences(false);
      }
    };
    fetchReferenceOrgs();
  }, []);

  useEffect(() => {
    const searchPartner = async () => {
      if (publicIdInput.trim().length < 6) {
        setSearchedPartner(null);
        setIsSelf(false);
        setHasSearched(false);
        // If user clears input, clear selection only if it came from search
        if (selectedPartner?.publicId === searchedPartner?.publicId) {
          setSelectedPartner(null);
        }
        return;
      }

      // Skip if already searched for this input and found a result
      if (hasSearched && (searchedPartner || isSelf)) {
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`/api/organizations/search?publicId=${publicIdInput}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isSelf) {
            setIsSelf(true);
            setSearchedPartner(null);
            setSelectedPartner(null);
          } else if (data.organization) {
            setIsSelf(false);
            const partnerData = {
              publicId: data.organization.publicId,
              name: data.organization.name,
              role: data.organization.role === 'acreditor' ? t('institution.partners.addModal.role.accreditor') : t('institution.partners.addModal.role.institution'),
              alreadyAdded: data.organization.alreadyAdded
            };
            setSearchedPartner(partnerData);
            setSelectedPartner(partnerData);
          } else {
            setIsSelf(false);
            setSearchedPartner(null);
            setSelectedPartner(null);
          }
        }
      } catch (err) {
        console.error('Error searching partner:', err);
      } finally {
        setSearching(false);
        setHasSearched(true); // Mark that search has been performed
      }
    };

    const timer = setTimeout(searchPartner, 300);
    return () => clearTimeout(timer);
  }, [publicIdInput]); // Only depend on publicIdInput - removed other dependencies to prevent infinite loop

  const handleSelectFromList = (partner: any) => {
    setPublicIdInput('');
    setSearchedPartner(null);
    setIsSelf(false);
    setSelectedPartner({
      // external partners do not have role; mark as Referans and flag as external
      publicId: partner.publicId,
      name: partner.name,
      role: t('institution.partners.addModal.role.reference'),
      alreadyAdded: false,
      // @ts-ignore
      isExternal: true,
    });
    setAccreditationDuration(''); // Reset when selecting new partner
  };

  // Validation: Partner selected, not already added, and if special partner requires accreditation
  const valid = selectedPartner && !selectedPartner.alreadyAdded &&
    (!isSpecialPartner || accreditationDuration);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || !selectedPartner) return;
        onSubmit(selectedPartner.publicId.toUpperCase(), !!selectedPartner.isExternal, isSpecialPartner ? accreditationDuration : undefined);
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm text-gray-600 mb-1">{t('institution.partners.addModal.searchLabel')}</label>
        <input
          className="input w-full py-3 uppercase"
          value={publicIdInput}
          onChange={e => {
            setPublicIdInput(e.target.value.toUpperCase());
            setHasSearched(false); // Reset search state on new input
          }}
          placeholder={t('institution.partners.addModal.searchPlaceholder')}
          maxLength={10}
        />
        {searching && <p className="text-xs text-gray-500 mt-1">{t('institution.partners.addModal.searching')}</p>}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">{t('institution.partners.addModal.or')}</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowReferenceList(v => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <span>{t('institution.partners.addModal.selectFromList')}</span>
          <svg className={`w-4 h-4 transition-transform ${showReferenceList ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {showReferenceList && (
          <div className="mt-2">
            {loadingReferences ? (
              <p className="text-sm text-gray-500">{t('institution.partners.addModal.loadingReferences')}</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50">
                {referencePartners.length > 0 ? (
                  referencePartners.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectFromList(p)}
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${selectedPartner?.publicId === p.publicId ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {p.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-200" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.publicId}</p>
                        </div>
                        {p.partnershipStatus && (
                          <div className="relative group">
                            <div className={`w-3 h-3 rounded-full ${p.partnershipStatus === 'pending' ? 'bg-amber-500' :
                              p.partnershipStatus === 'approved' ? 'bg-emerald-500' :
                                'bg-red-500'
                              }`} />
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {p.partnershipStatus === 'pending' ? t('institution.partners.addModal.statusTooltip.pending') :
                                  p.partnershipStatus === 'approved' ? t('institution.partners.addModal.statusTooltip.approved') :
                                    t('institution.partners.addModal.statusTooltip.rejected')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-500">{t('institution.partners.addModal.noReferences')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Seçilen Partner Bilgisi --- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">{t('institution.partners.addModal.selected')}</span>
        </div>
      </div>
      <div className="mt-4 space-y-2 min-h-[70px]">
        {isSelf && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium text-blue-800">{t('institution.partners.addModal.selfError')}</p>
          </div>
        )}
        {selectedPartner && !selectedPartner.alreadyAdded && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-bold text-green-800">{t('institution.partners.addModal.toBeAdded')}</p>
            <p className="font-medium text-green-800">{selectedPartner.name}</p>
            <p className="text-green-600 text-xs">{selectedPartner.role} - {selectedPartner.publicId}</p>
          </div>
        )}

        {/* Special Partner için Akreditasyon Süresi Seçimi */}
        {isSpecialPartner && selectedPartner && !selectedPartner.alreadyAdded && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-amber-900 mb-2">{t('institution.partners.addModal.accreditationRequired')}</p>
            <p className="text-xs text-amber-700 mb-3">{t('institution.partners.addModal.accreditationDesc')}</p>
            <select
              value={accreditationDuration}
              onChange={(e) => setAccreditationDuration(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">{t('institution.partners.addModal.selectDuration')}</option>
              <option value="6_months">{t('institution.partners.addModal.duration6months')}</option>
              <option value="1_year">{t('institution.partners.addModal.duration1year')}</option>
              <option value="2_years">{t('institution.partners.addModal.duration2years')}</option>
            </select>
          </div>
        )}

        {selectedPartner && selectedPartner.alreadyAdded && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-bold text-yellow-800">{t('institution.partners.addModal.alreadyAdded')}</p>
            <p className="font-medium text-yellow-800">{selectedPartner.name}</p>
            <p className="text-yellow-600 text-xs">{t('institution.partners.addModal.alreadyAddedDesc')}</p>
          </div>
        )}
        {!searching && publicIdInput.length >= 6 && !searchedPartner && !isSelf && (
          <p className="text-sm text-red-600 mt-1">{t('institution.partners.addModal.notFound')}</p>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">{t('institution.partners.addModal.cancel')}</button>
        <button disabled={!valid} className={`btn-primary ${!valid ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {t('institution.partners.addModal.add')}
        </button>
      </div>
    </form>
  );
}
