/**
 * pier-road.js — Realistic Coastal Pier Road
 *
 * A road/pier extending from the beach (Z=+10) out into the ocean (Z=+40),
 * creating the illusion of connection to distant land.
 *
 * Y-Level Reference:
 *   Sand at Z=+10: ~0.0 (interpolated from landY=0.58 at back)
 *   Shoreline Z=+30: -0.44
 *   Water surface: -0.50
 *   Pier deck elevation: +0.5 above water
 */

AFRAME.registerComponent('pier-road', {
  schema: {
    startZ:        { type: 'number', default: 10 },    // Start on sand
    endZ:          { type: 'number', default: 40 },    // End in water
    width:         { type: 'number', default: 6 },     // Road width
    deckHeight:    { type: 'number', default: 0.5 },     // Height above water
    pillarSpacing: { type: 'number', default: 6 },      // Distance between pillars
  },

  init() {
    const d = this.data;
    const group = new THREE.Group();

    // Calculate key positions and heights
    const shorelineZ = 30;  // Where sand meets water
    const sandStartY = 0.0; // Approximate sand height at Z=+10
    const waterY = -0.5;
    const deckY = waterY + d.deckHeight; // Deck sits above water

    this.sandStartY = sandStartY;
    this.shorelineZ = shorelineZ;
    this.waterY = waterY;
    this.deckY = deckY;

    // Create components
    this.createRoadSurface(group);
    this.createPillars(group);
    this.createGuardrails(group);
    this.createDistantLandIllusion(group);

    this.el.setObject3D('pier-road', group);
  },

  /**
   * Create the road deck surface with proper elevation curve
   */
  createRoadSurface(group) {
    const d = this.data;
    const length = d.endZ - d.startZ;
    const segments = 60; // High resolution for smooth curve

    const geo = new THREE.PlaneGeometry(d.width, length, 8, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = [];

    // Material colors
    const asphalt = new THREE.Color('#2a2a2a');
    const asphaltWorn = new THREE.Color('#3a3a3a');
    const yellowLine = new THREE.Color('#eebb00');
    const whiteLine = new THREE.Color('#dddddd');
    const curb = new THREE.Color('#5a5a5a');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let z = pos.getZ(i); // Relative to geometry center

      // Convert to world Z (geometry is centered, so shift by length/2)
      const worldZ = d.startZ + (z + length / 2);

      // Calculate deck elevation
      let deckElevation;
      if (worldZ < this.shorelineZ) {
        // On sand: gradually rise from sand level to deck height
        const t = (worldZ - d.startZ) / (this.shorelineZ - d.startZ);
        // Smooth ease-out curve
        const easeT = 1 - Math.pow(1 - t, 2);
        deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
      } else {
        // Over water: constant height with slight variation
        const waterT = (worldZ - this.shorelineZ) / (d.endZ - this.shorelineZ);
        // Very subtle rise toward the end
        deckElevation = this.deckY + waterT * 0.15;
      }

      // Add road crown for drainage (higher in center)
      const crown = Math.abs(x / (d.width * 0.5)) * 0.03;
      pos.setY(i, deckElevation + crown);
      
      // Set the Z position to world Z
      pos.setZ(i, worldZ);

      // Determine road marking color
      const absX = Math.abs(x);
      const halfWidth = d.width / 2;
      let color;

      if (absX > halfWidth - 0.15) {
        // Edge curb
        color = curb;
      } else if (absX < 0.12 && Math.floor(worldZ / 3) % 2 === 0) {
        // Center dashed yellow line
        color = yellowLine;
      } else if (absX > halfWidth - 0.5 && absX < halfWidth - 0.2) {
        // White edge line
        color = whiteLine;
      } else {
        // Asphalt with wear patterns
        const noise = Math.sin(x * 3 + worldZ * 2) * 0.1 + Math.random() * 0.05;
        color = asphalt.clone().lerp(asphaltWorn, Math.max(0, noise + 0.5));
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 30,
      specular: new THREE.Color('#444444'),
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    this.roadMesh = mesh;
  },

  /**
   * Create concrete support pillars
   */
  createPillars(group) {
    const d = this.data;
    const numPillars = Math.floor((d.endZ - d.startZ) / d.pillarSpacing) + 1;

    // Pillar materials
    const pillarMat = new THREE.MeshPhongMaterial({
      color: '#8a8a8a',
      shininess: 15,
      specular: new THREE.Color('#666666'),
    });

    const foundationMat = new THREE.MeshPhongMaterial({
      color: '#6a6a6a',
      shininess: 8,
    });

    const crossbeamMat = new THREE.MeshPhongMaterial({
      color: '#7a7a7a',
      shininess: 12,
    });

    for (let i = 0; i < numPillars; i++) {
      const z = d.startZ + (i * d.pillarSpacing);

      // Calculate deck height at this Z position
      let deckElevation;
      if (z < this.shorelineZ) {
        const t = (z - d.startZ) / (this.shorelineZ - d.startZ);
        const easeT = 1 - Math.pow(1 - t, 2);
        deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
      } else {
        const waterT = (z - this.shorelineZ) / (d.endZ - this.shorelineZ);
        deckElevation = this.deckY + waterT * 0.15;
      }

      // Left and right pillars
      const xPositions = [-d.width / 2 + 0.8, d.width / 2 - 0.8];

      xPositions.forEach(xPos => {
        // Main pillar cylinder
        const seabedY = -8; // Well below water
        const pillarHeight = deckElevation - seabedY;

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, pillarHeight, 12);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);

        pillar.position.set(xPos, seabedY + pillarHeight / 2, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);

        // Foundation at base
        const foundationGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.8, 12);
        const foundation = new THREE.Mesh(foundationGeo, foundationMat);
        foundation.position.set(xPos, seabedY + 0.4, z);
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        group.add(foundation);

        // Pillar cap at deck
        const capGeo = new THREE.CylinderGeometry(0.7, 0.5, 0.3, 12);
        const cap = new THREE.Mesh(capGeo, pillarMat);
        cap.position.set(xPos, deckElevation - 0.15, z);
        cap.castShadow = true;
        group.add(cap);
      });

      // Crossbeam connecting the two pillars under the deck
      const beamWidth = d.width - 1.2;
      const beamGeo = new THREE.BoxGeometry(beamWidth, 0.4, 1.2);
      const beam = new THREE.Mesh(beamGeo, crossbeamMat);
      beam.position.set(0, deckElevation - 0.5, z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      group.add(beam);
    }
  },

  /**
   * Create metal guardrails along both edges
   */
  createGuardrails(group) {
    const d = this.data;
    const length = d.endZ - d.startZ;
    const railHeight = 1.0;
    const postSpacing = 3;
    const numPosts = Math.floor(length / postSpacing) + 1;

    // Rail materials
    const railMat = new THREE.MeshPhongMaterial({
      color: '#999999',
      shininess: 80,
      specular: new THREE.Color('#bbbbbb'),
    });

    const xPositions = [-d.width / 2 + 0.3, d.width / 2 - 0.3];

    xPositions.forEach((xPos, sideIndex) => {
      // Create posts
      for (let i = 0; i < numPosts; i++) {
        const z = d.startZ + (i * postSpacing);

        // Calculate deck height at this position
        let deckElevation;
        if (z < this.shorelineZ) {
          const t = (z - d.startZ) / (this.shorelineZ - d.startZ);
          const easeT = 1 - Math.pow(1 - t, 2);
          deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
        } else {
          const waterT = (z - this.shorelineZ) / (d.endZ - this.shorelineZ);
          deckElevation = this.deckY + waterT * 0.15;
        }

        // Vertical post
        const postGeo = new THREE.CylinderGeometry(0.04, 0.04, railHeight + 0.2, 8);
        const post = new THREE.Mesh(postGeo, railMat);
        post.position.set(xPos, deckElevation + railHeight / 2, z);
        post.castShadow = true;
        group.add(post);

        // Post base plate
        const baseGeo = new THREE.BoxGeometry(0.15, 0.05, 0.15);
        const base = new THREE.Mesh(baseGeo, railMat);
        base.position.set(xPos, deckElevation + 0.025, z);
        group.add(base);
      }

      // Create continuous top rail using a curved path
      const curvePoints = [];
      for (let i = 0; i < numPosts; i++) {
        const z = d.startZ + (i * postSpacing);

        let deckElevation;
        if (z < this.shorelineZ) {
          const t = (z - d.startZ) / (this.shorelineZ - d.startZ);
          const easeT = 1 - Math.pow(1 - t, 2);
          deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
        } else {
          const waterT = (z - this.shorelineZ) / (d.endZ - this.shorelineZ);
          deckElevation = this.deckY + waterT * 0.15;
        }

        curvePoints.push(new THREE.Vector3(xPos, deckElevation + railHeight, z));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, numPosts - 1, 0.04, 8, false);
      const tube = new THREE.Mesh(tubeGeo, railMat);
      tube.castShadow = true;
      group.add(tube);
    });

    // Add mid-rail cables (3 horizontal cables between posts)
    const cablePositions = [0.3, 0.6, 0.85];
    cablePositions.forEach(cableY => {
      xPositions.forEach(xPos => {
        const cablePoints = [];
        for (let i = 0; i < numPosts; i++) {
          const z = d.startZ + (i * postSpacing);

          let deckElevation;
          if (z < this.shorelineZ) {
            const t = (z - d.startZ) / (this.shorelineZ - d.startZ);
            const easeT = 1 - Math.pow(1 - t, 2);
            deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
          } else {
            const waterT = (z - this.shorelineZ) / (d.endZ - this.shorelineZ);
            deckElevation = this.deckY + waterT * 0.15;
          }

          cablePoints.push(new THREE.Vector3(xPos, deckElevation + cableY, z));
        }

        const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
        const cableGeo = new THREE.TubeGeometry(cableCurve, numPosts - 1, 0.015, 6, false);
        const cable = new THREE.Mesh(cableGeo, railMat);
        group.add(cable);
      });
    });
  },

  /**
   * Create street lights along the pier
   */
  createStreetLights(group) {
    const d = this.data;
    const lightSpacing = 20;
    const numLights = Math.floor((d.endZ - d.startZ) / lightSpacing);
    const poleHeight = 5;
    const armLength = 1.5;

    const poleMat = new THREE.MeshPhongMaterial({
      color: '#4a4a4a',
      shininess: 30,
    });

    const fixtureMat = new THREE.MeshPhongMaterial({
      color: '#f5f5dc',
      emissive: '#ffeeaa',
      emissiveIntensity: 0.4,
    });

    for (let i = 1; i <= numLights; i++) {
      const z = d.startZ + (i * lightSpacing);

      let deckElevation;
      if (z < this.shorelineZ) {
        const t = (z - d.startZ) / (this.shorelineZ - d.startZ);
        const easeT = 1 - Math.pow(1 - t, 2);
        deckElevation = this.sandStartY * (1 - easeT) + this.deckY * easeT;
      } else {
        const waterT = (z - this.shorelineZ) / (d.endZ - this.shorelineZ);
        deckElevation = this.deckY + waterT * 0.15;
      }

      const xOffset = (i % 2 === 0) ? d.width / 2 + 0.5 : -d.width / 2 - 0.5;

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, poleHeight, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(xOffset, deckElevation + poleHeight / 2, z);
      pole.castShadow = true;
      group.add(pole);

      const armGeo = new THREE.BoxGeometry(armLength, 0.08, 0.08);
      const arm = new THREE.Mesh(armGeo, poleMat);
      const armDir = (i % 2 === 0) ? -1 : 1;
      arm.position.set(
        xOffset + (armDir * armLength / 2),
        deckElevation + poleHeight - 0.3,
        z
      );
      group.add(arm);

      const fixtureGeo = new THREE.BoxGeometry(0.35, 0.25, 0.15);
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(
        xOffset + (armDir * armLength),
        deckElevation + poleHeight - 0.35,
        z
      );
      group.add(fixture);

      const light = new THREE.PointLight('#ffeebb', 1.2, 35);
      light.position.set(
        xOffset + (armDir * armLength),
        deckElevation + poleHeight - 0.5,
        z
      );
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      group.add(light);
    }
  },

  /**
   * Create illusion of distant land at the end of the pier
   * Uses a faded silhouette that looks like a distant island/landmass
   */
  createDistantLandIllusion(group) {
    const d = this.data;
    
    // Position the illusion well beyond the pier end, partially obscured by fog
    const illusionZ = d.endZ + 80;
    const illusionY = 15;
    
    // Main landmass silhouette - low opacity for atmospheric effect
    const mainGeo = new THREE.PlaneGeometry(300, 60, 1, 1);
    const mainMat = new THREE.MeshBasicMaterial({
      color: '#6a7a8a',
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mainLand = new THREE.Mesh(mainGeo, mainMat);
    mainLand.position.set(0, illusionY, illusionZ);
    group.add(mainLand);
    
    // Secondary mountain peaks for variety
    const peakGeo = new THREE.PlaneGeometry(120, 40, 1, 1);
    const peakMat = new THREE.MeshBasicMaterial({
      color: '#5a6a7a',
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    const leftPeak = new THREE.Mesh(peakGeo, peakMat);
    leftPeak.position.set(-90, illusionY + 5, illusionZ + 20);
    leftPeak.rotation.z = 0.1;
    group.add(leftPeak);
    
    const rightPeak = new THREE.Mesh(peakGeo, peakMat);
    rightPeak.position.set(90, illusionY + 8, illusionZ + 10);
    rightPeak.rotation.z = -0.08;
    group.add(rightPeak);
    
    // Atmospheric haze layer at horizon
    const hazeGeo = new THREE.PlaneGeometry(500, 25, 1, 1);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: '#b8d0e0',
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.set(0, illusionY - 15, illusionZ - 30);
    group.add(haze);
  }
});
