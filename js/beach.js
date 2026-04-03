/**
 * beach.js  —  Realistic Beach Scene Components
 *
 * UNIFIED Y-LEVEL SYSTEM:
 *   WATER_Y  = -0.5   ocean surface
 *   SAND_Y   =  0.0   beach base (slopes DOWN to WATER_Y at shore)
 *   LAND_Y   =  0.6   grassy elevated land pad behind beach
 *
 * The ocean sits at WATER_Y. Sand geometry slopes exactly from LAND_Y down
 * to WATER_Y at the shoreline so there is zero gap and water never clips through.
 */

// ─────────────────────────────────────────────────────────────
// 1. OCEAN WATER  —  animated depth-colored water with seabed
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('ocean-water', {
  schema: {
    width:         { type: 'number', default: 300 },
    depth:         { type: 'number', default: 300 },
    widthSegments: { type: 'number', default: 100 },
    depthSegments: { type: 'number', default: 100 },
    amplitude:     { type: 'number', default: 0.15 },
    speed:         { type: 'number', default: 0.5  },
  },

  init() {
    const d   = this.data;
    const geo = new THREE.PlaneGeometry(d.width, d.depth, d.widthSegments, d.depthSegments);
    geo.rotateX(-Math.PI / 2);

    const pos   = geo.attributes.position;
    this._origY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) this._origY[i] = pos.getY(i);

    // Vertex colors: turquoise shallow → deep navy
    const colors    = [];
    const shallow   = new THREE.Color('#2eadc8');
    const mid       = new THREE.Color('#1475a0');
    const deep      = new THREE.Color('#083550');
    const halfDepth = d.depth * 0.5;

    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const t = THREE.MathUtils.clamp((z + halfDepth) / d.depth, 0, 1);
      let c;
      if (t < 0.3) c = shallow.clone().lerp(mid, t / 0.3);
      else c = mid.clone().lerp(deep, (t - 0.3) / 0.7);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.mat = new THREE.MeshPhongMaterial({
      vertexColors:      true,
      shininess:         180,
      specular:          new THREE.Color('#99ddff'),
      transparent:       true,
      opacity:           0.84,
      side:              THREE.FrontSide,
      depthWrite:        true,
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.receiveShadow = true;
    this.el.setObject3D('mesh', this.mesh);

    // Solid seabed so you NEVER see through the water
    const bedGeo  = new THREE.PlaneGeometry(d.width + 20, d.depth + 20, 1, 1);
    bedGeo.rotateX(-Math.PI / 2);
    const bedMat  = new THREE.MeshLambertMaterial({ color: '#051e2d' });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -5;
    this.el.object3D.add(bedMesh);

    this._t = 0;
  },

  tick(time, delta) {
    this._t += (delta / 1000) * this.data.speed;
    const pos = this.mesh.geometry.attributes.position;
    const amp = this.data.amplitude;
    const t   = this._t;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      
      // Distance from island center (Z=0 is near beach)
      const distFromIsland = Math.abs(z);
      
      // Base wave calculation
      let w =
        Math.sin(x * 0.20 + t * 2.0) * amp         +
        Math.sin(z * 0.15 + t * 1.5) * amp * 0.8   +
        Math.sin((x + z) * 0.10 + t * 1.2) * amp * 0.5 +
        Math.sin(x * 0.08 - t * 0.9) * amp * 0.3;
      
      // Add larger waves in distant ocean (far from island)
      if (distFromIsland > 200) {
        // Big ocean swells
        w += Math.sin(x * 0.05 + t * 0.8) * amp * 3 +
             Math.sin(z * 0.03 + t * 0.6) * amp * 2.5;
      } else if (distFromIsland > 100) {
        // Medium waves in mid-distance
        w += Math.sin(x * 0.08 + t * 1.2) * amp * 1.5 +
             Math.sin(z * 0.06 + t * 0.9) * amp * 1.2;
      }
      
      pos.setY(i, this._origY[i] + w);
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  },
});


// ─────────────────────────────────────────────────────────────
// 2. BEACH SAND  —  wide gently-sloped vertex-colored sand
//    Slopes from landY at back DOWN to shoreY at water's edge.
//    Width is intentionally larger than viewport to avoid edge clipping.
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('beach-sand', {
  schema: {
    width:         { type: 'number', default: 180  },
    depth:         { type: 'number', default: 60   },
    widthSegments: { type: 'number', default: 110  },
    depthSegments: { type: 'number', default: 70   },
    shoreY:        { type: 'number', default: -0.44 }, // must match ocean Y
    landY:         { type: 'number', default:  0.58 }, // must match land-pad baseY
  },

  init() {
    const d   = this.data;
    const geo = new THREE.PlaneGeometry(d.width, d.depth, d.widthSegments, d.depthSegments);
    geo.rotateX(-Math.PI / 2);

    const pos       = geo.attributes.position;
    const halfDepth = d.depth * 0.5;
    const colors    = [];

    const wetSand  = new THREE.Color('#a8894a');
    const midSand  = new THREE.Color('#d4b060');
    const drySand  = new THREE.Color('#e8cf80');
    const paleSand = new THREE.Color('#f2e0a0');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // t=0 → back/land edge,  t=1 → front/shore
      const t = (z + halfDepth) / d.depth;

      // Slope height interpolated from landY down to shoreY
      const slope  = d.landY * (1 - t) + d.shoreY * t;

      // Fine sand ripples (cross-shore and along-shore)
      const ripple =
        Math.sin(x * 0.22)             * 0.022 +
        Math.sin(x * 0.50 + z * 0.28) * 0.012 +
        Math.sin(z * 0.60)             * 0.018 +
        Math.sin(x * 0.09 - z * 0.14) * 0.010;

      pos.setY(i, slope + ripple);

      // Color: wet-dark near shore, golden mid, pale dry at back
      let c;
      if (t > 0.82) {
        // wet zone near water
        const wt = (t - 0.82) / 0.18;
        c = midSand.clone().lerp(wetSand, wt);
      } else if (t > 0.45) {
        // middle beach
        const mt = (t - 0.45) / 0.37;
        c = drySand.clone().lerp(midSand, mt);
      } else {
        // dry back beach
        const bt = t / 0.45;
        c = paleSand.clone().lerp(drySand, bt);
      }
      c.r += (Math.random() - 0.5) * 0.035;
      c.g += (Math.random() - 0.5) * 0.035;
      c.b += (Math.random() - 0.5) * 0.020;
      colors.push(c.r, c.g, c.b);
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat  = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.el.setObject3D('mesh', mesh);
  },
});


// ─────────────────────────────────────────────────────────────
// 3. LAND PAD  —  wide grassy elevated terrain behind beach
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('land-pad', {
  schema: {
    width:         { type: 'number', default: 180 },
    depth:         { type: 'number', default: 70  },
    widthSegments: { type: 'number', default: 80  },
    depthSegments: { type: 'number', default: 40  },
    baseY:         { type: 'number', default:  0.58 },
  },

  init() {
    const d   = this.data;
    const geo = new THREE.PlaneGeometry(d.width, d.depth, d.widthSegments, d.depthSegments);
    geo.rotateX(-Math.PI / 2);

    const pos    = geo.attributes.position;
    const colors = [];

    const g1   = new THREE.Color('#4a7c28');
    const g2   = new THREE.Color('#5a8c38');
    const g3   = new THREE.Color('#6a9c48');
    const grass = new THREE.Color('#3a6c18');
    const sand = new THREE.Color('#c0a050');  // transition edge near beach

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const halfD = d.depth * 0.5;

      // t=0 front (near beach), t=1 back
      const tFront = (z + halfD) / d.depth;

      const bump =
        Math.sin(x * 0.08 + 0.8) * 0.08 +
        Math.sin(z * 0.10 + 0.4) * 0.06 +
        Math.sin((x - z) * 0.06) * 0.05 +
        Math.sin(x * 0.15 + z * 0.12) * 0.04;

      pos.setY(i, d.baseY + bump);

      // Front edge blends to sandy transition
      let c;
      if (tFront < 0.12) {
        c = sand.clone().lerp(g1, tFront / 0.12);
      } else {
        const rnd = Math.random();
        const base = rnd < 0.4 ? g1 : rnd < 0.75 ? g2 : rnd < 0.95 ? g3 : grass;
        c = base.clone();
      }
      c.r += (Math.random() - 0.5) * 0.03;
      c.g += (Math.random() - 0.5) * 0.03;
      colors.push(c.r, c.g, c.b);
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat  = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.el.setObject3D('mesh', mesh);
  },
});


// ─────────────────────────────────────────────────────────────
// 4. BEACH DUNES  —  natural sand dunes at beach/land boundary
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('beach-dunes', {
  schema: {
    width:         { type: 'number', default: 180 },
    depth:         { type: 'number', default: 16  },
    widthSegments: { type: 'number', default: 100 },
    depthSegments: { type: 'number', default: 16  },
  },

  init() {
    const d   = this.data;
    const geo = new THREE.PlaneGeometry(d.width, d.depth, d.widthSegments, d.depthSegments);
    geo.rotateX(-Math.PI / 2);

    const pos    = geo.attributes.position;
    const colors = [];
    const halfD  = d.depth * 0.5;

    const duneSand   = new THREE.Color('#cca858');
    const dunePale   = new THREE.Color('#e8d48a');
    const duneShade  = new THREE.Color('#a88840');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nt = (z + halfD) / d.depth; // 0=front, 1=back

      // Dune profile: smooth sine arch with wavy crest
      const profile = Math.sin(nt * Math.PI);
      const crest =
        Math.sin(x * 0.13 + 0.5) * 0.38 +
        Math.sin(x * 0.27 - 1.0) * 0.22 +
        Math.sin(x * 0.07 + z * 0.10) * 0.28;
      const h = 0.58 + profile * (0.85 + crest * 0.55);
      pos.setY(i, h);

      const ht = THREE.MathUtils.clamp((h - 0.5) / 1.3, 0, 1);
      const c  = duneShade.clone().lerp(ht > 0.55 ? dunePale : duneSand, ht);
      c.r += (Math.random() - 0.5) * 0.03;
      c.g += (Math.random() - 0.5) * 0.03;
      colors.push(c.r, c.g, c.b);
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat  = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow    = true;
    this.el.setObject3D('mesh', mesh);
  },
});


// ─────────────────────────────────────────────────────────────
// 5. SHORELINE FOAM  —  animated pulsing foam at water's edge
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('foam-strip', {
  schema: {
    width: { type: 'number', default: 180 },
    speed: { type: 'number', default: 0.38 },
  },

  init() {
    const d   = this.data;
    const geo = new THREE.PlaneGeometry(d.width, 3.0, 120, 8);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, Math.sin(x * 0.08) * 0.06);
    }

    this.mat = new THREE.MeshPhongMaterial({
      color:             '#ffffff',
      emissive:          '#88ccdd',
      emissiveIntensity: 0.2,
      transparent:       true,
      opacity:           0.55,
      shininess:         90,
      depthWrite:        false,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.el.setObject3D('mesh', this.mesh);
    this._t = 0;
  },

  tick(t, delta) {
    this._t += delta / 1000;
    const pulse = Math.abs(Math.sin(this._t * this.data.speed * Math.PI));
    this.mat.opacity           = 0.20 + 0.50 * pulse;
    this.mat.emissiveIntensity = 0.10 + 0.30 * pulse;
  },
});


// ─────────────────────────────────────────────────────────────
// 6. SCATTER ROCKS  —  organic embedded shoreline rocks
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('scatter-rocks', {
  schema: {
    count:  { type: 'number', default: 30 },
    rangeX: { type: 'number', default: 60 },
    rangeZ: { type: 'number', default:  4 },
    baseY:  { type: 'number', default: -0.44 },
  },

  init() {
    const d      = this.data;
    const group  = new THREE.Group();
    const palette = ['#857565', '#6b5f52', '#9a9080', '#504840', '#726660', '#5a5248'];

    for (let i = 0; i < d.count; i++) {
      const r   = 0.08 + Math.random() * 0.60;
      const geo = new THREE.DodecahedronGeometry(r, 0);
      const pos = geo.attributes.position;

      const sx = 0.7 + Math.random() * 0.8;
      const sy = 0.28 + Math.random() * 0.38;   // flat rocks
      const sz = 0.7 + Math.random() * 0.8;

      for (let v = 0; v < pos.count; v++) {
        pos.setXYZ(v,
          pos.getX(v) * sx * (0.88 + Math.random() * 0.24),
          pos.getY(v) * sy * (0.88 + Math.random() * 0.24),
          pos.getZ(v) * sz * (0.88 + Math.random() * 0.24),
        );
      }
      geo.computeVertexNormals();

      const col  = palette[Math.floor(Math.random() * palette.length)];
      const mat  = new THREE.MeshLambertMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const px = (Math.random() - 0.5) * d.rangeX * 2;
      const pz = (Math.random() - 0.5) * d.rangeZ * 2;
      const py = d.baseY + r * sy * 0.30; // embed half into sand/waterline

      mesh.position.set(px, py, pz);
      mesh.rotation.set(
        (Math.random() - 0.5) * 0.7,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5,
      );
      group.add(mesh);
    }

    this.el.setObject3D('rocks', group);
  },
});


// ─────────────────────────────────────────────────────────────
// 8. ROAD BRIDGE  —  realistic elevated road with pillars and lights
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('road-bridge', {
  schema: {
    length:        { type: 'number', default: 120 },
    width:         { type: 'number', default: 8 },
    pillarSpacing: { type: 'number', default: 15 },
    startZ:        { type: 'number', default: 25 },
    startY:        { type: 'number', default: -0.44 },
    endZ:          { type: 'number', default: -95 },
    endY:          { type: 'number', default: 2.0 },
  },

  init() {
    const d = this.data;
    const group = new THREE.Group();

    // Create road surface
    this.createRoadSurface(group);
    
    // Create support pillars
    this.createPillars(group);
    
    // Create guardrails
    this.createGuardrails(group);
    
    // Create street lights
    this.createStreetLights(group);

    this.el.setObject3D('road-bridge', group);
  },

  createRoadSurface(group) {
    const d = this.data;
    const geo = new THREE.PlaneGeometry(d.length, d.width, 40, 8);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      
      // Calculate elevation along road length
      const t = (z + d.length/2) / d.length;
      const elevation = d.startY * (1 - t) + d.endY * t;
      
      // Add slight road crown for water runoff
      const crown = Math.abs(x / (d.width * 0.5)) * 0.05;
      
      pos.setY(i, elevation + crown);

      // Asphalt coloring with wear variations
      const asphalt = new THREE.Color('#2a2a2a');
      const wear = new THREE.Color('#3a3a3a');
      
      // Add lane markings
      const isCenterLine = Math.abs(x) < 0.15;
      const isEdgeLine = Math.abs(x) > (d.width * 0.5 - 0.3);
      
      let color = asphalt;
      if (isCenterLine) {
        color = new THREE.Color('#ffffff');
      } else if (isEdgeLine) {
        color = new THREE.Color('#ffff99');
      } else {
        // Random wear patterns
        const noise = Math.sin(x * 2 + z * 3) * 0.1 + Math.random() * 0.05;
        color = asphalt.lerp(wear, Math.max(0, noise));
      }
      
      colors.push(color.r, color.g, color.b);
    }

    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 20,
      specular: new THREE.Color('#444444'),
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  },

  createPillars(group) {
    const d = this.data;
    const numPillars = Math.floor(d.length / d.pillarSpacing);
    
    for (let i = 1; i <= numPillars; i++) {
      const z = d.startZ - (i * d.pillarSpacing);
      const t = i / numPillars;
      const roadHeight = d.startY * (1 - t) + d.endY * t;
      
      // Pillar extends from seabed to road
      const pillarHeight = roadHeight + 5; // 5m to seabed
      
      // Main pillar cylinder
      const pillarGeo = new THREE.CylinderGeometry(0.8, 1.0, pillarHeight, 8);
      const pillarMat = new THREE.MeshPhongMaterial({
        color: '#8a8a8a',
        shininess: 10,
      });
      
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(0, roadHeight - pillarHeight/2, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
      
      // Concrete foundation at base
      const foundationGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
      const foundationMat = new THREE.MeshPhongMaterial({
        color: '#6a6a6a',
        shininess: 5,
      });
      
      const foundation = new THREE.Mesh(foundationGeo, foundationMat);
      foundation.position.set(0, -5.25, z);
      foundation.castShadow = true;
      foundation.receiveShadow = true;
      group.add(foundation);
    }
  },

  createGuardrails(group) {
    const d = this.data;
    const railHeight = 1.2;
    const railPositions = [-d.width * 0.45, d.width * 0.45];
    
    railPositions.forEach(xOffset => {
      // Main rail beam
      const railGeo = new THREE.BoxGeometry(d.length, 0.1, 0.15);
      const railMat = new THREE.MeshPhongMaterial({
        color: '#cccccc',
        shininess: 80,
      });
      
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(xOffset, railHeight, -d.length/2);
      rail.castShadow = true;
      group.add(rail);
      
      // Vertical posts
      const numPosts = Math.floor(d.length / 3);
      for (let i = 0; i <= numPosts; i++) {
        const z = d.startZ - (i * 3);
        const t = i / numPosts;
        const roadHeight = d.startY * (1 - t) + d.endY * t;
        
        const postGeo = new THREE.CylinderGeometry(0.05, 0.05, railHeight + 0.5, 6);
        const post = new THREE.Mesh(postGeo, railMat);
        post.position.set(xOffset, roadHeight + (railHeight + 0.5)/2, z);
        post.castShadow = true;
        group.add(post);
      }
    });
  },

  createStreetLights(group) {
    const d = this.data;
    const lightHeight = 6;
    const armLength = 2;
    const lightSpacing = 20;
    const numLights = Math.floor(d.length / lightSpacing);
    
    for (let i = 1; i <= numLights; i++) {
      const z = d.startZ - (i * lightSpacing);
      const t = i / numLights;
      const roadHeight = d.startY * (1 - t) + d.endY * t;
      
      // Alternate sides of road
      const xOffset = (i % 2 === 0) ? d.width * 0.6 : -d.width * 0.6;
      
      // Light pole
      const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, lightHeight, 8);
      const poleMat = new THREE.MeshPhongMaterial({
        color: '#4a4a4a',
        shininess: 30,
      });
      
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(xOffset, roadHeight + lightHeight/2, z);
      pole.castShadow = true;
      group.add(pole);
      
      // Arm extending over road
      const armGeo = new THREE.BoxGeometry(armLength, 0.1, 0.1);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(xOffset - (i % 2 === 0 ? armLength/2 : -armLength/2), 
                       roadHeight + lightHeight - 0.5, z);
      arm.rotation.z = (i % 2 === 0) ? 0 : Math.PI;
      group.add(arm);
      
      // Light fixture
      const fixtureGeo = new THREE.BoxGeometry(0.4, 0.3, 0.2);
      const fixtureMat = new THREE.MeshPhongMaterial({
        color: '#ffffcc',
        emissive: '#ffff99',
        emissiveIntensity: 0.3,
      });
      
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(xOffset - (i % 2 === 0 ? armLength : -armLength), 
                          roadHeight + lightHeight - 0.5, z);
      group.add(fixture);
      
      // Light source
      const light = new THREE.PointLight('#fffacd', 0.8, 25);
      light.position.set(xOffset - (i % 2 === 0 ? armLength : -armLength), 
                         roadHeight + lightHeight - 0.5, z);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      group.add(light);
    }
  },
});

