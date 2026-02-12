/**
 * Base layout: Header (dark teal), Sidebar, main, Footer, MobileNav.
 */
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileNav from './MobileNav';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background-light">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
            {children}
          </main>
        </div>
        <Footer />
      </div>
      <MobileNav />
    </div>
  );
}
