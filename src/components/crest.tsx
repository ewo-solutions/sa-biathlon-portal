// Placeholder crest — swap for the client's actual brand logo file when supplied.
export function Crest({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 210" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="white" strokeWidth="2" fill="none" opacity="0.9">
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={`l${i}`}
            d={`M14 ${60 + i * 14} Q34 ${58 + i * 14} 30 ${72 + i * 14}`}
            strokeLinecap="round"
          />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={`r${i}`}
            d={`M186 ${60 + i * 14} Q166 ${58 + i * 14} 170 ${72 + i * 14}`}
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx="100" cy="88" r="30" stroke="white" strokeWidth="2.5" />
      <circle cx="100" cy="128" r="30" stroke="white" strokeWidth="2.5" />
      <text
        x="100"
        y="114"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="900"
        fontFamily="var(--font-outfit), sans-serif"
      >
        SA
      </text>
      <text
        x="100"
        y="18"
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="800"
        letterSpacing="1.5"
        fontFamily="var(--font-outfit), sans-serif"
      >
        TWEEKAMP
      </text>
      <text
        x="100"
        y="200"
        textAnchor="middle"
        fill="white"
        fontSize="17"
        fontWeight="800"
        letterSpacing="1.5"
        fontFamily="var(--font-outfit), sans-serif"
      >
        BIATHLON
      </text>
    </svg>
  );
}
