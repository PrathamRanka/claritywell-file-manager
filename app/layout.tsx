import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import './globals.css';
import { LayoutContent } from './layout-content';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'DocVault - Document Management System',
  description: 'Secure document management with role-based access control',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Session retrieval error:', error);
    // Continue without session if there's an error
  }

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {session ? (
            <LayoutContent user={session.user}>
              {children}
            </LayoutContent>
          ) : (
            <>
              {children}
            </>
          )}
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
