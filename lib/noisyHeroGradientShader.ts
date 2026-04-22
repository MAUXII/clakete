/** Fullscreen clip-space quad (equivalente ao fullscreen.vert do editor). */
export const noisyHeroVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

/**
 * Ruído + FBM sem loop com `break` (incompatível em vários drivers → tela preta).
 * u_phase ∈ [0,1] periódico no JS (como no NoisyGradientCanvas original).
 */
export const noisyHeroFragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform vec2 u_resolution;
uniform float u_phase;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_amplitude;
uniform float u_scale;
uniform float u_threshold;
uniform float u_softness;
uniform float u_grain;
uniform vec2 u_seed;
uniform float u_monochrome;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.35));
  v += a * noise(p); p = rot * p * 2.02 + shift; a *= 0.5;
  v += a * noise(p); p = rot * p * 2.02 + shift; a *= 0.5;
  v += a * noise(p); p = rot * p * 2.02 + shift; a *= 0.5;
  v += a * noise(p);
  return v;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= aspect;

  float ang = u_phase * 6.28318530718;
  vec2 seed = u_seed * 0.0015;
  vec2 q = p * u_scale + seed + vec2(sin(ang * 0.7), cos(ang * 0.55)) * 0.12;

  vec2 warp = vec2(
    fbm4(q + vec2(0.0, ang * 0.25)),
    fbm4(q + vec2(7.3, ang * 0.2))
  );
  warp = (warp - 0.5) * 2.0 * u_amplitude * 0.42;

  vec2 r = p * u_scale + warp + seed + vec2(cos(ang * 0.35), sin(ang * 0.28)) * 0.1;
  float f = fbm4(r + vec2(ang * 0.08, -ang * 0.06));

  float m = smoothstep(u_threshold, u_threshold + max(u_softness, 0.0005), f);
  vec3 col = mix(u_colorB, u_colorA, m);

  if (u_monochrome > 0.5) {
    float g = dot(col, vec3(0.299, 0.587, 0.114));
    col = vec3(g);
  }

  float gr = hash(gl_FragCoord.xy * 0.37 + vec2(ang * 40.0, ang * 27.0)) - 0.5;
  col += gr * u_grain * 0.2;

  gl_FragColor = vec4(col, 1.0);
}
`
