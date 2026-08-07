// Mirrors the AuthIllustration on the OpenSign sign-in page so the two
// products read as one platform, but shows what this console actually is:
// an operator view over many tenant workspaces, not a document to sign.
// Pure inline SVG - no asset request, and it inherits the navy panel behind
// it rather than shipping a second copy of the palette.
export default function ConsoleIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 320 260" className={className} role="img" aria-label="Platform console overview">
      <defs>
        <linearGradient id="ci-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EAF1FF" />
        </linearGradient>
        <linearGradient id="ci-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#4E8BD6" />
          <stop offset="100%" stopColor="#8FC0F5" />
        </linearGradient>
      </defs>

      {/* Main console panel */}
      <rect x="34" y="30" width="252" height="168" rx="16" fill="url(#ci-card)" />
      <rect x="34" y="30" width="252" height="34" rx="16" fill="#0B3D73" />
      <rect x="34" y="52" width="252" height="12" fill="#0B3D73" />
      <circle cx="52" cy="47" r="4" fill="#5C86BE" />
      <circle cx="66" cy="47" r="4" fill="#5C86BE" opacity="0.6" />
      <circle cx="80" cy="47" r="4" fill="#5C86BE" opacity="0.35" />

      {/* Stat tiles - the platform totals a Super Admin lands on */}
      <rect x="50" y="78" width="66" height="42" rx="9" fill="#FFFFFF" />
      <rect x="60" y="88" width="30" height="6" rx="3" fill="#B9CCE6" />
      <rect x="60" y="100" width="20" height="10" rx="3" fill="#0B3D73" />

      <rect x="126" y="78" width="66" height="42" rx="9" fill="#FFFFFF" />
      <rect x="136" y="88" width="30" height="6" rx="3" fill="#B9CCE6" />
      <rect x="136" y="100" width="26" height="10" rx="3" fill="#1B4F91" />

      <rect x="202" y="78" width="66" height="42" rx="9" fill="#FFFFFF" />
      <rect x="212" y="88" width="30" height="6" rx="3" fill="#B9CCE6" />
      <rect x="212" y="100" width="16" height="10" rx="3" fill="#4E8BD6" />

      {/* Usage chart */}
      <rect x="50" y="132" width="218" height="52" rx="9" fill="#FFFFFF" />
      <rect x="62" y="160" width="14" height="14" rx="3" fill="url(#ci-bar)" />
      <rect x="84" y="150" width="14" height="24" rx="3" fill="url(#ci-bar)" />
      <rect x="106" y="142" width="14" height="32" rx="3" fill="url(#ci-bar)" />
      <rect x="128" y="152" width="14" height="22" rx="3" fill="url(#ci-bar)" />
      <rect x="150" y="146" width="14" height="28" rx="3" fill="url(#ci-bar)" />
      <rect x="172" y="138" width="14" height="36" rx="3" fill="url(#ci-bar)" />
      <rect x="194" y="148" width="14" height="26" rx="3" fill="url(#ci-bar)" />
      <rect x="216" y="144" width="14" height="30" rx="3" fill="url(#ci-bar)" />
      <rect x="238" y="154" width="14" height="20" rx="3" fill="url(#ci-bar)" />

      {/* Operator badge - the shield marks this as privileged access */}
      <g transform="translate(214, 168)">
        <circle cx="34" cy="34" r="34" fill="#0B3D73" />
        <circle cx="34" cy="34" r="34" fill="#FFFFFF" opacity="0.06" />
        <path
          d="M34 16 L48 22 V35 C48 44 41 50.5 34 53 C27 50.5 20 44 20 35 V22 Z"
          fill="#FFFFFF"
        />
        <path
          d="M27.5 34.5 L32 39 L41 29.5"
          fill="none"
          stroke="#0B3D73"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Tenant chips floating off the panel - many workspaces, one console */}
      <g opacity="0.95">
        <rect x="12" y="150" width="52" height="20" rx="10" fill="#FFFFFF" />
        <circle cx="24" cy="160" r="5" fill="#4E8BD6" />
        <rect x="33" y="157" width="22" height="6" rx="3" fill="#C3D5EC" />
      </g>
      <g opacity="0.95">
        <rect x="248" y="42" width="58" height="20" rx="10" fill="#FFFFFF" />
        <circle cx="260" cy="52" r="5" fill="#2FA36B" />
        <rect x="269" y="49" width="28" height="6" rx="3" fill="#C3D5EC" />
      </g>
    </svg>
  );
}
