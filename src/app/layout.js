import "./globals.css";

export const metadata = {
  title: "Simple To-Do List",
  description: "A simple to-do list for online users",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className=""
      >
        {children}
      </body>
    </html>
  );
}
