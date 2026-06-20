const GREEN = '#c8ff3d';
const DARK = '#1a1a1a';
const MID = '#2a2a2a';

export function TeamHuddleIllustration() {
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" rx="16" fill={DARK} />
      <circle cx="200" cy="180" r="90" fill={MID} opacity="0.5" />
      {/* Simplified huddle of figures as overlapping circles/shapes */}
      <g>
        <circle cx="160" cy="160" r="28" fill={GREEN} opacity="0.9" />
        <rect x="142" y="185" width="36" height="55" rx="14" fill={GREEN} opacity="0.9" />
      </g>
      <g>
        <circle cx="210" cy="145" r="28" fill={GREEN} />
        <rect x="192" y="170" width="36" height="60" rx="14" fill={GREEN} />
      </g>
      <g>
        <circle cx="255" cy="165" r="28" fill={GREEN} opacity="0.75" />
        <rect x="237" y="190" width="36" height="55" rx="14" fill={GREEN} opacity="0.75" />
      </g>
      <g>
        <circle cx="185" cy="200" r="26" fill={GREEN} opacity="0.6" />
        <rect x="168" y="223" width="34" height="50" rx="13" fill={GREEN} opacity="0.6" />
      </g>
      <circle cx="200" cy="180" r="90" fill="none" stroke={GREEN} strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

export function ScheduleIllustration() {
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" rx="16" fill={DARK} />
      <rect x="80" y="100" width="240" height="200" rx="12" fill={MID} />
      <rect x="80" y="100" width="240" height="50" rx="12" fill={GREEN} />
      <rect x="80" y="140" width="240" height="10" fill={MID} />
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={100 + col * 44}
            y={170 + row * 30}
            width="32"
            height="20"
            rx="4"
            fill={(row + col) % 5 === 2 ? GREEN : MID}
            opacity={(row + col) % 5 === 2 ? 0.9 : 0.6}
          />
        ))
      )}
      <circle cx="115" cy="115" r="6" fill={DARK} />
      <circle cx="285" cy="115" r="6" fill={DARK} />
    </svg>
  );
}

export function TrophyIllustration() {
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" rx="16" fill={DARK} />
      <path
        d="M160 140 H240 V200 C240 230 220 250 200 250 C180 250 160 230 160 200 Z"
        fill={GREEN}
      />
      <path d="M160 150 C130 150 120 175 140 195 C148 203 158 205 165 200"
        fill="none" stroke={GREEN} strokeWidth="6" strokeLinecap="round" />
      <path d="M240 150 C270 150 280 175 260 195 C252 203 242 205 235 200"
        fill="none" stroke={GREEN} strokeWidth="6" strokeLinecap="round" />
      <rect x="190" y="250" width="20" height="30" fill={GREEN} />
      <rect x="165" y="280" width="70" height="14" rx="4" fill={GREEN} />
      <rect x="150" y="294" width="100" height="16" rx="4" fill={MID} />
    </svg>
  );
}