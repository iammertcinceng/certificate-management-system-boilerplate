import AdminHeader from "@/components/header/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
