// ===================================
// MOUSE-DRIVEN 3D TILT FOR CARDS
// MetaMask-style physical interaction
// ===================================

export function init3DCardTilt() {
    const cards = document.querySelectorAll('.energy-card');

    cards.forEach(card => {
        let isHovered = false;

        card.addEventListener('mouseenter', () => {
            isHovered = true;
            card.classList.add('tilt-active');
        });

        card.addEventListener('mouseleave', () => {
            isHovered = false;
            card.classList.remove('tilt-active');

            // Return to neutral with smooth transition
            card.style.transition = 'transform 300ms cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        });

        card.addEventListener('mousemove', (e) => {
            if (!isHovered) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation based on mouse position
            // Max tilt: 4 degrees
            const maxTilt = 4;
            const rotateY = ((x - centerX) / centerX) * maxTilt;
            const rotateX = ((y - centerY) / centerY) * -maxTilt;

            // Apply transform immediately (no transition for instant response)
            card.style.transition = 'none';
            card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(15px)
      `;
        });
    });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init3DCardTilt);
    } else {
        init3DCardTilt();
    }
}
