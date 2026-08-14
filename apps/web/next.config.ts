import type { NextConfig } from 'next';

// Proxeia /api/* pra API (Render) através do próprio domínio do web (Vercel).
// Sem isso, o cookie de sessão é cross-site de verdade (domínios diferentes) e
// o Safari/iOS bloqueia via ITP mesmo com SameSite=None;Secure. Com o proxy, o
// navegador só fala com o domínio do web — o cookie vira first-party.
const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
