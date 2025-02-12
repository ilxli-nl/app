import localFont from 'next/font/local';
import '@/assets/styles/globals.css';
import Navbar from './components/navbar';
import QueryProvider from './providers/QueryProvider';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'LitaLife App',
  description: 'Generated by Ahmad Azizyar',
};

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      <html lang='en'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navbar />
          {children}
        </body>
      </html>
    </QueryProvider>
  );
}
