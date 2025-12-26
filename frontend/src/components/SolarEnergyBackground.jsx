import React, { useEffect, useRef } from 'react';

/**
 * Professional Solar Energy WebGL Background
 * Slow, organic movement - MetaMask-inspired
 * Non-distracting, enterprise-grade aesthetic
 */
const SolarEnergyBackground = () => {
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

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();

        // Vertex shader
        const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

        // Fragment shader - SLOW, ORGANIC, PROFESSIONAL
        const fragmentShaderSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;

      // Simplex noise
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

      // Fractal Brownian Motion - for organic patterns
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * snoise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
        
        // VERY SLOW time progression for calm, professional feel
        float t = uTime * 0.03;
        
        // Slow, gentle warping
        vec2 warp = vec2(
          fbm(p * 0.8 + vec2(t * 0.1, t * 0.08)),
          fbm(p * 0.8 + vec2(t * 0.08, -t * 0.1))
        );
        
        vec2 warpedP = p + warp * 0.15;
        
        // Gentle noise layers
        float noise1 = snoise(warpedP * 1.2 + vec2(t * 0.05, t * 0.04));
        float noise2 = snoise(warpedP * 0.6 - vec2(t * 0.03, t * 0.05));
        float noise3 = snoise(warpedP * 2.0 + vec2(sin(t * 0.02), cos(t * 0.02)));
        
        float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
        
        // SOLAR ENERGY + BLOCKCHAIN COLOR PALETTE
        // Dark professional base
        vec3 deepNavy = vec3(0.06, 0.09, 0.16);        // #0f172a
        vec3 darkGreen = vec3(0.02, 0.24, 0.18);       // Deep green
        vec3 energyGreen = vec3(0.06, 0.47, 0.31);     // Energy green
        vec3 solarYellow = vec3(0.45, 0.35, 0.08);     // Muted solar yellow
        vec3 blockchainBlue = vec3(0.12, 0.28, 0.48);  // Blockchain blue
        
        // SUBTLE color transitions
        float colorFlow1 = smoothstep(-0.6, 0.6, combinedNoise);
        float colorFlow2 = smoothstep(-0.4, 0.4, noise2);
        float colorFlow3 = smoothstep(-0.5, 0.5, noise3);
        
        // Professional color mixing - SUBTLE
        vec3 color = mix(deepNavy, darkGreen, colorFlow1 * 0.4);
        color = mix(color, energyGreen, colorFlow2 * 0.2);
        color = mix(color, blockchainBlue, colorFlow3 * 0.15);
        
        // Very subtle solar accent
        float solarAccent = smoothstep(0.3, 0.7, noise1) * 0.1;
        color = mix(color, solarYellow, solarAccent);
        
        // Gentle radial gradient for depth
        float distFromCenter = length(p);
        float vignette = smoothstep(2.0, 0.0, distFromCenter);
        color *= vignette * 0.7 + 0.3;
        
        // Very subtle animated glow
        float glow = (1.0 - distFromCenter * 0.2) * (0.5 + sin(t * 0.2) * 0.1);
        color += vec3(0.03, 0.06, 0.04) * glow * 0.3;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

        // Compile shader
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

        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        // Create fullscreen quad
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

        // Get uniform locations
        const uTimeLocation = gl.getUniformLocation(program, 'uTime');
        const uResolutionLocation = gl.getUniformLocation(program, 'uResolution');

        // Animation loop
        let startTime = Date.now();

        const animate = () => {
            const currentTime = (Date.now() - startTime) / 1000;

            gl.uniform1f(uTimeLocation, currentTime);
            gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);

            // Professional dark background
            gl.clearColor(0.06, 0.09, 0.16, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
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

export default SolarEnergyBackground;
