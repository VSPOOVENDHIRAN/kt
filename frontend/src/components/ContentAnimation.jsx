import React from 'react';

/**
 * Content Animation Wrapper
 * For animating charts, cards, and content sections
 * MetaMask-quality subtle entry animations
 */
const ContentAnimation = ({
    children,
    type = 'enter', // 'enter', 'fade', 'slide-left', 'slide-right', 'scale'
    delay = 0,
    className = ''
}) => {
    const animationClass = {
        'enter': 'content-enter',
        'fade': 'content-fade',
        'slide-left': 'content-slide-left',
        'slide-right': 'content-slide-right',
        'scale': 'content-scale'
    }[type] || 'content-enter';

    const delayClass = delay > 0 ? `delay-${delay}` : '';

    return (
        <div className={`animate-on-mount ${animationClass} ${delayClass} ${className}`}>
            {children}
        </div>
    );
};

export default ContentAnimation;
