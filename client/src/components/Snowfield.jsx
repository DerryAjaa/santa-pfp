import React, { useMemo } from 'react';

const Snowfield = ({ density = 80 }) => {
  const flakes = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 8 + Math.random() * 6,
        delay: Math.random() * 8,
        drift: Math.random() * 30 - 15
      })),
    [density]
  );

  return (
    <div className="snowfield" aria-hidden>
      <style>
        {`
        @keyframes snow-fall {
          0% { transform: translate3d(0, -10%, 0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 110vh, 0); opacity: 0; }
        }
        .snowfield { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
        .snowflake {
          position: absolute;
          top: -10%;
          background: white;
          border-radius: 50%;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.5));
          animation-name: snow-fall;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          opacity: 0.75;
        }
      `}
      </style>
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.x}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            '--drift': `${flake.drift}px`
          }}
        />
      ))}
    </div>
  );
};

export default Snowfield;
