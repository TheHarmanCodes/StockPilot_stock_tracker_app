"use client";

import { useState, useEffect } from "react";

type TextAnimation = {
  word?: string;
};

export function TextReveal({ word }: TextAnimation) {
  const [reset, setReset] = useState(0);
  const WORD = word || "Animations";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReset(reset + 1);
  }, []);

  return (
    <div>
      <div key={reset}>
        <span className="h1">
          {WORD.split("").map((char, i) => (
            <span style={{ "--index": i }} key={i}>
              {char}
            </span>
          ))}
        </span>
      </div>

      <style jsx>{`
        .h1 {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.05em;
          animation: reveal 0.5s ease;
          overflow: hidden;
        }

        .h1 span {
          display: inline-block;
          opacity: 0;
          color: var(--foreground);
          animation: reveal 0.5s ease-in-out forwards;
          animation-delay: calc(0.02s * var(--index));
        }

        .button {
          margin-top: 20px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: black;
          color: white;
        }

        @keyframes reveal {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
