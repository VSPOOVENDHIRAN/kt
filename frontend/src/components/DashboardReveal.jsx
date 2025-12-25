import React, { useEffect, useState } from 'react';

const DashboardReveal = ({ children }) => {
    const [animationPhase, setAnimationPhase] = useState(0);
    const [animationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        // Trigger animation immediately on mount
        // NO scroll dependency

        // PHASE 1: Container activation (0-600ms)
        const phase1Timer = setTimeout(() => {
            setAnimationPhase(1);
        }, 100);

        // PHASE 2: Centrifugal burst (600-1800ms)
        const phase2Timer = setTimeout(() => {
            setAnimationPhase(2);
        }, 600);

        // PHASE 3: Complete (1800ms+)
        const completeTimer = setTimeout(() => {
            setAnimationComplete(true);
        }, 1800);

        return () => {
            clearTimeout(phase1Timer);
            clearTimeout(phase2Timer);
            clearTimeout(completeTimer);
        };
    }, []); // Run once on mount

    // Calculate progress based on phase
    const getProgress = () => {
        if (animationComplete) return 1;
        if (animationPhase === 0) return 0;
        if (animationPhase === 1) return 0.5; // Container rotation phase
        if (animationPhase === 2) return 1; // Burst phase
        return 0;
    };

    const progress = getProgress();

    // ================================================
    // ANIMATION PHASES
    // ================================================

    // PHASE 1: CONTAINER ROTATION (0.0 - 0.5)
    const rotationPhase = Math.min(progress / 0.5, 1);

    // PHASE 2: CENTRIFUGAL BURST (0.5 - 1.0)
    const scatterStart = 0.5;
    const scatterPhase = Math.max(0, Math.min(1,
        (progress - scatterStart) / (1 - scatterStart)
    ));

    // Container transformation
    const containerRotateX = -88 + (rotationPhase * 88);
    const tiltAmount = Math.sin(rotationPhase * Math.PI) * 8;
    const containerRotateY = tiltAmount;
    const containerScale = 0.6 + (rotationPhase * 0.4);
    const containerDepth = -350 + (rotationPhase * 350);
    const containerOpacity = Math.max(0, 1 - scatterPhase * 1.8);

    // Dashboard is always mounted (no conditional rendering)
    const dashboardMounted = true;

    // ================================================
    // CENTRIFUGAL BURST ANIMATION
    // ================================================
    const applyDashboardScatter = (element, index) => {
        if (!element || !element.props) return element;

        const totalPages = React.Children.count(children);

        // Calculate radial angle for each page
        const angleStep = (Math.PI * 2) / totalPages;
        const angle = index * angleStep;

        // PHASE 1: BURST (0.0 - 0.6)
        const burstPhase = Math.min(scatterPhase / 0.6, 1);
        const burstEasing = burstPhase < 0.5
            ? 2 * burstPhase * burstPhase
            : 1 - Math.pow(-2 * burstPhase + 2, 2) / 2;

        // PHASE 2: SETTLE (0.6 - 1.0)
        const settleStart = 0.6;
        const settlePhase = Math.max(0, (scatterPhase - settleStart) / (1 - settleStart));

        // Radial burst distance
        const maxBurstDistance = 150;
        const burstDistance = maxBurstDistance * burstEasing;

        // Calculate burst position
        const burstX = Math.cos(angle) * burstDistance;
        const burstY = Math.sin(angle) * burstDistance;

        // Final position
        const finalY = index * 100;
        const finalX = 0;

        // Interpolate from burst to final
        const currentX = burstX * (1 - settlePhase) + finalX * settlePhase;
        const currentY = burstY * (1 - settlePhase) + finalY * settlePhase;

        // Depth
        const maxDepth = 80;
        const currentDepth = maxDepth * burstEasing * (1 - settlePhase);

        // Rotation
        const maxRotation = 20;
        const currentRotation = (Math.cos(angle) * maxRotation) * (1 - settlePhase);

        // Scale
        const pageScale = 0.6 + (scatterPhase * 0.4);

        // Opacity
        const pageOpacity = Math.min(1, scatterPhase * 1.5);

        // Blur
        const pageBlur = (1 - scatterPhase) * 4;

        return (
            <div
                key={index}
                style={{
                    transform: animationComplete
                        ? 'none'
                        : `
                            translateX(${currentX}px)
                            translateY(${currentY}px)
                            translateZ(${currentDepth}px)
                            rotateZ(${currentRotation}deg)
                            scale(${pageScale})
                        `,
                    opacity: animationComplete ? 1 : pageOpacity,
                    filter: animationComplete ? 'none' : `blur(${pageBlur}px)`,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center',
                    transition: animationComplete
                        ? 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        : 'none',
                    willChange: animationComplete ? 'auto' : 'transform, opacity',
                    marginBottom: animationComplete ? '2rem' : '0',
                    position: 'relative',
                    zIndex: totalPages - index
                }}
            >
                {element}
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'relative',
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                perspective: '2400px',
                perspectiveOrigin: '50% 50%'
            }}
        >
            {/* Book/Card Container */}
            <div
                style={{
                    position: animationComplete ? 'relative' : 'relative',
                    width: '100%',
                    maxWidth: '1280px',
                    padding: '2rem',
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center',
                    transform: animationComplete
                        ? 'none'
                        : `
                            translateZ(${containerDepth}px)
                            rotateX(${containerRotateX}deg)
                            rotateY(${containerRotateY}deg)
                            scale(${containerScale})
                        `,
                    transition: animationComplete
                        ? 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        : 'none',

                    background: `
                        linear-gradient(
                            135deg,
                            rgba(30, 41, 59, ${0.8 * containerOpacity}) 0%,
                            rgba(30, 41, 59, ${0.7 * containerOpacity}) 50%,
                            rgba(30, 41, 59, ${0.8 * containerOpacity}) 100%
                        )
                    `,
                    backdropFilter: `blur(${24 * containerOpacity}px)`,
                    WebkitBackdropFilter: `blur(${24 * containerOpacity}px)`,
                    borderRadius: `${40 * containerOpacity}px`,
                    border: `${Math.max(1, containerOpacity * 2)}px solid rgba(16, 185, 129, ${0.3 * containerOpacity})`,

                    boxShadow: `
                        0 ${25 + rotationPhase * 45}px ${60 + rotationPhase * 90}px rgba(0, 0, 0, ${0.55 * containerOpacity}),
                        0 ${15 + rotationPhase * 25}px ${35 + rotationPhase * 50}px rgba(0, 0, 0, ${0.45 * containerOpacity}),
                        0 0 ${45 * containerOpacity}px rgba(16, 185, 129, ${0.2 * containerOpacity}),
                        inset 0 4px 0 rgba(255, 255, 255, ${0.09 * containerOpacity}),
                        inset 0 -6px 0 rgba(0, 0, 0, ${0.45 * containerOpacity})
                    `,

                    opacity: animationComplete ? 1 : Math.max(containerOpacity, 0.01),
                    pointerEvents: 'auto'
                }}
            >
                {/* Book spine */}
                {progress < 0.6 && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            height: '7px',
                            background: `linear-gradient(90deg, transparent, rgba(16, 185, 129, ${0.75 * (1 - rotationPhase)}), transparent)`,
                            borderRadius: '4px',
                            opacity: Math.max(0, 1 - progress / 0.6),
                            boxShadow: `0 0 16px rgba(16, 185, 129, ${0.55 * (1 - rotationPhase)})`
                        }}
                    />
                )}

                {/* Page layers */}
                {progress < 0.7 && (
                    <>
                        <div style={{
                            position: 'absolute', top: '9px', left: '9px', right: '9px', bottom: '9px',
                            background: 'rgba(30, 41, 59, 0.65)', borderRadius: '36px',
                            opacity: Math.max(0, 0.95 * (1 - progress / 0.7)),
                            pointerEvents: 'none', zIndex: -1,
                            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.55)'
                        }} />
                        <div style={{
                            position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px',
                            background: 'rgba(30, 41, 59, 0.55)', borderRadius: '37px',
                            opacity: Math.max(0, 0.75 * (1 - progress / 0.7)),
                            pointerEvents: 'none', zIndex: -1,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)'
                        }} />
                        <div style={{
                            position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px',
                            background: 'rgba(30, 41, 59, 0.45)', borderRadius: '38px',
                            opacity: Math.max(0, 0.55 * (1 - progress / 0.7)),
                            pointerEvents: 'none', zIndex: -1,
                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)'
                        }} />
                    </>
                )}

                {/* Dashboard Pages */}
                <div style={{ transformStyle: 'preserve-3d', position: 'relative' }}>
                    {dashboardMounted && React.Children.map(children, (child, index) =>
                        applyDashboardScatter(child, index)
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardReveal;
