import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// 3D Scene Demo Component
export const ThreeDSceneDemo = () => {
  interface Point3D {
    x: number;
    y: number;
    z: number;
  }

  interface Shape {
    id: number;
    type: 'cube' | 'pyramid' | 'sphere';
    position: Point3D;
    rotation: Point3D;
    scale: number;
    color: string;
  }

  // State
  const shapes = createState<Shape[]>([
    {
      id: 1,
      type: 'cube',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 100,
      color: '#3b82f6'
    }
  ]);
  const selectedShapeId = createState<number | null>(1);
  const autoRotate = createState(true);
  const cameraDistance = createState(500);
  const cameraAngleX = createState(20);
  const cameraAngleY = createState(45);
  const showWireframe = createState(false);
  const lightAngle = createState(45);

  let nextShapeId = 2;
  let canvasRef: HTMLCanvasElement | null = null;

  // Computed selected shape
  const selectedShape = computed([shapes, selectedShapeId], (shapeList, id) => {
    return shapeList.find(s => s.id === id) || null;
  });

  // 3D projection functions
  const project = (point: Point3D, cameraAngleX: number, cameraAngleY: number, distance: number): { x: number, y: number, scale: number } => {
    const canvas = canvasRef;
    if (!canvas) return { x: 0, y: 0, scale: 1 };

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Rotate around Y axis
    const cosY = Math.cos((cameraAngleY * Math.PI) / 180);
    const sinY = Math.sin((cameraAngleY * Math.PI) / 180);
    const x1 = point.x * cosY - point.z * sinY;
    const z1 = point.x * sinY + point.z * cosY;

    // Rotate around X axis
    const cosX = Math.cos((cameraAngleX * Math.PI) / 180);
    const sinX = Math.sin((cameraAngleX * Math.PI) / 180);
    const y1 = point.y * cosX - z1 * sinX;
    const z2 = point.y * sinX + z1 * cosX;

    // Perspective projection
    const scale = distance / (distance + z2);
    const x2 = x1 * scale + centerX;
    const y2 = y1 * scale + centerY;

    return { x: x2, y: y2, scale };
  };

  // Draw cube
  const drawCube = (ctx: CanvasRenderingContext2D, shape: Shape, camX: number, camY: number, dist: number) => {
    const s = shape.scale / 2;
    const pos = shape.position;
    const rot = shape.rotation;

    // Define cube vertices
    const vertices: Point3D[] = [
      { x: -s, y: -s, z: -s },
      { x: s, y: -s, z: -s },
      { x: s, y: s, z: -s },
      { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s },
      { x: s, y: -s, z: s },
      { x: s, y: s, z: s },
      { x: -s, y: s, z: s }
    ];

    // Apply rotation and position
    const rotatedVertices = vertices.map(v => {
      // Rotate around X
      let y = v.y * Math.cos(rot.x * Math.PI / 180) - v.z * Math.sin(rot.x * Math.PI / 180);
      let z = v.y * Math.sin(rot.x * Math.PI / 180) + v.z * Math.cos(rot.x * Math.PI / 180);

      // Rotate around Y
      let x = v.x * Math.cos(rot.y * Math.PI / 180) - z * Math.sin(rot.y * Math.PI / 180);
      z = v.x * Math.sin(rot.y * Math.PI / 180) + z * Math.cos(rot.y * Math.PI / 180);

      // Rotate around Z
      const x2 = x * Math.cos(rot.z * Math.PI / 180) - y * Math.sin(rot.z * Math.PI / 180);
      y = x * Math.sin(rot.z * Math.PI / 180) + y * Math.cos(rot.z * Math.PI / 180);

      return {
        x: x2 + pos.x,
        y: y + pos.y,
        z: z + pos.z
      };
    });

    // Project vertices
    const projectedVertices = rotatedVertices.map(v => project(v, camX, camY, dist));

    // Define faces with normals for lighting
    const faces = [
      { vertices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 } }, // front
      { vertices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 } },  // back
      { vertices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 } }, // bottom
      { vertices: [2, 3, 7, 6], normal: { x: 0, y: 1, z: 0 } },  // top
      { vertices: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 } }, // left
      { vertices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } }   // right
    ];

    // Calculate lighting
    const lightDir = {
      x: Math.cos(lightAngle.value * Math.PI / 180),
      y: -0.5,
      z: Math.sin(lightAngle.value * Math.PI / 180)
    };
    const lightMag = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
    lightDir.x /= lightMag;
    lightDir.y /= lightMag;
    lightDir.z /= lightMag;

    // Sort faces by average Z for painter's algorithm
    const facesWithZ = faces.map(face => {
      const avgZ = face.vertices.reduce((sum, i) => sum + rotatedVertices[i].z, 0) / face.vertices.length;
      return { ...face, avgZ };
    });
    facesWithZ.sort((a, b) => a.avgZ - b.avgZ);

    // Draw faces
    facesWithZ.forEach(face => {
      // Calculate lighting
      const dotProduct = face.normal.x * lightDir.x + face.normal.y * lightDir.y + face.normal.z * lightDir.z;
      const brightness = Math.max(0.2, Math.min(1, (dotProduct + 1) / 2));

      const color = shape.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      ctx.fillStyle = `rgb(${r * brightness}, ${g * brightness}, ${b * brightness})`;
      ctx.strokeStyle = showWireframe.value ? '#ffffff' : ctx.fillStyle;
      ctx.lineWidth = 2;

      ctx.beginPath();
      face.vertices.forEach((vertexIndex, i) => {
        const p = projectedVertices[vertexIndex];
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      if (showWireframe.value) {
        ctx.stroke();
      }
    });
  };

  // Draw pyramid
  const drawPyramid = (ctx: CanvasRenderingContext2D, shape: Shape, camX: number, camY: number, dist: number) => {
    const s = shape.scale / 2;
    const pos = shape.position;
    const rot = shape.rotation;

    const vertices: Point3D[] = [
      { x: 0, y: -s, z: 0 },    // top
      { x: -s, y: s, z: -s },   // base 1
      { x: s, y: s, z: -s },    // base 2
      { x: s, y: s, z: s },     // base 3
      { x: -s, y: s, z: s }     // base 4
    ];

    // Apply rotation and position
    const rotatedVertices = vertices.map(v => {
      let y = v.y * Math.cos(rot.x * Math.PI / 180) - v.z * Math.sin(rot.x * Math.PI / 180);
      let z = v.y * Math.sin(rot.x * Math.PI / 180) + v.z * Math.cos(rot.x * Math.PI / 180);
      let x = v.x * Math.cos(rot.y * Math.PI / 180) - z * Math.sin(rot.y * Math.PI / 180);
      z = v.x * Math.sin(rot.y * Math.PI / 180) + z * Math.cos(rot.y * Math.PI / 180);
      const x2 = x * Math.cos(rot.z * Math.PI / 180) - y * Math.sin(rot.z * Math.PI / 180);
      y = x * Math.sin(rot.z * Math.PI / 180) + y * Math.cos(rot.z * Math.PI / 180);

      return { x: x2 + pos.x, y: y + pos.y, z: z + pos.z };
    });

    const projectedVertices = rotatedVertices.map(v => project(v, camX, camY, dist));

    const faces = [
      { vertices: [0, 1, 2], normal: { x: 0, y: -1, z: -1 } },
      { vertices: [0, 2, 3], normal: { x: 1, y: -1, z: 0 } },
      { vertices: [0, 3, 4], normal: { x: 0, y: -1, z: 1 } },
      { vertices: [0, 4, 1], normal: { x: -1, y: -1, z: 0 } },
      { vertices: [1, 2, 3, 4], normal: { x: 0, y: 1, z: 0 } }
    ];

    const lightDir = {
      x: Math.cos(lightAngle.value * Math.PI / 180),
      y: -0.5,
      z: Math.sin(lightAngle.value * Math.PI / 180)
    };
    const lightMag = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
    lightDir.x /= lightMag;
    lightDir.y /= lightMag;
    lightDir.z /= lightMag;

    const facesWithZ = faces.map(face => {
      const avgZ = face.vertices.reduce((sum, i) => sum + rotatedVertices[i].z, 0) / face.vertices.length;
      return { ...face, avgZ };
    });
    facesWithZ.sort((a, b) => a.avgZ - b.avgZ);

    facesWithZ.forEach(face => {
      const dotProduct = face.normal.x * lightDir.x + face.normal.y * lightDir.y + face.normal.z * lightDir.z;
      const brightness = Math.max(0.2, Math.min(1, (dotProduct + 1) / 2));

      const color = shape.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      ctx.fillStyle = `rgb(${r * brightness}, ${g * brightness}, ${b * brightness})`;
      ctx.strokeStyle = showWireframe.value ? '#ffffff' : ctx.fillStyle;
      ctx.lineWidth = 2;

      ctx.beginPath();
      face.vertices.forEach((vertexIndex, i) => {
        const p = projectedVertices[vertexIndex];
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      if (showWireframe.value) {
        ctx.stroke();
      }
    });
  };

  // Draw sphere
  const drawSphere = (ctx: CanvasRenderingContext2D, shape: Shape, camX: number, camY: number, dist: number) => {
    const radius = shape.scale / 2;
    const pos = shape.position;
    const segments = 16;
    const rings = 12;

    const vertices: Point3D[] = [];
    for (let ring = 0; ring <= rings; ring++) {
      const theta = (ring * Math.PI) / rings;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let seg = 0; seg <= segments; seg++) {
        const phi = (seg * 2 * Math.PI) / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        vertices.push({
          x: x * radius + pos.x,
          y: y * radius + pos.y,
          z: z * radius + pos.z
        });
      }
    }

    const projectedVertices = vertices.map(v => project(v, camX, camY, dist));

    // Draw wireframe or filled
    if (showWireframe.value) {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 1;

      // Draw latitude lines
      for (let ring = 0; ring < rings; ring++) {
        ctx.beginPath();
        for (let seg = 0; seg <= segments; seg++) {
          const i = ring * (segments + 1) + seg;
          const p = projectedVertices[i];
          if (seg === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // Draw longitude lines
      for (let seg = 0; seg < segments; seg++) {
        ctx.beginPath();
        for (let ring = 0; ring <= rings; ring++) {
          const i = ring * (segments + 1) + seg;
          const p = projectedVertices[i];
          if (ring === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
    } else {
      // Draw filled sphere with simple shading
      const gradient = ctx.createRadialGradient(
        projectedVertices[0].x,
        projectedVertices[0].y,
        0,
        projectedVertices[0].x,
        projectedVertices[0].y,
        radius * projectedVertices[0].scale
      );

      const color = shape.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      gradient.addColorStop(0, `rgb(${r * 1.2}, ${g * 1.2}, ${b * 1.2})`);
      gradient.addColorStop(1, `rgb(${r * 0.4}, ${g * 0.4}, ${b * 0.4})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        projectedVertices[0].x,
        projectedVertices[0].y,
        radius * projectedVertices[0].scale,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Render scene
  const render = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const gridRange = 400;

    for (let x = -gridRange; x <= gridRange; x += gridSize) {
      const p1 = project({ x, y: 0, z: -gridRange }, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      const p2 = project({ x, y: 0, z: gridRange }, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let z = -gridRange; z <= gridRange; z += gridSize) {
      const p1 = project({ x: -gridRange, y: 0, z }, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      const p2 = project({ x: gridRange, y: 0, z }, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Sort shapes by Z distance for proper rendering
    const sortedShapes = [...shapes.value].sort((a, b) => a.position.z - b.position.z);

    // Draw shapes
    sortedShapes.forEach(shape => {
      if (shape.type === 'cube') {
        drawCube(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      } else if (shape.type === 'pyramid') {
        drawPyramid(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      } else if (shape.type === 'sphere') {
        drawSphere(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
      }
    });

    // Auto rotate
    if (autoRotate.value) {
      shapes.value = shapes.value.map(shape => ({
        ...shape,
        rotation: {
          x: shape.rotation.x + 0.5,
          y: shape.rotation.y + 1,
          z: shape.rotation.z + 0.3
        }
      }));
    }

    requestAnimationFrame(render);
  };

  // Add shape
  const addShape = (type: 'cube' | 'pyramid' | 'sphere') => {
    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
    shapes.value = [
      ...shapes.value,
      {
        id: nextShapeId++,
        type,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      }
    ];
    selectedShapeId.value = nextShapeId - 1;
  };

  // Delete shape
  const deleteShape = (id: number) => {
    shapes.value = shapes.value.filter(s => s.id !== id);
    if (selectedShapeId.value === id) {
      selectedShapeId.value = shapes.value.length > 0 ? shapes.value[0].id : null;
    }
  };

  // Update shape property
  const updateShapeProperty = (property: 'position' | 'rotation' | 'scale' | 'color', axis: 'x' | 'y' | 'z' | null, value: number | string) => {
    const selected = selectedShape.value;
    if (!selected) return;

    shapes.value = shapes.value.map(shape => {
      if (shape.id === selected.id) {
        if (property === 'scale' || property === 'color') {
          return { ...shape, [property]: value };
        } else if (axis) {
          return {
            ...shape,
            [property]: {
              ...shape[property],
              [axis]: value
            }
          };
        }
      }
      return shape;
    });
  };

  return div(
    // Canvas
    div({ style: 'margin-bottom: 1.5rem; border-radius: 12px; overflow: hidden; border: 2px solid var(--border);' },
      div({
        ref: (el: HTMLElement | SVGElement) => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 500;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvasRef = canvas;
          el.appendChild(canvas);
          render();
        },
        style: 'background: #1a1a2e;'
      })
    ),

    // Controls
    div({ style: 'display: grid; gap: 1.5rem;' },
      // Add shapes
      div(
        div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);' }, '➕ Add Shape'),
        div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
          button({
            onclick: () => addShape('cube'),
            style: `
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              border: 2px solid var(--border);
              background: var(--bg-card);
              color: var(--text-primary);
              cursor: pointer;
              font-weight: 600;
              font-size: 0.875rem;
              transition: all 0.2s;
            `
          }, '🔲 Cube'),
          button({
            onclick: () => addShape('pyramid'),
            style: `
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              border: 2px solid var(--border);
              background: var(--bg-card);
              color: var(--text-primary);
              cursor: pointer;
              font-weight: 600;
              font-size: 0.875rem;
              transition: all 0.2s;
            `
          }, '🔺 Pyramid'),
          button({
            onclick: () => addShape('sphere'),
            style: `
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              border: 2px solid var(--border);
              background: var(--bg-card);
              color: var(--text-primary);
              cursor: pointer;
              font-weight: 600;
              font-size: 0.875rem;
              transition: all 0.2s;
            `
          }, '⚪ Sphere')
        )
      ),

      // Shape list
      reactive(selectedShapeId, (selected) =>
        div(
          div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);' }, '📦 Shapes'),
          div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
            ...shapes.value.map(shape =>
              div({
                style: `
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  padding: 0.5rem 1rem;
                  border-radius: 8px;
                  border: 2px solid ${selected === shape.id ? 'var(--primary)' : 'var(--border)'};
                  background: ${selected === shape.id ? 'var(--primary)' : 'var(--bg-card)'};
                  color: ${selected === shape.id ? 'white' : 'var(--text-primary)'};
                  cursor: pointer;
                  font-size: 0.875rem;
                  font-weight: 600;
                  transition: all 0.2s;
                `,
                onclick: () => { selectedShapeId.value = shape.id; }
              },
                span(shape.type === 'cube' ? '🔲' : shape.type === 'pyramid' ? '🔺' : '⚪'),
                span(shape.type),
                button({
                  onclick: (e: Event) => {
                    e.stopPropagation();
                    deleteShape(shape.id);
                  },
                  style: `
                    background: none;
                    border: none;
                    color: ${selected === shape.id ? 'white' : '#ef4444'};
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 0;
                    margin-left: 0.25rem;
                  `
                }, '×')
              )
            )
          )
        )
      ),

      // Camera controls
      div(
        div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);' }, '📷 Camera'),
        div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;' },
          div(
            div({ style: 'font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Distance'),
            reactive(cameraDistance, (dist) =>
              div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                div({
                  ref: (el: HTMLElement | SVGElement) => {
                    const input = document.createElement('input');
                    input.type = 'range';
                    input.min = '300';
                    input.max = '1000';
                    input.value = String(dist);
                    input.style.flex = '1';
                    input.oninput = (e) => {
                      cameraDistance.value = Number((e.target as HTMLInputElement).value);
                    };
                    el.appendChild(input);
                  },
                  style: 'flex: 1;'
                }),
                span({ style: 'font-size: 0.75rem; min-width: 40px; color: var(--text-muted);' }, String(dist))
              )
            )
          ),
          div(
            div({ style: 'font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Angle X'),
            reactive(cameraAngleX, (angle) =>
              div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                div({
                  ref: (el: HTMLElement | SVGElement) => {
                    const input = document.createElement('input');
                    input.type = 'range';
                    input.min = '-90';
                    input.max = '90';
                    input.value = String(angle);
                    input.style.flex = '1';
                    input.oninput = (e) => {
                      cameraAngleX.value = Number((e.target as HTMLInputElement).value);
                    };
                    el.appendChild(input);
                  },
                  style: 'flex: 1;'
                }),
                span({ style: 'font-size: 0.75rem; min-width: 40px; color: var(--text-muted);' }, `${angle}°`)
              )
            )
          ),
          div(
            div({ style: 'font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Angle Y'),
            reactive(cameraAngleY, (angle) =>
              div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                div({
                  ref: (el: HTMLElement | SVGElement) => {
                    const input = document.createElement('input');
                    input.type = 'range';
                    input.min = '0';
                    input.max = '360';
                    input.value = String(angle);
                    input.style.flex = '1';
                    input.oninput = (e) => {
                      cameraAngleY.value = Number((e.target as HTMLInputElement).value);
                    };
                    el.appendChild(input);
                  },
                  style: 'flex: 1;'
                }),
                span({ style: 'font-size: 0.75rem; min-width: 40px; color: var(--text-muted);' }, `${angle}°`)
              )
            )
          )
        )
      ),

      // View options
      div(
        div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);' }, '👁️ View Options'),
        div({ style: 'display: flex; gap: 1rem; flex-wrap: wrap;' },
          reactive(autoRotate, (rotate) =>
            button({
              onclick: () => { autoRotate.value = !autoRotate.value; },
              style: `
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                border: 2px solid var(--border);
                background: ${rotate ? 'var(--primary)' : 'var(--bg-card)'};
                color: ${rotate ? 'white' : 'var(--text-primary)'};
                cursor: pointer;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.2s;
              `
            }, `🔄 Auto Rotate: ${rotate ? 'ON' : 'OFF'}`)
          ),
          reactive(showWireframe, (wireframe) =>
            button({
              onclick: () => { showWireframe.value = !showWireframe.value; },
              style: `
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                border: 2px solid var(--border);
                background: ${wireframe ? 'var(--primary)' : 'var(--bg-card)'};
                color: ${wireframe ? 'white' : 'var(--text-primary)'};
                cursor: pointer;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.2s;
              `
            }, `🔲 Wireframe: ${wireframe ? 'ON' : 'OFF'}`)
          ),
          div(
            div({ style: 'font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, '💡 Light Angle'),
            reactive(lightAngle, (angle) =>
              div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                div({
                  ref: (el: HTMLElement | SVGElement) => {
                    const input = document.createElement('input');
                    input.type = 'range';
                    input.min = '0';
                    input.max = '360';
                    input.value = String(angle);
                    input.style.width = '150px';
                    input.oninput = (e) => {
                      lightAngle.value = Number((e.target as HTMLInputElement).value);
                    };
                    el.appendChild(input);
                  }
                }),
                span({ style: 'font-size: 0.75rem; min-width: 40px; color: var(--text-muted);' }, `${angle}°`)
              )
            )
          )
        )
      ),

      // Selected shape properties
      reactive(selectedShape, (shape) =>
        shape
          ? div({ style: 'padding: 1.5rem; background: var(--bg-card); border-radius: 12px; border: 2px solid var(--border);' },
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-muted);' }, `⚙️ ${shape.type.toUpperCase()} Properties`),

              // Position
              div({ style: 'margin-bottom: 1rem;' },
                div({ style: 'font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--text-muted); font-weight: 600;' }, 'Position'),
                div({ style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;' },
                  ...['x', 'y', 'z'].map(axis =>
                    div(
                      div({ style: 'font-size: 0.7rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, axis.toUpperCase()),
                      div({
                        ref: (el: HTMLElement | SVGElement) => {
                          const input = document.createElement('input');
                          input.type = 'range';
                          input.min = '-200';
                          input.max = '200';
                          input.value = String(shape.position[axis as 'x' | 'y' | 'z']);
                          input.style.width = '100%';
                          input.oninput = (e) => {
                            updateShapeProperty('position', axis as 'x' | 'y' | 'z', Number((e.target as HTMLInputElement).value));
                          };
                          el.appendChild(input);
                        }
                      }),
                      div({ style: 'font-size: 0.7rem; text-align: center; color: var(--text-muted); margin-top: 0.25rem;' }, String(shape.position[axis as 'x' | 'y' | 'z']))
                    )
                  )
                )
              ),

              // Rotation
              div({ style: 'margin-bottom: 1rem;' },
                div({ style: 'font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--text-muted); font-weight: 600;' }, 'Rotation'),
                div({ style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;' },
                  ...['x', 'y', 'z'].map(axis =>
                    div(
                      div({ style: 'font-size: 0.7rem; margin-bottom: 0.25rem; color: var(--text-muted);' }, axis.toUpperCase()),
                      div({
                        ref: (el: HTMLElement | SVGElement) => {
                          const input = document.createElement('input');
                          input.type = 'range';
                          input.min = '0';
                          input.max = '360';
                          input.value = String(shape.rotation[axis as 'x' | 'y' | 'z']);
                          input.style.width = '100%';
                          input.oninput = (e) => {
                            updateShapeProperty('rotation', axis as 'x' | 'y' | 'z', Number((e.target as HTMLInputElement).value));
                          };
                          el.appendChild(input);
                        }
                      }),
                      div({ style: 'font-size: 0.7rem; text-align: center; color: var(--text-muted); margin-top: 0.25rem;' }, `${shape.rotation[axis as 'x' | 'y' | 'z']}°`)
                    )
                  )
                )
              ),

              // Scale
              div({ style: 'margin-bottom: 1rem;' },
                div({ style: 'font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--text-muted); font-weight: 600;' }, 'Scale'),
                div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                  div({
                    ref: (el: HTMLElement | SVGElement) => {
                      const input = document.createElement('input');
                      input.type = 'range';
                      input.min = '20';
                      input.max = '200';
                      input.value = String(shape.scale);
                      input.style.flex = '1';
                      input.oninput = (e) => {
                        updateShapeProperty('scale', null, Number((e.target as HTMLInputElement).value));
                      };
                      el.appendChild(input);
                    },
                    style: 'flex: 1;'
                  }),
                  span({ style: 'font-size: 0.75rem; min-width: 40px; color: var(--text-muted);' }, String(shape.scale))
                )
              ),

              // Color
              div(
                div({ style: 'font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--text-muted); font-weight: 600;' }, 'Color'),
                div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
                  ...['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'].map(color =>
                    button({
                      onclick: () => updateShapeProperty('color', null, color),
                      style: `
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        border: 3px solid ${shape.color === color ? 'white' : 'transparent'};
                        background: ${color};
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: ${shape.color === color ? '0 0 0 2px var(--primary)' : 'none'};
                      `
                    })
                  )
                )
              )
            )
          : div({ style: 'text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 2px dashed var(--border);' },
              '👆 Select a shape to edit its properties'
            )
      )
    )
  );
};

// Source code examples
const state3DExample = `import { createState, computed, reactive } from 'elit';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Shape {
  id: number;
  type: 'cube' | 'pyramid' | 'sphere';
  position: Point3D;
  rotation: Point3D;
  scale: number;
  color: string;
}

// State
const shapes = createState<Shape[]>([
  {
    id: 1,
    type: 'cube',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 100,
    color: '#3b82f6'
  }
]);

const selectedShapeId = createState<number | null>(1);
const autoRotate = createState(true);
const cameraDistance = createState(500);
const cameraAngleX = createState(20);
const cameraAngleY = createState(45);

// Computed selected shape
const selectedShape = computed([shapes, selectedShapeId], (shapeList, id) => {
  return shapeList.find(s => s.id === id) || null;
});`;

const projection3DExample = `// 3D to 2D perspective projection
const project = (
  point: Point3D,
  cameraAngleX: number,
  cameraAngleY: number,
  distance: number
): { x: number, y: number, scale: number } => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Rotate around Y axis
  const cosY = Math.cos((cameraAngleY * Math.PI) / 180);
  const sinY = Math.sin((cameraAngleY * Math.PI) / 180);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;

  // Rotate around X axis
  const cosX = Math.cos((cameraAngleX * Math.PI) / 180);
  const sinX = Math.sin((cameraAngleX * Math.PI) / 180);
  const y1 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  // Perspective projection
  const scale = distance / (distance + z2);
  const x2 = x1 * scale + centerX;
  const y2 = y1 * scale + centerY;

  return { x: x2, y: y2, scale };
};`;

const animation3DExample = `// Animation loop with reactive state updates
const render = () => {
  const canvas = canvasRef;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid and shapes
  drawGrid(ctx);

  // Sort shapes by Z for proper rendering (painter's algorithm)
  const sortedShapes = [...shapes.value].sort(
    (a, b) => a.position.z - b.position.z
  );

  sortedShapes.forEach(shape => {
    if (shape.type === 'cube') {
      drawCube(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
    } else if (shape.type === 'pyramid') {
      drawPyramid(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
    } else if (shape.type === 'sphere') {
      drawSphere(ctx, shape, cameraAngleX.value, cameraAngleY.value, cameraDistance.value);
    }
  });

  // Auto rotate all shapes
  if (autoRotate.value) {
    shapes.value = shapes.value.map(shape => ({
      ...shape,
      rotation: {
        x: shape.rotation.x + 0.5,
        y: shape.rotation.y + 1,
        z: shape.rotation.z + 0.3
      }
    }));
  }

  // Continue animation loop
  animationFrameId = requestAnimationFrame(render);
};`;

const lighting3DExample = `// Calculate lighting for faces
const drawCubeWithLighting = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  // Define light direction
  const lightDir = {
    x: Math.cos(lightAngle.value * Math.PI / 180),
    y: -0.5,
    z: Math.sin(lightAngle.value * Math.PI / 180)
  };

  // Normalize light direction
  const lightMag = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
  lightDir.x /= lightMag;
  lightDir.y /= lightMag;
  lightDir.z /= lightMag;

  // For each face
  faces.forEach(face => {
    // Calculate dot product with face normal
    const dotProduct = face.normal.x * lightDir.x +
                      face.normal.y * lightDir.y +
                      face.normal.z * lightDir.z;

    // Convert to brightness (0.2 to 1.0)
    const brightness = Math.max(0.2, Math.min(1, (dotProduct + 1) / 2));

    // Apply brightness to color
    const color = shape.color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    ctx.fillStyle = \`rgb(\${r * brightness}, \${g * brightness}, \${b * brightness})\`;

    // Draw face
    ctx.beginPath();
    // ... draw face vertices
    ctx.fill();
  });
};`;

const shapeListExample = `// Shape list - using reactive with selectedShapeId and shapes.value
// IMPORTANT: Avoid nested reactive pattern!
// ❌ WRONG: reactive(shapes, () => reactive(selectedShapeId, () => ...))
// ✅ CORRECT: reactive(selectedShapeId, () => ...shapes.value.map(...))

reactive(selectedShapeId, (selected) =>
  div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
    ...shapes.value.map(shape =>
      div({
        style: \`
          border: 2px solid \${selected === shape.id ? 'var(--primary)' : 'var(--border)'};
          background: \${selected === shape.id ? 'var(--primary)' : 'var(--bg-card)'};
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        \`,
        onclick: () => { selectedShapeId.value = shape.id; }
      },
        span(shape.type === 'cube' ? '🔲' : shape.type === 'pyramid' ? '🔺' : '⚪'),
        span({ style: 'text-transform: capitalize;' }, shape.type),
        button({
          onclick: (e: Event) => {
            e.stopPropagation();
            deleteShape(shape.id);
          },
          style: \`
            background: none;
            border: none;
            color: \${selected === shape.id ? 'white' : '#ef4444'};
            cursor: pointer;
            padding: 0;
            font-size: 1.25rem;
          \`
        }, '×')
      )
    )
  )
);

// Why this pattern works:
// - Single reactive tracks selectedShapeId changes
// - Uses shapes.value to access current array without nesting
// - Event handlers (onclick, button click) are preserved on re-renders
// - Nested reactive would recreate handlers, breaking functionality`;

// 3D Scene Content
export const ThreeDSceneContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🎨 Try the 3D Scene'),
    ThreeDSceneDemo()
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 1.5rem 0 1rem 0; font-size: 1.25rem;' }, '1. State Management'),
    p({ style: 'margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.6;' },
      'Define reactive state for shapes, camera, and view settings.'
    ),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(state3DExample))),

    h3({ style: 'margin: 1.5rem 0 1rem 0; font-size: 1.25rem;' }, '2. 3D Projection'),
    p({ style: 'margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.6;' },
      'Convert 3D coordinates to 2D screen coordinates with perspective projection.'
    ),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(projection3DExample))),

    h3({ style: 'margin: 1.5rem 0 1rem 0; font-size: 1.25rem;' }, '3. Animation Loop'),
    p({ style: 'margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.6;' },
      'Continuous rendering with requestAnimationFrame and reactive state updates.'
    ),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(animation3DExample))),

    h3({ style: 'margin: 1.5rem 0 1rem 0; font-size: 1.25rem;' }, '4. Lighting System'),
    p({ style: 'margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.6;' },
      'Calculate face brightness based on light direction and surface normals.'
    ),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(lighting3DExample))),

    h3({ style: 'margin: 1.5rem 0 1rem 0; font-size: 1.25rem;' }, '5. Shape List Pattern'),
    p({ style: 'margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.6;' },
      'Correct pattern for rendering shape list with event handlers - avoiding nested reactive.'
    ),
    pre({ style: 'margin: 0;' }, code(...codeBlock(shapeListExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Canvas rendering:'), ' Using Canvas API for 2D drawing of 3D projections'),
      li(strong('3D transformations:'), ' Implementing rotation matrices for X, Y, Z axes'),
      li(strong('Perspective projection:'), ' Converting 3D world coordinates to 2D screen coordinates'),
      li(strong('Painter\'s algorithm:'), ' Sorting shapes by Z-depth for correct rendering order'),
      li(strong('Animation loop:'), ' Using requestAnimationFrame for smooth 60fps rendering'),
      li(strong('Reactive rendering:'), ' Canvas updates automatically when state changes'),
      li(strong('Lighting calculations:'), ' Dot product between surface normals and light direction'),
      li(strong('Wireframe mode:'), ' Toggle between filled and wireframe rendering'),
      li(strong('Interactive controls:'), ' Sliders for real-time camera and shape manipulation'),
      li(strong('Shape management:'), ' CRUD operations for multiple 3D objects'),
      li(strong('Matrix transformations:'), ' Combining rotation, translation, and scaling'),
      li(strong('Performance optimization:'), ' Efficient vertex calculations and face culling'),
      li(strong('Color manipulation:'), ' RGB brightness adjustment for lighting effects')
    )
  )
);
