import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stroop Cognitive Test — Medical Research',
  description:
    'A standardized, browser-based Stroop Test for academic medical research. Measures cognitive interference and reaction time across three experimental blocks.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
