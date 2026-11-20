import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'WorkSphere | Enterprise Project Management & Workflow Automation',
  description: 'Multi-Tenant Project Management & Workflow Automation Platform with OCC Concurrency Control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
