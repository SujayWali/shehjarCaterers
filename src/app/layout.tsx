import AuthGate from '@/components/AuthGate';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Shehjar Caterers',
  description: 'Catering Management Web App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
