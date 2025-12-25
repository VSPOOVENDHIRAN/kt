import React, { useEffect, useRef } from 'react';

/**
 * MetaMask-Quality Animation System
 * Calm, organic, shader-driven background motion
 * NO flashy effects - pure cinematic flow
 */
const MetaMaskAnimationSystem = () => {
    const canvasRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('WebGL not supported');
            return;
        }

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();

        // Vertex shader - simple fullscreen quad
        const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

        // Fragment shader - MetaMask-inspired organic flow
        const fragmentShaderSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;

      // Simplex noise implementation
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

      // Fractal Brownian Motion for organic patterns
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * snoise(p * frequency);
          frequency *= 2.1;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
        
        // SLOW, CALM time progression (MetaMask-style)
        float t = uTime * 0.08;
        
        // Create organic flowing distortion field
        vec2 warp1 = vec2(
          fbm(p * 1.2 + vec2(t * 0.3, t * 0.2)),
          fbm(p * 1.2 + vec2(t * 0.2, -t * 0.3))
        );
        
        vec2 warp2 = vec2(
          fbm(p * 0.8 + warp1 * 0.5 + vec2(-t * 0.15, t * 0.25)),
          fbm(p * 0.8 + warp1 * 0.5 + vec2(t * 0.25, t * 0.15))
        );
        
        // Final warped position - SUBTLE distortion
        vec2 warpedP = p + warp1 * 0.3 + warp2 * 0.2;
        
        // Very slow rotation
        float angle = t * 0.1;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        warpedP = rotation * warpedP;
        
        // Layered noise for depth
        float noise1 = snoise(warpedP * 1.5 + vec2(t * 0.4, t * 0.3));
        float noise2 = snoise(warpedP * 2.5 - vec2(t * 0.2, -t * 0.3));
        float noise3 = snoise(warpedP * 0.8 + vec2(-t * 0.15, t * 0.2));
        
        // Combine noise layers
        float combinedNoise = noise1 * 0.4 + noise2 * 0.35 + noise3 * 0.25;
        
        // Energy-themed color palette (dark, professional)
        vec3 deepNavy = vec3(0.06, 0.09, 0.16);        // Base dark
        vec3 darkTeal = vec3(0.08, 0.18, 0.2);         // Teal accent
        vec3 energyGreen = vec3(0.06, 0.28, 0.2);      // Green energy
        vec3 solarOrange = vec3(0.25, 0.15, 0.08);     // Solar warmth
        
        // SLOW, SMOOTH color transitions
        float colorFlow1 = smoothstep(-0.8, 0.8, combinedNoise + sin(t * 0.3 + p.x) * 0.3);
        float colorFlow2 = smoothstep(-0.8, 0.8, combinedNoise + cos(t * 0.25 + p.y) * 0.3);
        float colorFlow3 = smoothstep(-1.0, 1.0, noise3 + length(p) * 0.2);
        
        // Gradual color blending
        vec3 color = mix(deepNavy, darkTeal, colorFlow1 * 0.6);
        color = mix(color, energyGreen, colorFlow2 * 0.4);
        color = mix(color, solarOrange, colorFlow3 * 0.25);
        
        // Subtle ambient glow (no pulsing)
        float distFromCenter = length(p);
        float ambientGlow = (1.0 - distFromCenter * 0.4) * 0.3;
        color += vec3(0.04, 0.06, 0.05) * ambientGlow * smoothstep(2.0, 0.0, distFromCenter);
        
        // Gentle vignette
        float vignette = smoothstep(2.5, 0.5, distFromCenter);
        color *= vignette * 0.9 + 0.1;
        
        // Very subtle color shifts (barely noticeable)
        color += vec3(0.02, 0.01, 0.03) * sin(p.x * 2.0 + t * 0.2);
        color += vec3(0.01, 0.02, 0.03) * cos(p.y * 2.0 + t * 0.15);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

        // Compile shader helper
        const compileShader = (source, type) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) return;

        // Create and link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        // Fullscreen quad
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Uniform locations
        const uTimeLocation = gl.getUniformLocation(program, 'uTime');
        const uResolutionLocation = gl.getUniformLocation(program, 'uResolution');

        // Animation loop
        let startTime = Date.now();

        const animate = () => {
            const currentTime = (Date.now() - startTime) / 1000;

            gl.uniform1f(uTimeLocation, currentTime);
            gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);

            gl.clearColor(0.06, 0.09, 0.16, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Event listeners
        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(buffer);
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

export default MetaMaskAnimationSystem;
