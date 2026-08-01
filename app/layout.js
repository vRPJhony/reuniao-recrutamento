import "./globals.css";

export const metadata = {
  title: "Reunião Staff Atlas",
  description: "Reunião e recrutamento da Staff Atlas."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111f"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
