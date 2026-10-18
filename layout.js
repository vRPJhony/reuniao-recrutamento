import "./globals.css";

export const metadata = {
  title: "Eufo Group | Recrutamento",
  description: "Portal oficial de recrutamento do Eufo Group."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0404bd"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
