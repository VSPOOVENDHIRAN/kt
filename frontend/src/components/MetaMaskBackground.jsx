import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * MetaMask-Inspired WebGL Background with Three.js
 * Features flowing organic shapes with rotational movement
 */
const MetaMaskBackground = () => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Custom GLSL Shader Material for flowing organic shapes
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uTime;
            
            // 3D Noise function
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Create flowing wave displacement
                vec3 pos = position;
                float noise = snoise(vec3(pos.x * 0.5 + uTime * 0.2, pos.y * 0.5, uTime * 0.3));
                pos.z += noise * 0.3;
                
                // Add rotational movement
                float angle = uTime * 0.1;
                float s = sin(angle);
                float c = cos(angle);
                pos.xy = mat2(c, -s, s, c) * pos.xy;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uTime;
            uniform vec2 uResolution;
            
            // Simplex noise for fragment shader
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
                
                // Create flowing organic patterns
                float t = uTime * 0.15;
                
                // Multiple noise layers for depth
                float noise1 = snoise(uv * 3.0 + vec2(t * 0.5, t * 0.3));
                float noise2 = snoise(uv * 5.0 - vec2(t * 0.3, t * 0.5));
                float noise3 = snoise(uv * 2.0 + vec2(sin(t * 0.2), cos(t * 0.2)));
                
                // Combine noise
                float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
                
                // MetaMask-inspired color palette (vibrant, energetic)
                vec3 color1 = vec3(0.4, 0.2, 0.9);   // Deep purple
                vec3 color2 = vec3(0.2, 0.6, 1.0);   // Bright blue
                vec3 color3 = vec3(1.0, 0.4, 0.2);   // Orange accent
                vec3 color4 = vec3(0.6, 0.3, 0.95);  // Violet
                
                // Dynamic color mixing based on noise and position
                float mixFactor1 = smoothstep(-0.5, 0.5, combinedNoise);
                float mixFactor2 = smoothstep(-0.3, 0.7, noise2);
                
                vec3 finalColor = mix(color1, color2, mixFactor1);
                finalColor = mix(finalColor, color3, mixFactor2 * 0.3);
                finalColor = mix(finalColor, color4, noise3 * 0.2);
                
                // Add animated glow
                float glow = sin(t + length(uv - 0.5) * 3.0) * 0.5 + 0.5;
                finalColor += vec3(0.1, 0.05, 0.15) * glow * 0.3;
                
                // Add depth with gradient
                float radialGradient = 1.0 - length(uv - 0.5) * 0.8;
                finalColor *= radialGradient;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Create multiple flowing mesh objects
        const geometries = [
            new THREE.IcosahedronGeometry(2, 4),
            new THREE.TorusGeometry(1.5, 0.5, 32, 100),
            new THREE.OctahedronGeometry(1.8, 3)
        ];

        const meshes = [];

        geometries.forEach((geometry, index) => {
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                },
                side: THREE.DoubleSide,
                transparent: false
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Position meshes in 3D space
            mesh.position.x = (index - 1) * 3;
            mesh.position.z = -index * 2;

            scene.add(mesh);
            meshes.push(mesh);
        });

        // Add ambient lighting for depth
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);

        // Animation loop
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update shader uniforms
            meshes.forEach((mesh, index) => {
                mesh.material.uniforms.uTime.value = elapsedTime + index * 0.5;

                // Continuous rotation
                mesh.rotation.x = elapsedTime * 0.1 * (index + 1);
                mesh.rotation.y = elapsedTime * 0.15 * (index + 1);
                mesh.rotation.z = elapsedTime * 0.05 * (index + 1);

                // Floating movement
                mesh.position.y = Math.sin(elapsedTime * 0.3 + index) * 0.5;
            });

            // Camera movement for dynamic perspective
            camera.position.x = Math.sin(elapsedTime * 0.1) * 2;
            camera.position.y = Math.cos(elapsedTime * 0.15) * 1;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);

            meshes.forEach(mesh => {
                mesh.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
            });
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            meshes.forEach(mesh => {
                mesh.geometry.dispose();
                mesh.material.dispose();
            });

            renderer.dispose();
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0f0a1a 100%)',
            }}
        />
    );
};

export default MetaMaskBackground;
