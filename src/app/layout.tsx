import './globals.css';
import AuthGate from '@/components/AuthGate';

export const metadata = {
  title: 'Shehjar Caterers',
  description: 'Catering Management Web App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Navbar = require('@/components/Navbar').default;
  return (
    <html lang="en">
      <body>
        <Navbar />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
