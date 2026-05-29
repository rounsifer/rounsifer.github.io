uniform float uTime;
uniform float uRadius;
uniform float uAnim; // 0 none, 1 swarm, 2 filter, 3 graph
uniform float uAnimTime; // rest-local time for the shape animation

attribute vec3 aSeed; // per-particle phase seed (swarm jitter)
attribute vec4 aFlow; // graph: edge vector (xyz) + start phase (w)

varying float vDistance;

void main() {
  vec3 pos = position;

  // Per-shape animation, computed on the GPU (no per-frame CPU upload).
  if (uAnim > 0.5 && uAnim < 1.5) {
    // Drone swarm: coherent group drift + per-agent jitter.
    vec3 drift = vec3(
      sin(uAnimTime * 0.6) * 0.05,
      sin(uAnimTime * 0.5 + 1.3) * 0.04,
      cos(uAnimTime * 0.45) * 0.05
    );
    pos += drift + vec3(
      sin(uAnimTime * 1.4 + aSeed.x),
      sin(uAnimTime * 1.7 + aSeed.y),
      sin(uAnimTime * 1.2 + aSeed.z)
    ) * 0.025;
  } else if (uAnim > 1.5 && uAnim < 2.5) {
    // Particle filter: converge/resample pulse toward the estimate.
    pos *= 1.0 - max(0.0, sin(uAnimTime * 0.5)) * 0.5;
  } else if (uAnim > 2.5) {
    // Network graph: slide packets along their edge (fract wraps the loop).
    pos += aFlow.xyz * (fract(aFlow.w + uAnimTime * 0.18) - aFlow.w);
  }

  float d = distance(pos, vec3(0.0));
  // Clamp so shapes larger than uRadius don't produce NaN sizes.
  float distanceFactor = pow(max(uRadius - d, 0.0), 1.5);

  // Gentle radial shimmer that keeps the shape recognizable.
  vec3 dir = normalize(pos + vec3(1e-4));
  vec3 particlePosition = pos + dir * sin(uTime * 1.5 + d * 14.0) * 0.012;

  float size = distanceFactor * 12.0 + 7.0;

  vDistance = distanceFactor;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  gl_PointSize = size;
  // Size attenuation;
  gl_PointSize *= (1.0 / - viewPosition.z);
}
