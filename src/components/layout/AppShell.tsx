import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-60 pb-24 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
