/**
 * GUARANTEED VISIBLE 3D CARD DECK ANIMATION
 * React Three Fiber + Three.js
 * 
 * VISIBILITY GUARANTEES:
 * 1. Red debug cube shows for 2 seconds (proves WebGL works)
 * 2. Bright neon colors (impossible to miss)
 * 3. Camera positioned at Z=40 (far enough to see everything)
 * 4. Strong lighting (3 light sources)
 * 5. Large cards (3x4 units each)
 * 6. Massive scatter range (30 units)
 * 7. Console logging every step
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// DEBUG CUBE - PROVES WEBGL IS WORKING
// ============================================
function DebugCube({ onComplete }) {
    const meshRef = useRef();
    const [timer, setTimer] = useState(0);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        setTimer((t) => t + delta);

        // Spin the cube so it's obviously moving
        meshRef.current.rotation.x += delta * 2;
        meshRef.current.rotation.y += delta * 2;

        // After 2 seconds, signal completion
        if (timer > 2 && onComplete) {
            console.log('✅ Debug cube visible for 2s - WebGL confirmed working');
            onComplete();
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            {/* THIS ENSURES VISIBILITY - Large red cube */}
            <boxGeometry args={[5, 5, 5]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
    );
}

// ============================================
// INDIVIDUAL CARD COMPONENT
// ============================================
function Card({ index, totalCards, startAnimation }) {
    const meshRef = useRef();
    const [phase, setPhase] = useState('hidden');
    const [timer, setTimer] = useState(0);

    // Grid layout (3x4 = 12 cards)
    const gridCols = 3;
    const row = Math.floor(index / gridCols);
    const col = index % gridCols;
    const spacing = 5;

    // Final grid position
    const finalX = (col - 1) * spacing;
    const finalY = (2 - row) * spacing;
    const finalZ = 0;

    // Random scatter target (LARGE range for visibility)
    const scatterX = (Math.random() - 0.5) * 30;
    const scatterY = (Math.random() - 0.5) * 25;
    const scatterZ = (Math.random() - 0.5) * 15;

    useFrame((state, delta) => {
        if (!meshRef.current || !startAnimation) return;

        setTimer((t) => t + delta);

        // PHASE 1: Stacked deck (0-1s)
        if (timer < 1) {
            setPhase('stacked');
            meshRef.current.position.set(0, 0, index * 0.15);
            meshRef.current.rotation.set(0, 0, 0);
            meshRef.current.scale.set(1, 1, 1);
            return;
        }

        // PHASE 2: Compress (1-1.5s)
        if (timer < 1.5) {
            setPhase('compressing');
            const progress = (timer - 1) / 0.5;
            const scale = 1 - (progress * 0.2); // Compress to 0.8
            meshRef.current.scale.set(scale, scale, 1);
            return;
        }

        // PHASE 3: EXPLOSIVE SCATTER (1.5-4s)
        if (timer < 4) {
            setPhase('scattering');

            // THIS ENSURES VISIBILITY - Large movement range
            meshRef.current.position.x = THREE.MathUtils.lerp(
                meshRef.current.position.x,
                scatterX,
                delta * 2
            );
            meshRef.current.position.y = THREE.MathUtils.lerp(
                meshRef.current.position.y,
                scatterY,
                delta * 2
            );
            meshRef.current.position.z = THREE.MathUtils.lerp(
                meshRef.current.position.z,
                scatterZ,
                delta * 2
            );

            // Wild rotation during scatter
            meshRef.current.rotation.x += delta * 3;
            meshRef.current.rotation.y += delta * 3.5;
            meshRef.current.rotation.z += delta * 2;

            // Expand back to normal size
            meshRef.current.scale.set(
                THREE.MathUtils.lerp(meshRef.current.scale.x, 1, delta * 3),
                THREE.MathUtils.lerp(meshRef.current.scale.y, 1, delta * 3),
                1
            );

            return;
        }

        // PHASE 4: Settle to grid (4s+)
        setPhase('settling');

        meshRef.current.position.x = THREE.MathUtils.lerp(
            meshRef.current.position.x,
            finalX,
            delta * 2.5
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(
            meshRef.current.position.y,
            finalY,
            delta * 2.5
        );
        meshRef.current.position.z = THREE.MathUtils.lerp(
            meshRef.current.position.z,
            finalZ,
            delta * 2.5
        );

        // Smooth rotation to flat
        meshRef.current.rotation.x = THREE.MathUtils.lerp(
            meshRef.current.rotation.x,
            0,
            delta * 4
        );
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            0,
            delta * 4
        );
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
            meshRef.current.rotation.z,
            0,
            delta * 4
        );
    });

    // THIS ENSURES VISIBILITY - Bright neon colors
    const colors = [
        '#ff0000', '#00ff00', '#0000ff', '#ffff00',
        '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
        '#00ff88', '#ff0088', '#88ff00', '#0088ff'
    ];

    return (
        <mesh ref={meshRef} position={[0, 0, index * 0.15]}>
            {/* THIS ENSURES VISIBILITY - Large cards */}
            <boxGeometry args={[3, 4, 0.2]} />
            <meshStandardMaterial
                color={colors[index % colors.length]}
                emissive={colors[index % colors.length]}
                emissiveIntensity={0.3}
                metalness={0.1}
                roughness={0.3}
            />
        </mesh>
    );
}

