import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Page Wrapper with Cinematic PPT-Style Morph Transitions
 * Objects fly in from depth and morph into place
 * NO horizontal sliding - only Z-axis depth motion
 */
const PageTransition = ({ children, className = '' }) => {
    const [isEntering, setIsEntering] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Trigger morph animation on route change
        setIsEntering(true);

        // Reset animation state after completion
        const timer = setTimeout(() => {
            setIsEntering(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className={`perspective-container ${isEntering ? 'morph-enter' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default PageTransition;
