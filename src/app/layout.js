import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: "Personal To-Do List",
  description: "A simple personal to-do list.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
