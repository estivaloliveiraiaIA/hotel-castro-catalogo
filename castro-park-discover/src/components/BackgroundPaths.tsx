import { CSSProperties } from "react";

interface PathDef {
  id: number;
  d: string;
  strokeWidth: number;
  duration: number;
  delay: number;
}

const PATHS: PathDef[] = [
  { id: 0,  d: "M-100 80  C150 -20  450 200 700 100  S1050 -30 1400 80",  strokeWidth: 0.6, duration: 18, delay: 0 },
  { id: 1,  d: "M-100 160 C100 40   350 280 650 180  S1000 60  1400 160", strokeWidth: 0.5, duration: 22, delay: -4 },
  { id: 2,  d: "M-100 240 C200 120  500 360 750 240  S1100 80  1400 240", strokeWidth: 0.7, duration: 16, delay: -8 },
  { id: 3,  d: "M-100 320 C250 200  550 440 800 300  S1150 140 1400 320", strokeWidth: 0.4, duration: 20, delay: -12 },
  { id: 4,  d: "M-100 400 C300 280  600 520 850 380  S1200 200 1400 400", strokeWidth: 0.5, duration: 24, delay: -2 },
  { id: 5,  d: "M-100 120 C120 20   400 220 680 140  S980  40  1400 120", strokeWidth: 0.3, duration: 26, delay: -6 },
  { id: 6,  d: "M-100 200 C180 80   480 300 720 200  S1020 80  1400 200", strokeWidth: 0.6, duration: 19, delay: -10 },
  { id: 7,  d: "M-100 280 C220 160  520 380 770 260  S1080 120 1400 280", strokeWidth: 0.4, duration: 21, delay: -14 },
  { id: 8,  d: "M-100 360 C280 240  580 460 820 340  S1140 160 1400 360", strokeWidth: 0.5, duration: 17, delay: -3 },
  { id: 9,  d: "M-100 440 C340 320  640 520 880 420  S1200 240 1400 440", strokeWidth: 0.3, duration: 23, delay: -7 },
  { id: 10, d: "M-100 60  C90  -40  390 180 660 60   S970  -60 1400 60",  strokeWidth: 0.4, duration: 28, delay: -11 },
  { id: 11, d: "M-100 480 C400 360  680 540 920 460  S1250 280 1400 480", strokeWidth: 0.6, duration: 15, delay: -5 },
];

export function BackgroundPaths() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg
        className="absolute inset-0 w-full h-full text-hotel-gold"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {PATHS.map((p) => (
          <path
            key={p.id}
            d={p.d}
            stroke="currentColor"
            strokeWidth={p.strokeWidth}
            style={
              {
                strokeDasharray: 2400,
                strokeDashoffset: 2400,
                animation: `bg-path-flow ${p.duration}s ${p.delay}s linear infinite`,
              } as CSSProperties
            }
          />
        ))}
      </svg>
      <style>{`
        @keyframes bg-path-flow {
          0%   { stroke-dashoffset: 2400; opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { stroke-dashoffset: -2400; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
