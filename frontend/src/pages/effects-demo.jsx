import React, { useState, useEffect } from 'react';
import '../new-effects.css';

export default function NewEffectsDemo() {
    const [particles, setParticles] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [floatingParticles, setFloatingParticles] = useState([]);

    // Generate floating background particles
    useEffect(() => {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            particles.push({
                id: i,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 8}s`,
                duration: `${8 + Math.random() * 4}s`,
                floatX: `${(Math.random() - 0.5) * 200}px`,
                floatY: `-${100 + Math.random() * 20}vh`
            });
        }
        setFloatingParticles(particles);
    }, []);

    // Handle card click - create particle explosion
    const handleCardClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add ripple effect
        e.currentTarget.style.setProperty('--ripple-x', `${x}px`);
        e.currentTarget.style.setProperty('--ripple-y', `${y}px`);
        e.currentTarget.classList.add('ripple-active');
        setTimeout(() => e.currentTarget.classList.remove('ripple-active'), 600);

        // Create particle explosion
        const newParticles = [];
        const colors = ['#10b981', '#fbbf24', '#3b82f6', '#ec4899'];

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            const particleX = Math.cos(angle) * distance;
            const particleY = Math.sin(angle) * distance;

            newParticles.push({
                id: Date.now() + i,
                x: e.clientX,
                y: e.clientY,
                particleX,
                particleY,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        setParticles(prev => [...prev, ...newParticles]);

        // Remove particles after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 800);

        // Show success notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Floating Background Particles */}
            {floatingParticles.map(p => (
                <div
                    key={p.id}
                    className="floating-particle"
                    style={{
                        left: p.left,
                        '--delay': p.delay,
                        '--duration': p.duration,
                        '--float-x': p.floatX,
                        '--float-y': p.floatY
                    }}
                />
            ))}

            {/* Click Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.x,
                        top: p.y,
                        '--particle-x': `${p.particleX}px`,
                        '--particle-y': `${p.particleY}px`,
                        '--particle-color': p.color
                    }}
                />
            ))}

            {/* Success Notification */}
            {showNotification && (
                <div className="notification">
                    ✨ Particle Effect Triggered!
                </div>
            )}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: '3rem',
                    background: 'linear-gradient(135deg, #10b981, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem'
                }}>
                    🎨 NEW Effects Demo
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                    Click cards to see particle explosions!
                </p>
            </div>

            {/* Demo Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Card 1: Particle Explosion */}
                <div
                    className="energy-card page-enter"
                    onClick={handleCardClick}
                    style={{
                        padding: '2rem',
                        cursor: 'pointer',
                        animationDelay: '0ms'
                    }}
                >
                    <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>
                        💥 Particle Explosion
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        Click me to trigger particle explosion effect!
                    </p>
                </div>

                {/* Card 2: Flip Card */}
                <div className="flip-card page-enter" style={{ animationDelay: '100ms', height: '200px' }}>
                    <div className="flip-card-inner">
                        <div className="flip-card-front energy-card" style={{ padding: '2rem' }}>
                            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>
                                🔄 Flip Card
                            </h3>
                            <p style={{ color: '#94a3b8' }}>
                                Hover to flip!
                            </p>
                        </div>
                        <div className="flip-card-back">
                            <div>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</div>
                                <div>Back Side!</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Glow Pulse */}
                <div
                    className="energy-card glow-pulse page-enter"
                    style={{
                        padding: '2rem',
                        animationDelay: '200ms'
                    }}
                >
                    <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>
                        ✨ Glow Pulse
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        Continuous glow animation
                    </p>
                </div>

                {/* Card 4: Animated Border */}
                <div
                    className="energy-card animated-border page-enter"
                    style={{
                        padding: '2rem',
                        animationDelay: '300ms'
                    }}
                >
                    <h3 style={{ color: '#ec4899', marginBottom: '1rem' }}>
                        🌈 Gradient Border
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        Animated gradient border
                    </p>
                </div>

                {/* Card 5: Count Up */}
                <div
                    className="energy-card page-enter"
                    style={{
                        padding: '2rem',
                        animationDelay: '400ms'
                    }}
                >
                    <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>
                        🔢 Count Up
                    </h3>
                    <div className="count-up" style={{
                        fontSize: '3rem',
                        color: '#fbbf24',
                        fontWeight: 'bold'
                    }}>
                        1,234
                    </div>
                </div>

                {/* Card 6: Loading Spinner */}
                <div
                    className="energy-card page-enter"
                    style={{
                        padding: '2rem',
                        animationDelay: '500ms',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <h3 style={{ color: '#8b5cf6', marginBottom: '0' }}>
                        ⏳ Loading
                    </h3>
                    <div className="spinner" />
                </div>
            </div>

            {/* Bottom Info */}
            <div style={{
                marginTop: '3rem',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.9rem'
            }}>
                <p>✨ 12 new animation effects added!</p>
                <p>Particle explosions • Ripples • Page transitions • Flip cards • Glow pulse • And more!</p>
            </div>
        </div>
    );
}
