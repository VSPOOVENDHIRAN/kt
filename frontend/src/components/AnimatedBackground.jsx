import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AnimatedBackground = () => {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        // Custom shader material - MetaMask-inspired organic flow
        const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;
      varying vec3 vPosition;

      // Smooth noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
        
        // Slow, organic time-based animation
        float t = uTime * 0.08;
        
        // Multiple layers of flowing noise
        float noise1 = snoise(vec2(p.x * 1.5 + t * 0.3, p.y * 1.5 + t * 0.2));
        float noise2 = snoise(vec2(p.x * 2.0 - t * 0.2, p.y * 2.0 + t * 0.25));
        float noise3 = snoise(vec2(p.x * 0.8 + t * 0.15, p.y * 0.8 - t * 0.1));
        
        // Combine noise layers for organic flow
        float combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
        
        // MetaMask-inspired color palette: deep purples, blues, and oranges
        vec3 color1 = vec3(0.4, 0.2, 0.8);  // Purple
        vec3 color2 = vec3(0.1, 0.3, 0.9);  // Blue
        vec3 color3 = vec3(0.9, 0.4, 0.2);  // Orange
        vec3 color4 = vec3(0.2, 0.1, 0.4);  // Dark purple
        
        // Create flowing gradient based on position and noise
        float mixFactor1 = smoothstep(-1.0, 1.0, combinedNoise + p.x * 0.5);
        float mixFactor2 = smoothstep(-1.0, 1.0, combinedNoise + p.y * 0.5);
        
        vec3 color = mix(color1, color2, mixFactor1);
        color = mix(color, color3, mixFactor2 * 0.3);
        color = mix(color, color4, (1.0 - length(p)) * 0.2);
        
        // Add subtle glow effect
        float glow = 1.0 - length(p) * 0.3;
        color += vec3(0.1, 0.05, 0.15) * glow;
        
        // Smooth vignette
        float vignette = smoothstep(1.5, 0.3, length(p));
        color *= vignette;
        
        // Reduce overall opacity for subtle background effect
        float alpha = 0.4 + combinedNoise * 0.1;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

        // Create shader material
        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            },
            transparent: true,
            depthWrite: false,
        });

        // Create fullscreen plane
        const geometry = new THREE.PlaneGeometry(20, 20);
        const mesh = new THREE.Mesh(geometry, shaderMaterial);
        scene.add(mesh);

        // Add floating particles for extra depth
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 100;
        const positions = new Float32Array(particlesCount * 3);
        const velocities = [];

        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

            velocities.push({
                x: (Math.random() - 0.5) * 0.002,
                y: (Math.random() - 0.5) * 0.002,
            });
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x6366f1,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // Animation loop
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update shader time uniform
            shaderMaterial.uniforms.uTime.value = elapsedTime;

            // Animate particles
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < particlesCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;

                // Wrap particles around
                if (positions[i * 3] > 10) positions[i * 3] = -10;
                if (positions[i * 3] < -10) positions[i * 3] = 10;
                if (positions[i * 3 + 1] > 10) positions[i * 3 + 1] = -10;
                if (positions[i * 3 + 1] < -10) positions[i * 3 + 1] = 10;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            shaderMaterial.uniforms.uResolution.value.set(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
            }}
        />
    );
};

export default AnimatedBackground;
