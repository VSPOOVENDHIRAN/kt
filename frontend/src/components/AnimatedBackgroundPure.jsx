import React, { useEffect, useRef } from 'react';

/**
 * Pure WebGL Animated Background (No Three.js dependency)
 * MetaMask-inspired organic flowing animation
 */
const AnimatedBackgroundPure = () => {
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

    // Enhanced Fragment shader with MORE VISIBLE MOTION
    const fragmentShaderSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;

      // Simplex noise functions
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

      // Multi-octave noise for richer organic patterns
      float fbm(vec2 p, float time) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency + time * 0.3);
          frequency *= 2.2;
          amplitude *= 0.45;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
        
        // FASTER time for MORE VISIBLE MOTION
        float t = uTime * 0.25;
        
        // Create DRAMATIC flowing organic patterns with VISIBLE movement
        vec2 warp1 = vec2(
          fbm(p * 1.5 + vec2(t * 0.8, t * 0.6), t),
          fbm(p * 1.5 + vec2(t * 0.6, -t * 0.8), t)
        );
        
        vec2 warp2 = vec2(
          fbm(p * 1.2 + warp1 * 0.8 + vec2(-t * 0.5, t * 0.7), t * 1.3),
          fbm(p * 1.2 + warp1 * 0.8 + vec2(t * 0.7, t * 0.5), t * 1.3)
        );
        
        // Final warped position with MORE distortion
        vec2 warpedP = p + warp1 * 0.6 + warp2 * 0.4;
        
        // ROTATING motion
        float angle = t * 0.3;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        warpedP = rotation * warpedP;
        
        // Multiple noise layers with FASTER speeds
        float noise1 = snoise(warpedP * 2.0 + vec2(t * 0.9, t * 0.7));
        float noise2 = snoise(warpedP * 3.5 - vec2(t * 0.6, -t * 0.8));
        float noise3 = snoise(warpedP * 1.5 + vec2(-t * 0.5, t * 0.4));
        float noise4 = snoise(warpedP * 4.5 + vec2(t * 1.2, -t * 0.9));
        
        // Combine noise with different weights
        float combinedNoise = noise1 * 0.35 + noise2 * 0.3 + noise3 * 0.2 + noise4 * 0.15;
        
        // VIBRANT MetaMask-inspired colors (SOLID, NO TRANSPARENCY)
        vec3 deepPurple = vec3(0.25, 0.1, 0.45);      // Dark purple base
        vec3 vibrantBlue = vec3(0.1, 0.3, 0.7);       // Deep blue
        vec3 electricOrange = vec3(0.8, 0.35, 0.15);  // Orange accent
        vec3 richViolet = vec3(0.4, 0.15, 0.6);       // Violet
        vec3 neonPink = vec3(0.7, 0.2, 0.5);          // Pink accent
        
        // DYNAMIC color transitions with VISIBLE flow
        float colorFlow1 = smoothstep(-1.0, 1.0, combinedNoise + sin(t * 0.8 + p.x * 2.0) * 0.5);
        float colorFlow2 = smoothstep(-1.0, 1.0, combinedNoise + cos(t * 0.6 + p.y * 2.0) * 0.5);
        float colorFlow3 = smoothstep(-1.2, 1.2, noise3 + length(p) * 0.3);
        
        // Multi-layer color mixing with BOLD transitions
        vec3 color = mix(deepPurple, vibrantBlue, colorFlow1);
        color = mix(color, richViolet, colorFlow2 * 0.7);
        color = mix(color, electricOrange, colorFlow3 * 0.4);
        color = mix(color, neonPink, sin(t * 0.5 + noise4) * 0.3 + 0.3);
        
        // Add ANIMATED glow with VISIBLE pulsing
        float distFromCenter = length(p);
        float glow = (1.0 - distFromCenter * 0.3) * (0.6 + sin(t * 0.8) * 0.4);
        color += vec3(0.2, 0.1, 0.25) * glow * smoothstep(2.0, 0.0, distFromCenter);
        
        // Subtle vignette (not too dark)
        float vignette = smoothstep(2.2, 0.3, distFromCenter);
        color *= vignette * 0.85 + 0.15;
        
        // Add MOVING color shifts
        color += vec3(0.08, 0.03, 0.12) * sin(p.x * 3.0 + t * 0.7);
        color += vec3(0.03, 0.08, 0.15) * cos(p.y * 3.0 + t * 0.9);
        
        // SOLID output - NO TRANSPARENCY
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

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Animation loop
    let startTime = Date.now();

    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      gl.uniform1f(uTimeLocation, currentTime);
      gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);

      // Solid dark background
      gl.clearColor(0.04, 0.04, 0.1, 1.0);
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

export default AnimatedBackgroundPure;
