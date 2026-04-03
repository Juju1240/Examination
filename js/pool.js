// pool-scene component
// Just the pool basin + water + ladder + toys. No deck, no furniture.
// Water uses a Three.js ShaderMaterial with vertex displacement for real mesh waves.
// Toys sample the wave height analytically each frame and ride the surface.

AFRAME.registerComponent('pool-scene', {
  schema: {
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    scale:    { type: 'vec3', default: { x: 1, y: 1, z: 1 } }
  },

  init: function () {
    const root = document.createElement('a-entity');
    root.setAttribute('position', this.data.position);
    root.setAttribute('scale',    this.data.scale);

    // ── palette ───────────────────────────────────────────────────────────────
    const M = {
      floor:    'color:#0d7fa8; roughness:0.12; metalness:0.2',
      wall:     'color:#1498c2; roughness:0.10; metalness:0.15',
      coping:   'color:#e8dfc8; roughness:0.75; metalness:0.02',
      rail:     'color:#d8d8d8; metalness:0.95; roughness:0.04',
      laneR:    'color:#ff6b35; roughness:0.5',
      laneB:    'color:#4fc3f7; roughness:0.5',
      flamingo: 'color:#ff80ab; roughness:0.5; metalness:0.1',
      beak:     'color:#ff8f00; roughness:0.4',
      ballY:    'color:#ffeb3b; roughness:0.45; metalness:0.1',
      ballR:    'color:#f44336; roughness:0.4',
      ballB:    'color:#2196f3; roughness:0.4',
      ballG:    'color:#4caf50; roughness:0.4',
      ringO:    'color:#ff5722; roughness:0.5; metalness:0.1',
      ringW:    'color:#ffffff; roughness:0.5',
      noodle:   'color:#00e5ff; roughness:0.75',
      duck:     'color:#ffeb3b; roughness:0.6; metalness:0.1',
      duckB:    'color:#ff8f00; roughness:0.5',
      duckE:    'color:#111111; roughness:0.3'
    };

    let html = '';

    // ── pool dimensions ───────────────────────────────────────────────────────
    // Interior: 24 wide (X), 16 deep (Z)
    // Water surface: y = 0
    // Pool floor:    y = -2.0
    // Walls: h=2.2, centre y = -0.9
    // Coping: y = 0.11

    const PW     = 24;
    const PD     = 16;
    const WALL   = 0.4;
    const WH     = 2.2;
    const FLOOR_Y = -2.0;
    const WALL_Y  = FLOOR_Y + WH / 2;   // -0.9
    const COPE_Y  = 0.11;
    const COPE_H  = 0.22;
    const COPE_W  = 0.65;

    // floor
    html += `<a-box width="${PW}" height="0.25" depth="${PD}"
               position="0 ${FLOOR_Y} 0"
               material="${M.floor}" shadow="receive:true"></a-box>`;

    // walls — inner face flush to pool interior edges
    const hwx = PW / 2 + WALL / 2;   // 12.2
    const hwz = PD / 2 + WALL / 2;   // 8.2
    html += `<a-box width="${WALL}" height="${WH}" depth="${PD}"
               position="${-hwx} ${WALL_Y} 0" material="${M.wall}"></a-box>`;
    html += `<a-box width="${WALL}" height="${WH}" depth="${PD}"
               position=" ${hwx} ${WALL_Y} 0" material="${M.wall}"></a-box>`;
    html += `<a-box width="${PW + WALL * 2}" height="${WH}" depth="${WALL}"
               position="0 ${WALL_Y} ${-hwz}" material="${M.wall}"></a-box>`;
    html += `<a-box width="${PW + WALL * 2}" height="${WH}" depth="${WALL}"
               position="0 ${WALL_Y}  ${hwz}" material="${M.wall}"></a-box>`;

    // coping — sits on top of each wall face
    const copeXo    = PW / 2 + WALL / 2;          // 12.2
    const copeZo    = PD / 2 + WALL / 2;          // 8.2
    const copeSpanX = PW + WALL * 2 + COPE_W;     // 25.45
    const copeSpanZ = PD + WALL * 2;              // 16.8
    html += `<a-box width="${COPE_W}" height="${COPE_H}" depth="${copeSpanZ}"
               position="${-copeXo} ${COPE_Y} 0" material="${M.coping}"></a-box>`;
    html += `<a-box width="${COPE_W}" height="${COPE_H}" depth="${copeSpanZ}"
               position=" ${copeXo} ${COPE_Y} 0" material="${M.coping}"></a-box>`;
    html += `<a-box width="${copeSpanX}" height="${COPE_H}" depth="${COPE_W}"
               position="0 ${COPE_Y} ${-copeZo}" material="${M.coping}"></a-box>`;
    html += `<a-box width="${copeSpanX}" height="${COPE_H}" depth="${COPE_W}"
               position="0 ${COPE_Y}  ${copeZo}" material="${M.coping}"></a-box>`;

    // ── vertical ladder (right wall, centre Z) ────────────────────────────────
    // Two straight vertical rails + horizontal rungs — classic pool climb-out ladder
    // Mounted just inside the right wall (x ≈ 11.8)
    const LX        = 11.80;   // just inside right wall
    const LZ1       = -0.40;   // front rail
    const LZ2       =  0.40;   // back rail
    const RAIL_TOP  =  0.90;   // above coping so you can grab from deck
    const RAIL_BOT  = -1.80;   // near pool floor
    const RAIL_H    = RAIL_TOP - RAIL_BOT;        // 2.70
    const RAIL_CY   = (RAIL_TOP + RAIL_BOT) / 2; // -0.45
    const RUNG_SPAN = Math.abs(LZ2 - LZ1);        // 0.80

    // vertical rails
    html += `<a-cylinder radius="0.045" height="${RAIL_H}"
               position="${LX} ${RAIL_CY} ${LZ1}"
               material="${M.rail}"></a-cylinder>`;
    html += `<a-cylinder radius="0.045" height="${RAIL_H}"
               position="${LX} ${RAIL_CY} ${LZ2}"
               material="${M.rail}"></a-cylinder>`;

    // horizontal rungs
    for (let ry = RAIL_BOT + 0.28; ry <= RAIL_TOP - 0.10; ry += 0.40) {
      html += `<a-cylinder radius="0.030" height="${RUNG_SPAN}"
                 position="${LX} ${ry.toFixed(3)} 0"
                 rotation="90 0 0"
                 material="${M.rail}"></a-cylinder>`;
    }

    // top grab bar — horizontal bar parallel to wall so you can hold it stepping out
    html += `<a-cylinder radius="0.038" height="0.85"
               position="${LX - 0.42} ${RAIL_TOP - 0.05} 0"
               rotation="0 90 0"
               material="${M.rail}"></a-cylinder>`;

    // ── lane dividers ─────────────────────────────────────────────────────────
    html += `<a-cylinder radius="0.025" height="${PW}"
               position="0 -0.06 -4.2"
               rotation="0 0 90" material="${M.laneR}"></a-cylinder>`;
    html += `<a-cylinder radius="0.025" height="${PW}"
               position="0 -0.06  4.2"
               rotation="0 0 90" material="${M.laneB}"></a-cylinder>`;

    // ── toys (positions driven by tick) ──────────────────────────────────────
    // Flamingo — body r=0.5, neck starts at top of body (~y=0.45)
    // Neck: radius 0.13, height 0.55, tilted 20° on Z, centre at (0.08, 0.72, 0)
    //   top of neck: cx + sin(20°)*h/2 = 0.08+0.094=0.174, cy + cos(20°)*h/2 = 0.72+0.259=0.979
    // Head r=0.20 sits at neck top
    // Beak just forward of head centre
    html += `<a-entity id="pToyFlamingo" position="-7 0.1 -3">
               <a-sphere radius="0.5" position="0 0 0" material="${M.flamingo}"></a-sphere>
               <a-cylinder radius="0.13" height="0.55" position="0.08 0.72 0"
                 rotation="0 0 20" material="${M.flamingo}"></a-cylinder>
               <a-sphere radius="0.20" position="0.174 0.979 0" material="${M.flamingo}"></a-sphere>
               <a-cone radius-bottom="0.055" radius-top="0.01" height="0.22"
                 position="0.37 0.979 0" rotation="0 0 -90" material="${M.beak}"></a-cone>
             </a-entity>`;

    // Beach ball — stripes rotated flat (X=0) so they sit as horizontal bands like arm floaties
    // Three evenly-spaced horizontal colour bands around a yellow sphere
    html += `<a-entity id="pToyBall" position="5 0.38 -5">
               <a-sphere radius="0.38" material="${M.ballY}"></a-sphere>
               <a-torus radius="0.38" radius-tubular="0.055" rotation="0 0   0" position="0  0.18 0" material="${M.ballR}"></a-torus>
               <a-torus radius="0.38" radius-tubular="0.055" rotation="0 0   0" position="0  0.00 0" material="${M.ballB}"></a-torus>
               <a-torus radius="0.38" radius-tubular="0.055" rotation="0 0   0" position="0 -0.18 0" material="${M.ballG}"></a-torus>
             </a-entity>`;

    // Inflatable ring — orange base torus, white panels as 4 separate thin arcs rotated around Y
    // Each white arc is a torus with a short arc-length, spaced 90° apart between the orange sections
    html += `<a-entity id="pToyRing" position="3 0.05 2">
               <a-torus radius="0.65" radius-tubular="0.17" rotation="90 0 0" material="${M.ringO}"></a-torus>
               <a-torus radius="0.65" radius-tubular="0.09" rotation="90  45 0" arc="80" material="${M.ringW}"></a-torus>
               <a-torus radius="0.65" radius-tubular="0.09" rotation="90 135 0" arc="80" material="${M.ringW}"></a-torus>
               <a-torus radius="0.65" radius-tubular="0.09" rotation="90 225 0" arc="80" material="${M.ringW}"></a-torus>
               <a-torus radius="0.65" radius-tubular="0.09" rotation="90 315 0" arc="80" material="${M.ringW}"></a-torus>
             </a-entity>`;

    // Pool noodle — laid flat and horizontal on the water like a floating noodle
    html += `<a-entity id="pToyNoodle" position="-5 0.09 2">
               <a-cylinder radius="0.09" height="3.6"
                 rotation="90 40 0" material="${M.noodle}"></a-cylinder>
             </a-entity>`;

    // Rubber duck
    html += `<a-entity id="pToyDuck" position="7 0.2 1">
               <a-sphere radius="0.30" scale="1 0.75 1.1" material="${M.duck}"></a-sphere>
               <a-sphere radius="0.20" position="0.18 0.28 0" material="${M.duck}"></a-sphere>
               <a-cone radius-bottom="0.08" radius-top="0.03" height="0.20"
                 position="0.38 0.26 0" rotation="0 0 -90" material="${M.duckB}"></a-cone>
               <a-sphere radius="0.03" position="0.30 0.34 0.10" material="${M.duckE}"></a-sphere>
             </a-entity>`;

    root.innerHTML = html;
    this.el.appendChild(root);

    // build Three.js water mesh after scene loads
    this.el.sceneEl.addEventListener('loaded', () => { this._buildWater(); });

    // toy drift descriptors — Lissajous orbit params
    this._toys = [
      { id: 'pToyFlamingo', ox: -7.0, oz: -3.0, ax: 2.0, az: 1.8, sx: 0.28, sz: 0.22, ph: 0.00 },
      { id: 'pToyBall',     ox:  5.0, oz: -5.0, ax: 2.5, az: 2.2, sx: 0.34, sz: 0.27, ph: 1.10 },
      { id: 'pToyRing',     ox:  3.0, oz:  2.0, ax: 1.8, az: 2.0, sx: 0.20, sz: 0.18, ph: 2.30 },
      { id: 'pToyNoodle',   ox: -5.0, oz:  2.0, ax: 2.3, az: 1.6, sx: 0.16, sz: 0.21, ph: 3.70 },
      { id: 'pToyDuck',     ox:  7.0, oz:  1.0, ax: 1.6, az: 1.9, sx: 0.30, sz: 0.24, ph: 5.10 }
    ];
    this._toyEls = [];
    this._clock  = 0;
    this._bounds = { xMin: -11.0, xMax: 11.0, zMin: -7.0, zMax: 7.0 };
  },

  // ── build animated Three.js water mesh ────────────────────────────────────
  _buildWater: function () {
    const scene3 = this.el.sceneEl.object3D;
    const SEG = 80;

    const geo = new THREE.PlaneGeometry(23.6, 15.6, SEG, SEG);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0.0 },
        uDeep:   { value: new THREE.Color(0x096a92) },
        uShallow: { value: new THREE.Color(0x48c8f0) }
      },
      vertexShader: /* glsl */`
        uniform  float uTime;
        varying  float vWave;
        varying  vec2  vUv;

        float w(vec2 p, float sp, float fr, float am) {
          return sin(p.x * fr + uTime * sp) * cos(p.y * fr * 0.8 + uTime * sp * 0.72) * am;
        }

        void main() {
          vUv      = uv;
          vec3 pos = position;
          float wd = w(pos.xz, 1.80, 0.55, 0.11)
                   + w(pos.xz, 2.40, 1.10, 0.06)
                   + w(pos.xz, 1.10, 0.28, 0.14)
                   + w(pos.xz * 0.7 + 1.3, 3.0, 1.8, 0.03);
          pos.y  += wd;
          vWave   = wd;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3  uDeep;
        uniform vec3  uShallow;
        varying float vWave;
        varying vec2  vUv;

        void main() {
          float t       = clamp((vWave + 0.28) / 0.56, 0.0, 1.0);
          vec3  col     = mix(uDeep, uShallow, t);
          float caustic = abs(sin(vUv.x * 20.0 + uTime * 1.6)
                            * sin(vUv.y * 16.0 + uTime * 1.3));
          col += vec3(pow(caustic, 3.0) * 0.18);
          gl_FragColor  = vec4(col, 0.84);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this._waterMesh = new THREE.Mesh(geo, mat);
    this._waterMesh.position.set(0, 0, 0);
    this._waterMesh.receiveShadow = true;

    // apply parent root's world position/scale if needed
    const rootEl = this._root || this.el.querySelector('a-entity');
    if (rootEl && rootEl.object3D) {
      rootEl.object3D.add(this._waterMesh);
    } else {
      scene3.add(this._waterMesh);
    }
  },

  // ── analytical wave function (must match vertex shader exactly) ───────────
  _wave: function (px, pz, t) {
    function w(x, z, sp, fr, am) {
      return Math.sin(x * fr + t * sp) * Math.cos(z * fr * 0.8 + t * sp * 0.72) * am;
    }
    return w(px, pz, 1.80, 0.55, 0.11)
         + w(px, pz, 2.40, 1.10, 0.06)
         + w(px, pz, 1.10, 0.28, 0.14)
         + w(px * 0.7 + 1.3, pz * 0.7 + 1.3, 3.0, 1.8, 0.03);
  },

  // ── tick: animate water uniform + move toys ────────────────────────────────
  tick: function (time, delta) {
    this._clock += delta * 0.001;
    const t = this._clock;

    // update water shader
    if (this._waterMesh) {
      this._waterMesh.material.uniforms.uTime.value = t;
    }

    // lazy resolve toy elements
    if (this._toyEls.length === 0) {
      this._toys.forEach(td => {
        this._toyEls.push(document.getElementById(td.id));
      });
    }

    const B = this._bounds;

    this._toys.forEach((td, i) => {
      const el = this._toyEls[i];
      if (!el) return;

      // Lissajous drift — slow, dreamy
      const nx = td.ox + td.ax * Math.sin(t * td.sx + td.ph);
      const nz = td.oz + td.az * Math.cos(t * td.sz + td.ph * 1.4);
      const cx = Math.max(B.xMin, Math.min(B.xMax, nx));
      const cz = Math.max(B.zMin, Math.min(B.zMax, nz));

      // wave height + slope for tilt
      const wy  = this._waterMesh ? this._wave(cx, cz, t) : 0;
      const wdx = this._waterMesh ? this._wave(cx + 0.35, cz, t) - wy : 0;
      const wdz = this._waterMesh ? this._wave(cx, cz + 0.35, t) - wy : 0;

      const tiltX = -Math.atan2(wdz, 0.35) * (180 / Math.PI) * 0.55;
      const tiltZ =  Math.atan2(wdx, 0.35) * (180 / Math.PI) * 0.55;

      el.setAttribute('position', { x: cx, y: wy, z: cz });
      el.setAttribute('rotation', { x: tiltX, y: 0, z: tiltZ });
    });
  },

  remove: function () {
    if (this._waterMesh) {
      this._waterMesh.parent.remove(this._waterMesh);
      this._waterMesh.geometry.dispose();
      this._waterMesh.material.dispose();
    }
  }
});