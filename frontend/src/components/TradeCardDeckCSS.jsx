import React, { useState, useEffect } from 'react';

/**
 * PURE CSS 3D CARD DECK SCATTER
 * NO THREE.JS REQUIRED - GUARANTEED TO WORK
 * Uses only CSS 3D transforms
 */

export default function TradeCardDeckCSS() {
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        console.log('🎴 CSS Card Deck Loading...');
        // Start animation after component mounts
        setTimeout(() => {
            console.log('🎬 Starting CSS animation...');
            setShowAnimation(true);
        }, 500);
    }, []);

    const cards = [];
    const cardCount = 12;

    // Generate 12 cards
    for (let i = 0; i < cardCount; i++) {
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
            '#00ff88', '#ff0088', '#88ff00', '#0088ff'
        ];

        cards.push(
            <div
                key={i}
                className={`css-card css-card-${i + 1} ${showAnimation ? 'animate' : ''}`}
                style={{
                    background: `linear-gradient(135deg, ${colors[i]}, ${colors[(i + 1) % colors.length]})`,
                    animationDelay: `${i * 0.1}s`
                }}
            >
                <div className="card-number">{i + 1}</div>
            </div>
        );
    }

    return (
        <div className="css-card-deck-container">
            {/* Info Panel */}
            <div className="css-info-panel">
                <h2>🎴 CSS 3D Card Deck</h2>
                <p>Pure CSS - No Three.js needed!</p>
                <div className="status">
                    {showAnimation ? '✅ Animation Running' : '⏳ Loading...'}
                </div>
            </div>

            {/* Card Deck Scene */}
            <div className="css-scene">
                <div className="css-deck">
                    {cards}
                </div>
            </div>

            {/* Inline Styles */}
            <style>{`
        .css-card-deck-container {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          overflow: hidden;
          position: relative;
        }

        .css-info-panel {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.9);
          padding: 1.5rem;
          border-radius: 12px;
          color: white;
          z-index: 1000;
          border: 2px solid #10b981;
        }

        .css-info-panel h2 {
          margin: 0 0 0.5rem 0;
          color: #10b981;
          font-size: 1.3rem;
        }

        .css-info-panel p {
          margin: 0 0 1rem 0;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .status {
          padding: 0.5rem 1rem;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid #10b981;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .css-scene {
          width: 100%;
          height: 100%;
          perspective: 1500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .css-deck {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .css-card {
          position: absolute;
          width: 200px;
          height: 280px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translateZ(0px);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          transform-style: preserve-3d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        /* Initial stacked state */
        .css-card-1 { transform: translate(-50%, -50%) translateZ(0px); }
        .css-card-2 { transform: translate(-50%, -50%) translateZ(10px); }
        .css-card-3 { transform: translate(-50%, -50%) translateZ(20px); }
        .css-card-4 { transform: translate(-50%, -50%) translateZ(30px); }
        .css-card-5 { transform: translate(-50%, -50%) translateZ(40px); }
        .css-card-6 { transform: translate(-50%, -50%) translateZ(50px); }
        .css-card-7 { transform: translate(-50%, -50%) translateZ(60px); }
        .css-card-8 { transform: translate(-50%, -50%) translateZ(70px); }
        .css-card-9 { transform: translate(-50%, -50%) translateZ(80px); }
        .css-card-10 { transform: translate(-50%, -50%) translateZ(90px); }
        .css-card-11 { transform: translate(-50%, -50%) translateZ(100px); }
        .css-card-12 { transform: translate(-50%, -50%) translateZ(110px); }

        /* Animated scatter state */
        .css-card.animate {
          animation: cardScatter 4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes cardScatter {
          0% {
            transform: translate(-50%, -50%) translateZ(var(--initial-z, 0px)) 
                       rotateX(0deg) rotateY(0deg) scale(1);
          }
          30% {
            transform: translate(-50%, -50%) translateZ(var(--initial-z, 0px)) 
                       rotateX(0deg) rotateY(0deg) scale(0.8);
          }
          70% {
            transform: translate(
                        calc(-50% + var(--scatter-x)), 
                        calc(-50% + var(--scatter-y))
                      ) 
                      translateZ(var(--scatter-z)) 
                      rotateX(var(--rotate-x)) 
                      rotateY(var(--rotate-y)) 
                      scale(0.9);
          }
          100% {
            transform: translate(
                        calc(-50% + var(--final-x)), 
                        calc(-50% + var(--final-y))
                      ) 
                      translateZ(0px) 
                      rotateX(0deg) 
                      rotateY(0deg) 
                      scale(1);
          }
        }

        /* Card-specific scatter positions */
        .css-card-1.animate {
          --initial-z: 0px;
          --scatter-x: -400px; --scatter-y: -300px; --scatter-z: 200px;
          --rotate-x: -45deg; --rotate-y: -30deg;
          --final-x: -320px; --final-y: -200px;
        }
        .css-card-2.animate {
          --initial-z: 10px;
          --scatter-x: 0px; --scatter-y: -350px; --scatter-z: 250px;
          --rotate-x: -50deg; --rotate-y: 0deg;
          --final-x: 0px; --final-y: -200px;
        }
        .css-card-3.animate {
          --initial-z: 20px;
          --scatter-x: 400px; --scatter-y: -300px; --scatter-z: 200px;
          --rotate-x: -45deg; --rotate-y: 30deg;
          --final-x: 320px; --final-y: -200px;
        }
        .css-card-4.animate {
          --initial-z: 30px;
          --scatter-x: -450px; --scatter-y: 0px; --scatter-z: 180px;
          --rotate-x: 0deg; --rotate-y: -40deg;
          --final-x: -320px; --final-y: 0px;
        }
        .css-card-5.animate {
          --initial-z: 40px;
          --scatter-x: 0px; --scatter-y: 0px; --scatter-z: 300px;
          --rotate-x: 0deg; --rotate-y: 0deg;
          --final-x: 0px; --final-y: 0px;
        }
        .css-card-6.animate {
          --initial-z: 50px;
          --scatter-x: 450px; --scatter-y: 0px; --scatter-z: 180px;
          --rotate-x: 0deg; --rotate-y: 40deg;
          --final-x: 320px; --final-y: 0px;
        }
        .css-card-7.animate {
          --initial-z: 60px;
          --scatter-x: -400px; --scatter-y: 300px; --scatter-z: 150px;
          --rotate-x: 45deg; --rotate-y: -30deg;
          --final-x: -320px; --final-y: 200px;
        }
        .css-card-8.animate {
          --initial-z: 70px;
          --scatter-x: 0px; --scatter-y: 350px; --scatter-z: 200px;
          --rotate-x: 50deg; --rotate-y: 0deg;
          --final-x: 0px; --final-y: 200px;
        }
        .css-card-9.animate {
          --initial-z: 80px;
          --scatter-x: 400px; --scatter-y: 300px; --scatter-z: 150px;
          --rotate-x: 45deg; --rotate-y: 30deg;
          --final-x: 320px; --final-y: 200px;
        }
        .css-card-10.animate {
          --initial-z: 90px;
          --scatter-x: -350px; --scatter-y: -150px; --scatter-z: 220px;
          --rotate-x: -30deg; --rotate-y: -25deg;
          --final-x: -160px; --final-y: -100px;
        }
        .css-card-11.animate {
          --initial-z: 100px;
          --scatter-x: 350px; --scatter-y: -150px; --scatter-z: 220px;
          --rotate-x: -30deg; --rotate-y: 25deg;
          --final-x: 160px; --final-y: -100px;
        }
        .css-card-12.animate {
          --initial-z: 110px;
          --scatter-x: 0px; --scatter-y: 150px; --scatter-z: 240px;
          --rotate-x: 35deg; --rotate-y: 0deg;
          --final-x: 0px; --final-y: 100px;
        }

        .card-number {
          font-family: 'Arial Black', sans-serif;
        }
      `}</style>
        </div>
    );
}