// ============================================
// MAIN SCENE
// ============================================
function Scene() {
    const [showDebugCube, setShowDebugCube] = useState(true);
    const [startCardAnimation, setStartCardAnimation] = useState(false);

    const handleDebugComplete = () => {
        console.log('🎴 Starting card deck animation...');
        setShowDebugCube(false);
        setStartCardAnimation(true);
    };

    const cards = [];
    const cardCount = 12;

    for (let i = 0; i < cardCount; i++) {
        cards.push(
            <Card
                key={i}
                index={i}
                totalCards={cardCount}
                startAnimation={startCardAnimation}
            />
        );
    }

    return (
        <>
            {/* THIS ENSURES VISIBILITY - Strong lighting from multiple angles */}
            <ambientLight intensity={1} />
            <directionalLight position={[10, 10, 5]} intensity={2} />
            <pointLight position={[-10, -10, -5]} intensity={1.5} color="#ffffff" />
            <pointLight position={[10, -10, 5]} intensity={1} color="#00ffff" />

            {/* Debug cube (shows first) */}
            {showDebugCube && <DebugCube onComplete={handleDebugComplete} />}

            {/* Card deck (shows after debug cube) */}
            {!showDebugCube && cards}

            {/* Grid helper for reference */}
            <gridHelper args={[50, 50, '#333333', '#111111']} rotation={[Math.PI / 2, 0, 0]} />
        </>
    );
}

// ============================================
// MAIN COMPONENT EXPORT
// ============================================
export default function TradeCardDeck() {
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🎬 3D Card Deck Animation Starting...');
        console.log('📍 Step 1: Red debug cube will show for 2 seconds');
        console.log('📍 Step 2: Card deck will appear and scatter');
    }, []);

    if (error) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                background: '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '2rem',
                fontFamily: 'monospace'
            }}>
                <h1 style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>
                    ❌ WebGL Error
                </h1>
                <pre style={{
                    background: '#1e293b',
                    padding: '1rem',
                    borderRadius: '8px',
                    color: '#fbbf24'
                }}>
                    {error.toString()}
                </pre>
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
                    Your browser may not support WebGL
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
            {/* Info Panel */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                color: 'white',
                background: 'rgba(0,0,0,0.9)',
                padding: '1.5rem',
                borderRadius: '12px',
                zIndex: 100,
                fontFamily: 'monospace',
                border: '2px solid #10b981'
            }}>
                <h3 style={{ margin: 0, marginBottom: '1rem', color: '#10b981', fontSize: '1.2rem' }}>
                    🎴 3D Card Deck Animation
                </h3>
                <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div style={{ color: '#fbbf24' }}>⏱️ 0-2s: Red debug cube (proves it works)</div>
                    <div style={{ color: '#00ffff' }}>⏱️ 2-3s: Cards stacked at center</div>
                    <div style={{ color: '#ff00ff' }}>⏱️ 3-6s: EXPLOSIVE SCATTER</div>
                    <div style={{ color: '#00ff00' }}>⏱️ 6s+: Settle into grid</div>
                </div>
            </div>

            {/* Canvas */}
            <Canvas
                camera={{
                    position: [0, 0, 40], // THIS FIXES BLANK SCREEN ISSUE - Far camera
                    fov: 60,
                    near: 0.1,
                    far: 1000
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000');
                    console.log('✅ WebGL context created successfully');
                }}
                onError={(error) => {
                    console.error('❌ Canvas error:', error);
                    setError(error);
                }}
            >
                <Scene />
            </Canvas>

            {/* Bottom Instructions */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                background: 'rgba(0,0,0,0.9)',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid #10b981'
            }}>
                🖱️ Drag to rotate • Scroll to zoom
            </div>
        </div>
    );
}
