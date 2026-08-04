import type { NextConfig } from "next";

// CSP em Report-Only de propósito (A2 da auditoria): não bloqueia nada ainda,
// só reporta violação no console do navegador. Serve pra medir o que o site
// realmente carrega (Pusher, Google Fonts, Vercel, Blob) antes de promover pra
// enforcement. A proteção real de clickjacking já vem do X-Frame-Options: DENY
// abaixo, que ESTE cabeçalho não substitui enquanto for Report-Only.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval': Next injeta script inline de bootstrap e o
  // dev usa eval. Mantidos pra Report-Only não virar ruído; ao promover pra
  // enforcement, migrar script pra nonce.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.pusherapp.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Vale pro site inteiro, não só as áreas internas do middleware.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
