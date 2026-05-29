uniform float uTime;
uniform float uRadius;

varying float vDistance;

void main() {
  float d = distance(position, vec3(0.0));
  // Clamp so shapes larger than uRadius don't produce NaN sizes.
  float distanceFactor = pow(max(uRadius - d, 0.0), 1.5);

  // Gentle radial shimmer that keeps the shape recognizable (no full twist).
  vec3 dir = normalize(position + vec3(1e-4));
  vec3 particlePosition = position + dir * sin(uTime * 1.5 + d * 14.0) * 0.012;

  float size = distanceFactor * 12.0 + 6.0;

  vDistance = distanceFactor;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  gl_PointSize = size;
  // Size attenuation;
  gl_PointSize *= (1.0 / - viewPosition.z);
}
