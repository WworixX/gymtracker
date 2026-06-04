'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ background: '#0c0c0f', color: '#f2f2f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', textAlign: 'center', padding: '24px' }}>
        <div>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Erreur critique</h1>
          <p style={{ color: '#8b8b9a', fontSize: 14, marginBottom: 20 }}>L&apos;application a rencontré un problème.</p>
          <button
            onClick={reset}
            style={{ height: 44, padding: '0 20px', borderRadius: 10, background: '#c8f542', color: '#0c0c0f', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