// ─────────────────────────────────────────────────────────────
// 7. GRADIENT SKY DOME  —  vertex-colored sky sphere
// ─────────────────────────────────────────────────────────────
AFRAME.registerComponent('gradient-sky', {
  schema: {
    zenith:  { type: 'color', default: '#1860a8' },
    mid:     { type: 'color', default: '#5aaad8' },
    horizon: { type: 'color', default: '#aaddf5' },
    haze:    { type: 'color', default: '#f0d898' },
  },

  init() {
    const d   = this.data;
    const geo = new THREE.SphereGeometry(490, 40, 24);
    const pos = geo.attributes.position;
    const cols= [];

    const zenith  = new THREE.Color(d.zenith);
    const midC    = new THREE.Color(d.mid);
    const horizon = new THREE.Color(d.horizon);
    const haze    = new THREE.Color(d.haze);

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp(y / 490, -0.05, 1.0);
      let c;
      if (t < 0.0) {
        c = haze.clone(); // below horizon line — not visible but prevents artefacts
      } else if (t < 0.08) {
        c = horizon.clone().lerp(haze, (0.08 - t) / 0.08 * 0.5);
      } else if (t < 0.35) {
        c = midC.clone().lerp(horizon, 1 - (t - 0.08) / 0.27);
      } else {
        c = zenith.clone().lerp(midC, 1 - (t - 0.35) / 0.65);
      }
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));

    const mat  = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    const mesh = new THREE.Mesh(geo, mat);
    this.el.setObject3D('sky', mesh);
  },
});