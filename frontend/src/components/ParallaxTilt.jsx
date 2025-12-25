import React, { useRef, useState } from 'react';

/**
 * ParallaxTilt Component
 * MetaMask-style mouse-driven 3D parallax tilt effect
 * 
 * Props:
 * - children: Content to render inside the tilt container
 * - maxTilt: Maximum tilt angle in degrees (default: 3 - reduced for premium feel)
 * - perspective: CSS perspective value (default: 1200 - increased for subtlety)
 * - scale: Scale on hover (default: 1.01 - very subtle)
 * - speed: Transition speed in ms (default: 300 - faster for responsiveness)
 * - className: Additional CSS classes
 */
export default function ParallaxTilt({
    children,
    maxTilt = 3,              // Reduced from 5 to 3 for subtlety
    perspective = 1200,       // Increased for flatter, more premium look
    scale = 1.01,             // Reduced from 1.02 to 1.01 for restraint
    speed = 300,              // Reduced from 400 to 300 for snappier feel
    className = '',
}) {
    const tiltRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [tiltStyle, setTiltStyle] = useState({});

    const handleMouseMove = (e) => {
        if (!tiltRef.current) return;

        const rect = tiltRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation based on mouse position
        // Normalize to -1 to 1 range
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        // Apply transform immediately with NO transition for instant response
        // This makes motion stop immediately when mouse stops
        setTiltStyle({
            transform: `
                perspective(${perspective}px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale3d(${isHovered ? scale : 1}, ${isHovered ? scale : 1}, ${isHovered ? scale : 1})
            `,
            // NO transition during mouse move - instant response
            transition: 'none',
        });
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Smooth scale-in on enter
        setTiltStyle({
            transform: `
                perspective(${perspective}px)
                rotateX(0deg)
                rotateY(0deg)
                scale3d(${scale}, ${scale}, ${scale})
            `,
            transition: `transform ${speed}ms cubic-bezier(0.23, 1, 0.32, 1)`,
        });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Smooth return to neutral with heavier easing
        setTiltStyle({
            transform: `
                perspective(${perspective}px)
                rotateX(0deg)
                rotateY(0deg)
                scale3d(1, 1, 1)
            `,
            // Heavier, more physical easing for return
            transition: `transform ${speed * 1.2}ms cubic-bezier(0.23, 1, 0.32, 1)`,
        });
    };

    return (
        <div
            ref={tiltRef}
            className={`parallax-tilt-container ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                ...tiltStyle,
            }}
        >
            {children}
        </div>
    );
}
