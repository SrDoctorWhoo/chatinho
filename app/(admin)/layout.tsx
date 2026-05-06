import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-950 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden h-screen">
        <div className="w-full h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
