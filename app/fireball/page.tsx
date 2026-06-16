"use client";

export default function FireballPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

        .fireball-root {
          background: radial-gradient(ellipse at 50% 70%, #060614 0%, #000005 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Cinzel', serif;
          position: relative;
        }

        .fireball-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(120,160,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 60%, rgba(80,120,255,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 55% 15%, rgba(150,180,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 45%, rgba(100,140,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 80%, rgba(130,160,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 20% 85%, rgba(90,130,255,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 65% 70%, rgba(160,190,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 90%, rgba(110,150,255,0.3) 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        .fb-scene {
          position: relative;
          width: 320px;
          height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          z-index: 1;
        }

        .fb-glow-ground {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 40px;
          background: radial-gradient(ellipse, rgba(42,92,144,0.4) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(8px);
          animation: fb-pulse-ground 3s ease-in-out infinite alternate;
        }

        @keyframes fb-pulse-ground {
          0%   { opacity: 0.5; transform: translateX(-50%) scaleX(0.9); }
          100% { opacity: 0.9; transform: translateX(-50%) scaleX(1.1); }
        }

        .fb-halo {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(42,92,144,0.25) 0%, transparent 70%);
          filter: blur(24px);
          animation: fb-halo-pulse 2.3s ease-in-out infinite alternate;
          z-index: 0;
        }

        @keyframes fb-halo-pulse {
          0%   { transform: translateX(-50%) scale(0.9);  opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.15); opacity: 1; }
        }

        /* ── FIRE ── */
        .fb-fire {
          position: relative;
          width: 160px;
          height: 200px;
          transform: rotate(20deg);
        }

        .fb-flame {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-bottom-right-radius: 70%;
          border-bottom-left-radius: 70%;
          border-top-left-radius: 70%;
          transform: rotate(-45deg) skew(-10deg, -10deg);
          animation-iteration-count: infinite;
          animation-fill-mode: forwards;
        }

        .fb-flame-1 {
          background: radial-gradient(ellipse at 60% 80%, #1159B4 0%, #0d3f8a 50%, #08245a 100%);
          box-shadow: 0 0 40px 12px rgba(17,89,180,0.55), 0 0 80px 24px rgba(17,89,180,0.25);
          z-index: 1;
          animation-name: fb-burn-left;
          animation-duration: 300ms;
        }

        .fb-flame-2 {
          height: 80%;
          width: 80%;
          left: 10%;
          background: radial-gradient(ellipse at 60% 80%, #3381D2 0%, #1f64b8 50%, #1159B4 100%);
          box-shadow: 0 0 30px 8px rgba(51,129,210,0.5);
          z-index: 2;
          animation-name: fb-burn-right;
          animation-duration: 400ms;
        }

        .fb-flame-3 {
          height: 55%;
          width: 55%;
          left: 22%;
          background: radial-gradient(ellipse at 50% 70%, #6A9ED0 0%, #3381D2 40%, #1159B4 100%);
          box-shadow: 0 0 20px 6px rgba(106,158,208,0.55);
          z-index: 3;
          animation-name: fb-burn-left;
          animation-duration: 350ms;
        }

        .fb-flame-4-svg {
          position: absolute;
          bottom: 5%;
          left: 53%;
          transform: translateX(-50%) rotate(-20deg);
          width: 48%;
          height: auto;
          z-index: 4;
        }

        .fb-face-svg {
          position: absolute;
          bottom: 15%;
          left: 53%;
          transform: translateX(-50%) rotate(-20deg);
          width: 65%;
          height: auto;
          z-index: 5;
          pointer-events: none;
        }

        @keyframes fb-burn-left {
          0%,  100% { transform: rotate(-45deg) skew(-10deg, -10deg) scale(1);    }
          30%, 60%  { transform: rotate(-44deg) skew(-12deg, -12deg) scale(1.015); }
        }

        @keyframes fb-burn-right {
          0%,  100% { transform: rotate(-45deg) skew(-10deg, -10deg) scale(1);   }
          30%, 60%  { transform: rotate(-46deg) skew(-6deg,  -6deg)  scale(1.015); }
        }

        /* ── FACE ── */
        .fb-face {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 124px;
          height: 134px;
          z-index: 10;
          pointer-events: none;
        }

        /* ── SPARKS ── */
        .fb-spark {
          position: absolute;
          bottom: 46%;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background-color: rgba(80, 140, 255, 0.55);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .fb-spark:nth-child(1)  { left: 15%; animation-name: fb-fly-1; animation-duration: 6s;   animation-delay: 0.4s; }
        .fb-spark:nth-child(2)  { left: 30%; animation-name: fb-fly-2; animation-duration: 8.4s; animation-delay: 1s;   }
        .fb-spark:nth-child(3)  { left: 55%; animation-name: fb-fly-1; animation-duration: 8s;   animation-delay: 1.9s; width: 4px; height: 4px; background-color: rgba(140,190,255,0.6); }
        .fb-spark:nth-child(4)  { left: 80%; animation-name: fb-fly-2; animation-duration: 7s;   animation-delay: 2.6s; }
        .fb-spark:nth-child(5)  { left: 22%; animation-name: fb-fly-1; animation-duration: 7s;   animation-delay: 1.4s; width: 2px; height: 2px; background-color: rgba(200,220,255,0.7); }
        .fb-spark:nth-child(6)  { left: 61%; animation-name: fb-fly-2; animation-duration: 6s;   animation-delay: 3.2s; }
        .fb-spark:nth-child(7)  { left: 64%; animation-name: fb-fly-1; animation-duration: 5s;   animation-delay: 0.8s; }
        .fb-spark:nth-child(8)  { left: 19%; animation-name: fb-fly-2; animation-duration: 6s;   animation-delay: 5s;   width: 4px; height: 4px; background-color: rgba(120,170,255,0.5); }
        .fb-spark:nth-child(9)  { left: 22%; animation-name: fb-fly-1; animation-duration: 6.8s; animation-delay: 4s;   }
        .fb-spark:nth-child(10) { left: 61%; animation-name: fb-fly-2; animation-duration: 6s;   animation-delay: 5.2s; }
        .fb-spark:nth-child(11) { left: 81%; animation-name: fb-fly-1; animation-duration: 8s;   animation-delay: 3.5s; width: 2px; height: 2px; background-color: rgba(210,225,255,0.7); }
        .fb-spark:nth-child(12) { left: 85%; animation-name: fb-fly-2; animation-duration: 6s;   animation-delay: 2s;   }

        @keyframes fb-fly-1 {
          0%   { transform: translate(0, 0);        opacity: 1; }
          33%  { transform: translate(12px, -70px);              }
          66%  { transform: translate(0, -140px);   opacity: 0.6; }
          100% { transform: translate(6px, -210px); opacity: 0; }
        }

        @keyframes fb-fly-2 {
          0%   { transform: translate(0, 0);           opacity: 1; }
          50%  { transform: translate(-10px, -80px);               }
          80%  { transform: translate(-4px, -150px);   opacity: 0.6; }
          100% { transform: translate(-6px, -180px);   opacity: 0; }
        }

        /* SVG face color overrides */
        .fb-face .f-body  { fill: #1144cc; }
        .fb-face .f-glow  { fill: #4488ff; mix-blend-mode: screen; opacity: 0.85; }
        .fb-face .f-white { fill: #ffffff; }
        .fb-face .f-dark  { fill: #000e2a; }
        .fb-face .f-iso   { isolation: isolate; }
      `}</style>

      <div className="fireball-root">
        <div className="fb-scene">
          <div className="fb-glow-ground" />
          <div className="fb-halo" />

          <div className="fb-fire">
            {/* Outer animated flame layers */}
            <div className="fb-flame fb-flame-1" />
            <div className="fb-flame fb-flame-2" />
            <div className="fb-flame fb-flame-3" />
            <svg
              className="fb-flame-4-svg"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 304 341"
            >
              {/* Body shape */}
              <path fill="black" d="M64.0775 333.928C5.74746 307.588 -29.2425 189.308 32.5975 87.2476C63.7575 35.8176 140.517 -14.2524 210.537 3.73764C256.657 15.5876 289.077 63.6376 299.647 107.658C333.387 248.238 145.847 370.848 64.0775 333.928Z"/>
            </svg>

            {/* Face overlay — static */}
            <svg
              className="fb-face-svg"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 437 305"
              fill="none"
            >
              <path d="M6.90207 141.95C24.9321 100.89 73.4721 82.79 113.492 90.79C164.152 100.92 206.272 153.9 193.072 205.9C179.532 259.23 113.852 287.75 62.3221 267.01C14.7521 247.86 -13.9579 189.47 6.90207 141.95Z" fill="white"/>
              <path d="M243.552 177.12C254.582 145.8 290.602 129.62 318.872 127.38C361.802 123.98 414.492 150.56 421.192 197.01C428.362 246.73 379.272 294.37 330.242 293.65C272.272 292.79 226.882 224.51 243.562 177.12H243.552Z" fill="white"/>
              <path d="M192.922 277.46C194.902 270.62 199.932 267.38 203.712 267.17C209.442 266.84 215.972 273.27 216.082 283.64C216.202 294.75 208.912 304.84 202.442 304.19C194.792 303.42 189.922 287.82 192.922 277.46Z" fill="white"/>
              <path d="M164.172 74.7C153.312 76.8 143.232 77.74 133.902 77.74C126.722 77.74 119.992 77.18 113.672 76.16C64.2817 68.21 40.4117 32.12 31.5417 14.46C28.6217 8.66002 27.3217 4.85001 27.2617 4.67001L34.3717 2.34L41.4917 0C41.7117 0.66 42.9017 4.10002 45.3917 9.05002C53.6117 25.45 76.0317 58.48 124.292 62.38C135.252 63.27 147.552 62.65 161.322 59.99L164.172 74.7Z" fill="white"/>
              <path d="M436.782 69.6899C428.662 77.1999 420.602 83.3199 412.672 88.2499C406.572 92.0399 400.562 95.12 394.652 97.58C348.502 116.89 309.182 98.83 292.332 88.52C286.792 85.13 283.672 82.58 283.532 82.46L288.342 76.7299L293.152 70.9799C293.682 71.4199 296.512 73.72 301.232 76.61C316.872 86.2 353.342 102.43 396.392 80.27C406.172 75.24 416.292 68.22 426.582 58.7L436.762 69.6899H436.782Z" fill="white"/>
              <path d="M36.5724 175.33C39.6724 136.15 85.8724 104.13 119.162 117.39C146.832 128.41 160.822 168.84 147.512 199.98C137.032 224.5 108.472 246.02 78.4924 238.19C49.8024 230.7 34.6124 200.2 36.5824 175.33H36.5724Z" fill="black"/>
              <path d="M279.102 201.58C281.852 166.85 322.812 138.47 352.312 150.22C376.842 159.99 389.242 195.83 377.442 223.43C368.152 245.17 342.842 264.24 316.252 257.3C290.812 250.66 277.352 223.62 279.102 201.57V201.58Z" fill="black"/>
            </svg>

            {/* Floating sparks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="fb-spark" />
            ))}

          </div>
        </div>
      </div>
    </>
  );
}
