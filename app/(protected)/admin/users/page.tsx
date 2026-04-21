"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  role: string;
  orgName?: string;
  orgPublicId?: string;
  logo?: string;
  infoEmail?: string;
  createdAt: string;
};

type ExternalPartner = {
  id: string;
  name: string;
  publicId: string;
  logo?: string;
  createdAt: string;
};

const PROTECTED_PARTNER_IDS = ['RFR-000001', 'RFR-000002'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [externalPartners, setExternalPartners] = useState<ExternalPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'institution' | 'acreditor'>('all');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerLogoBase64, setPartnerLogoBase64] = useState<string | null>(null);

  // User edit/delete states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, partnersRes] = await Promise.all([
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/admin/external-partners', { cache: 'no-store' }),
        ]);
        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const partnersData = partnersRes.ok ? await partnersRes.json() : { partners: [] };

        setUsers((usersData.users || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          orgName: u.orgName,
          orgPublicId: u.orgPublicId,
          logo: u.logo,
          infoEmail: u.infoEmail,
          createdAt: u.createdAt,
        })));
        setExternalPartners(partnersData.partners || []);
      } catch {
        setUsers([]);
        setExternalPartners([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPartnerLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPartner = async () => {
    if (!partnerName.trim()) {
      alert('Kuruluş adı gerekli');
      return;
    }

    try {
      const res = await fetch('/api/admin/external-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: partnerName, logo: partnerLogoBase64 }),
      });

      if (res.ok) {
        const data = await res.json();
        setExternalPartners([...externalPartners, data.partner]);
        setShowAddPartnerModal(false);
        setPartnerName('');
        setPartnerLogoBase64(null);
        alert('Referans kuruluş eklendi');
      } else {
        const error = await res.json();
        alert(`Eklenemedi: ${error.error || 'Bilinmeyen hata'}`);
      }
    } catch {
      alert('Bir sunucu hatası oluştu');
    }
  };

  const handleDeletePartner = async (partner: ExternalPartner) => {
    if (PROTECTED_PARTNER_IDS.includes(partner.publicId)) {
      alert('Bu partner silinemez. ICF ve CPD partnerleri sistem için gereklidir.');
      return;
    }

    if (!confirm(`"${partner.name}" kuruluşunu silmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/external-partners?id=${partner.id}`, { method: 'DELETE' });
      if (res.ok) {
        setExternalPartners(externalPartners.filter(p => p.id !== partner.id));
        alert('Kuruluş silindi');
      } else {
        const error = await res.json();
        alert(`Silinemedi: ${error.error || 'Bilinmeyen hata'}`);
      }
    } catch {
      alert('Bir sunucu hatası oluştu');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u));
        setShowUserModal(false);
        setSelectedUser(null);
        alert('Kullanıcı güncellendi.');
      } else {
        alert('Kullanıcı güncellenemedi.');
      }
    } catch {
      alert('Bir hata oluştu.');
    }
    setSavingUser(false);
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      alert('Admin kullanıcılar silinemez.');
      return;
    }

    if (!confirm(`"${user.email}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        alert('Kullanıcı silindi.');
      } else {
        const error = await res.json();
        alert(`Kullanıcı silinemedi: ${error.error || 'Bilinmeyen hata'}`);
      }
    } catch {
      alert('Bir hata oluştu.');
    }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return u.email.toLowerCase().includes(q) || (u.orgName && u.orgName.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="text-gray-600 mt-2">Sistem kullanıcıları görüntüleyin.</p>
        </div>
        <button
          onClick={() => setShowAddPartnerModal(true)}
          className="btn-primary"
        >
          + Referans Kuruluş Ekle
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="E-posta veya kurum ara..."
            className="input w-full pr-10 p-3 rounded-lg"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.746l2.64 2.64a.75.75 0 101.06-1.06l-2.64-2.64A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
        <div className="relative w-48">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="appearance-none input w-full p-3 rounded-lg pr-10"
          >
            <option value="all">Tüm Roller</option>
            <option value="admin">Admin</option>
            <option value="institution">Kurum</option>
            <option value="acreditor">Akreditör</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">E-posta</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Kurum/Partner</th>
              <th className="px-6 py-3">Kayıt Tarihi</th>
              <th className="px-6 py-3 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={5}>Yükleniyor...</td></tr>
            ) : filteredUsers.length ? filteredUsers.map(u => (
              <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    u.role === 'institution' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                    {u.role === 'admin' ? 'Yönetici' : u.role === 'institution' ? 'Kurum' : 'Akreditör'}
                  </span>
                </td>
                <td className="px-6 py-4">{u.orgName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={5}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {externalPartners.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Referans Kuruluşlar</h2>
            <p className="text-sm text-gray-500 mt-1">Sertifikalarda gösterilecek IBM, Oxford gibi referans kuruluşlar</p>
          </div>
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Partner ID</th>
                <th className="px-6 py-3">İsim</th>
                <th className="px-6 py-3">Logo</th>
                <th className="px-6 py-3">Eklenme Tarihi</th>
                <th className="px-6 py-3"><span className="sr-only">İşlemler</span></th>
              </tr>
            </thead>
            <tbody>
              {externalPartners.map(p => {
                const isProtected = PROTECTED_PARTNER_IDS.includes(p.publicId);
                return (
                  <tr key={p.id} className={`border-b border-gray-200 hover:bg-gray-50 ${isProtected ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {p.publicId}
                      {isProtected && <span className="ml-2 text-xs text-amber-600">🔒</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                    <td className="px-6 py-4">{p.logo ? <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain" /> : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {!isProtected && (
                        <button
                          onClick={() => handleDeletePartner(p)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          title="Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-lg font-semibold text-gray-900">Referans Kuruluş Ekle</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddPartnerModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kuruluş Adı</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="Örn: IBM, Oxford University"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Yükle</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="text-sm text-gray-600">
                            {partnerLogoBase64 ? 'Logo seçildi' : 'Dosya seçin veya sürükleyin'}
                          </div>
                          <div className="text-xs text-gray-500">
                            PNG, JPG, WebP (max 5MB)
                          </div>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {partnerLogoBase64 && (
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden bg-white p-2">
                          <img src={partnerLogoBase64} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Önerilen Logo Özellikleri:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>Boyut: 200x200 piksel (kare)</li>
                          <li>Format: PNG (şeffaf arka plan önerilir)</li>
                          <li>Dosya boyutu: 5MB'dan küçük</li>
                          <li>Logo otomatik optimize edilecektir</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button className="btn-secondary" onClick={() => setShowAddPartnerModal(false)}>İptal</button>
              <button
                className="btn-primary"
                onClick={handleAddPartner}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-lg font-semibold text-gray-900">Kullanıcı Düzenle</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => { setShowUserModal(false); setSelectedUser(null); }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">E-posta</label>
                <p className="text-base text-gray-900">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Kurum/Partner</label>
                <p className="text-base text-gray-900">{selectedUser.orgName || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="input w-full p-3 rounded-lg"
                  disabled={selectedUser.role === 'admin'}
                >
                  <option value="admin">Yönetici</option>
                  <option value="institution">Kurum</option>
                  <option value="acreditor">Akreditör</option>
                </select>
                {selectedUser.role === 'admin' && (
                  <p className="text-xs text-amber-600 mt-1">Admin rolü değiştirilemez.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Kayıt Tarihi</label>
                <p className="text-base text-gray-900">
                  {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button className="btn-secondary" onClick={() => { setShowUserModal(false); setSelectedUser(null); }}>İptal</button>
              <button
                className="btn-primary disabled:opacity-50"
                onClick={handleSaveUser}
                disabled={savingUser || selectedUser.role === 'admin'}
              >
                {savingUser ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
