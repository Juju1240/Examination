// Realistic flying birds for A-Frame beach scene
// Flight paths, timing, and all behavioral logic unchanged.
// Only visual geometry, proportions, and colors improved.

AFRAME.registerComponent('bird', {
  schema: {
    speed:  { type: 'number', default: 8 },
    height: { type: 'number', default: 25 },
    radius: { type: 'number', default: 40 },
    size:   { type: 'number', default: 1 },
    type:   { type: 'string', default: 'seagull' }
  },

  init: function () {
    const el   = this.el;
    const data = this.data;

    // ── Bird-type definitions ──────────────────────────────────────────────
    // Each entry now carries richer values for a more naturalistic look.
    // belly:  lighter ventral colour
    // mantle: darker dorsal / wing colour
    // tip:    dark wingtip stripe colour
    // beak:   beak colour
    // legs:   leg / foot colour
    // eye:    iris colour
    const birdTypes = {
      seagull:  {
        belly:  '#f4f4f2', mantle: '#d8d8d6', tip: '#1a1a1a',
        beak:   '#e8a020', legs:   '#e08010', eye: '#3a2a10',
        scale:  2.0, wingSpan: 1.2
      },
      pelican:  {
        belly:  '#f0ede0', mantle: '#c8c4a8', tip: '#222222',
        beak:   '#e05010', legs:   '#d06010', eye: '#603010',
        scale:  2.8, wingSpan: 1.5
      },
      tern:     {
        belly:  '#f8f8f8', mantle: '#404040', tip: '#1a1a1a',
        beak:   '#e03030', legs:   '#e03030', eye: '#1a0a0a',
        scale:  1.6, wingSpan: 1.1
      },
      albatross:{
        belly:  '#ffffff', mantle: '#c0c0b8', tip: '#111111',
        beak:   '#e8c040', legs:   '#d4b030', eye: '#3a2a00',
        scale:  2.6, wingSpan: 1.7
      }
    };

    const bt    = birdTypes[data.type] || birdTypes.seagull;
    const scale = bt.scale * data.size;

    // ── Root container ─────────────────────────────────────────────────────
    this.birdContainer = document.createElement('a-entity');
    el.appendChild(this.birdContainer);

    // ── Helper to create an element with a map of attributes ──────────────
    const make = (tag, attrs, parent) => {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      parent.appendChild(e);
      return e;
    };

    // ── BODY (elongated, tapered torpedo shape) ────────────────────────────
    // Main body — wider belly, tapers to tail
    make('a-cone', {
      'radius-bottom': '0.16',
      'radius-top':    '0.06',
      height:   '0.55',
      color:    bt.belly,
      position: '0 0 0',
      rotation: '-90 0 0'
    }, this.birdContainer);

    // Dorsal mantle overlay — darker top half
    make('a-cone', {
      'radius-bottom': '0.08',
      'radius-top':    '0.04',
      height:   '0.54',
      color:    bt.mantle,
      position: '0 0.07 0',
      rotation: '-90 0 0',
      scale:    '1 0.5 1'
    }, this.birdContainer);

    // ── HEAD ──────────────────────────────────────────────────────────────
    // Head sphere — slightly larger than previous version
    make('a-sphere', {
      radius:   '0.105',
      color:    bt.mantle,
      position: '0 0.06 0.36'
    }, this.birdContainer);

    // White face mask (belly colour)
    make('a-sphere', {
      radius:   '0.075',
      color:    bt.belly,
      position: '0 0.05 0.39',
      scale:    '0.9 0.9 1.1'
    }, this.birdContainer);

    // ── EYE (simple dark sphere + tiny white specular dot) ────────────────
    make('a-sphere', {
      radius:   '0.018',
      color:    bt.eye,
      position: '0.055 0.07 0.43'
    }, this.birdContainer);
    make('a-sphere', {
      radius:   '0.005',
      color:    '#ffffff',
      position: '0.065 0.075 0.445'
    }, this.birdContainer);
    // Mirrored eye
    make('a-sphere', {
      radius:   '0.018',
      color:    bt.eye,
      position: '-0.055 0.07 0.43'
    }, this.birdContainer);
    make('a-sphere', {
      radius:   '0.005',
      color:    '#ffffff',
      position: '-0.065 0.075 0.445'
    }, this.birdContainer);

    // ── BEAK (two-part: upper mandible + lower) ───────────────────────────
    // Upper mandible — slight hook at tip
    make('a-cone', {
      'radius-bottom': '0.022',
      'radius-top':    '0.004',
      height:   '0.14',
      color:    bt.beak,
      position: '0 0.056 0.455',
      rotation: '82 0 0'
    }, this.birdContainer);

    // Lower mandible (slightly shorter, slightly darker tone)
    make('a-cone', {
      'radius-bottom': '0.014',
      'radius-top':    '0.002',
      height:   '0.10',
      color:    bt.beak,
      position: '0 0.044 0.452',
      rotation: '85 0 0',
      scale:    '1 1 0.8'
    }, this.birdContainer);

    // ── NECK (short stubby connector head → body) ─────────────────────────
    make('a-sphere', {
      radius:   '0.09',
      color:    bt.belly,
      position: '0 0.04 0.27',
      scale:    '0.85 0.85 1.2'
    }, this.birdContainer);

    // ── TAIL (split fan — two slightly angled planes) ─────────────────────
    make('a-cone', {
      'radius-bottom': '0.12',
      'radius-top':    '0.01',
      height:   '0.30',
      color:    bt.mantle,
      position: '0.04 0 -0.30',
      rotation: '-108 4 0',
      scale:    '0.7 1 0.07'
    }, this.birdContainer);
    make('a-cone', {
      'radius-bottom': '0.12',
      'radius-top':    '0.01',
      height:   '0.30',
      color:    bt.mantle,
      position: '-0.04 0 -0.30',
      rotation: '-108 -4 0',
      scale:    '0.7 1 0.07'
    }, this.birdContainer);

    // ── LEGS (tucked in flight, barely visible) ───────────────────────────
    make('a-cylinder', {
      radius:   '0.018',
      height:   '0.13',
      color:    bt.legs,
      position: '0.055 -0.11 -0.02',
      rotation: '25 0 5'
    }, this.birdContainer);
    make('a-cylinder', {
      radius:   '0.018',
      height:   '0.13',
      color:    bt.legs,
      position: '-0.055 -0.11 -0.02',
      rotation: '25 0 -5'
    }, this.birdContainer);

    // ── WINGS ─────────────────────────────────────────────────────────────
    // Each wing has three segments: inner arm / outer arm / primary tip
    // giving a realistic tapered multi-panel silhouette.

    this.leftWingContainer  = document.createElement('a-entity');
    this.rightWingContainer = document.createElement('a-entity');
    this.leftWingContainer .setAttribute('position', '0.10 0.01 0.04');
    this.rightWingContainer.setAttribute('position', '-0.10 0.01 0.04');
    this.birdContainer.appendChild(this.leftWingContainer);
    this.birdContainer.appendChild(this.rightWingContainer);

    const buildWing = (container, side) => {
      const s = side === 'left' ? 1 : -1;

      // ── Inner wing (humeral/arm feathers) ──────────────────────────────
      // Broad, rounded leading edge
      make('a-cone', {
        'radius-bottom': '0.11',
        'radius-top':    '0.07',
        height:   '0.38',
        color:    bt.mantle,
        position: `${s * 0.20} 0 0`,
        rotation: `0 0 ${s * -22}`,
        scale:    '1 0.28 0.18'
      }, container);

      // Belly-side secondary panel (lighter)
      make('a-cone', {
        'radius-bottom': '0.09',
        'radius-top':    '0.06',
        height:   '0.36',
        color:    bt.belly,
        position: `${s * 0.20} -0.01 -0.01`,
        rotation: `0 0 ${s * -22}`,
        scale:    '0.85 0.22 0.12'
      }, container);

      // ── Outer wing (primary feathers region) ─────────────────────────
      const outerPivot = document.createElement('a-entity');
      outerPivot.setAttribute('position', `${s * 0.38} 0.01 -0.02`);
      container.appendChild(outerPivot);
      side === 'left'
        ? (this.leftOuterWing  = outerPivot)
        : (this.rightOuterWing = outerPivot);

      // Primary feather panel — longer, tapers sharply
      make('a-cone', {
        'radius-bottom': '0.06',
        'radius-top':    '0.008',
        height:   '0.44',
        color:    bt.mantle,
        position: `${s * 0.22} 0 0`,
        rotation: `0 ${s * 8} ${s * -12}`,
        scale:    '1 0.22 0.11'
      }, outerPivot);

      // Wingtip darkening (black tips on seagull / tern)
      make('a-cone', {
        'radius-bottom': '0.03',
        'radius-top':    '0.002',
        height:   '0.16',
        color:    bt.tip,
        position: `${s * 0.42} 0 -0.01`,
        rotation: `0 ${s * 10} ${s * -8}`,
        scale:    '1 0.18 0.09'
      }, outerPivot);
    };

    buildWing(this.leftWingContainer,  'left');
    buildWing(this.rightWingContainer, 'right');

    // ── Flight state vars — identical to original ─────────────────────────
    this.angle        = Math.random() * Math.PI * 2;
    this.time         = Math.random() * 100;
    this.centerX      = (Math.random() - 0.5) * 80;
    this.centerZ      = -30 + (Math.random() - 0.5) * 60;
    this.radiusX      = 25 + Math.random() * 50;
    this.radiusZ      = 20 + Math.random() * 40;
    this.heightBase   = data.height + (Math.random() - 0.5) * 15;
    this.speedVar     = 0.85 + Math.random() * 0.3;
    this.flapPhase    = Math.random() * Math.PI * 2;
    this.glideTimer   = 0;
    this.isGliding    = false;
    this.glideDuration = 0;
    this.nextGlideTime = 3 + Math.random() * 5;

    el.setAttribute('scale', `${scale} ${scale} ${scale}`);
  },

  // ── TICK — identical logic to original ───────────────────────────────────
  tick: function (time, delta) {
    const data = this.data;
    const dt   = delta / 1000;

    this.time += dt;
    this.angle += data.speed * this.speedVar * dt * 0.008;

    const pathVariation = Math.sin(this.time * 0.3) * 0.3;
    const x = this.centerX + Math.cos(this.angle) * this.radiusX * (1 + pathVariation * 0.2);
    const z = this.centerZ + Math.sin(this.angle) * this.radiusZ;

    const thermalRise = Math.sin(this.time * 0.4 + this.angle) * 3;
    const windEffect  = Math.sin(this.time * 0.7) * 1.5;
    const y           = this.heightBase + thermalRise + windEffect;

    const prevX = this.centerX + Math.cos(this.angle - 0.01) * this.radiusX;
    const prevZ = this.centerZ + Math.sin(this.angle - 0.01) * this.radiusZ;
    const dx    = x - prevX;
    const dz    = z - prevZ;
    const facingAngle = Math.atan2(dx, dz) * 180 / Math.PI;

    const turnRate = Math.cos(this.angle * 2) * 25;

    this.glideTimer += dt;
    if (this.glideTimer > this.nextGlideTime && !this.isGliding) {
      this.isGliding     = true;
      this.glideDuration = 1 + Math.random() * 2;
      this.glideTimer    = 0;
    }
    if (this.isGliding && this.glideTimer > this.glideDuration) {
      this.isGliding     = false;
      this.glideTimer    = 0;
      this.nextGlideTime = 2 + Math.random() * 4;
    }

    let flapAngle, innerFlap, outerFlap;

    if (this.isGliding) {
      const glideAdjust = Math.sin(this.time * 2) * 3;
      flapAngle  = 15 + glideAdjust;
      innerFlap  = 20 + glideAdjust * 0.5;
      outerFlap  = 5  + glideAdjust;
    } else {
      const wingSpeed = data.type === 'albatross' ? 6 : (data.type === 'tern' ? 14 : 11);
      this.flapPhase += wingSpeed * dt;

      let normalizedPhase   = (Math.sin(this.flapPhase) + 1) / 2;
      const asymmetricPhase = Math.pow(normalizedPhase, 0.6);
      flapAngle  = 10 + asymmetricPhase * 50;
      innerFlap  = 15 + Math.sin(this.flapPhase - 0.2) * 20;
      outerFlap  = Math.sin(this.flapPhase + 0.3) * 35;
    }

    const bankAngle = turnRate * 1.5;

    this.leftWingContainer .setAttribute('rotation', { x: flapAngle * 0.3, y: 0, z: -innerFlap - bankAngle * 0.5 });
    this.rightWingContainer.setAttribute('rotation', { x: flapAngle * 0.3, y: 0, z:  innerFlap - bankAngle * 0.5 });

    this.leftOuterWing .setAttribute('rotation', { x: 0, y:  10 + outerFlap * 0.2, z: -15 + outerFlap * 0.3 });
    this.rightOuterWing.setAttribute('rotation', { x: 0, y: -10 - outerFlap * 0.2, z:  15 - outerFlap * 0.3 });

    const pitch = this.isGliding ? -5 : Math.sin(this.flapPhase || 0) * 8;
    this.el.setAttribute('position', { x, y, z });
    this.el.setAttribute('rotation', {
      x: pitch + bankAngle * 0.2,
      y: facingAngle,
      z: -bankAngle
    });
  }
});


// ── Bird flock manager — unchanged ────────────────────────────────────────────
AFRAME.registerComponent('bird-flock', {
  schema: {
    count: { type: 'int', default: 8 }
  },

  init: function () {
    const el        = this.el;
    const birdTypes = ['seagull', 'pelican', 'tern', 'albatross'];

    for (let i = 0; i < this.data.count; i++) {
      const bird     = document.createElement('a-entity');
      const birdType = birdTypes[i % birdTypes.length];

      bird.setAttribute('bird', {
        speed:  6 + Math.random() * 6,
        height: 20 + Math.random() * 20,
        radius: 30 + Math.random() * 40,
        size:   0.6 + Math.random() * 0.8,
        type:   birdType
      });
      bird.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });
      el.appendChild(bird);
    }
  }
});


// ── Distant small birds — improved silhouette, same behaviour ─────────────────
AFRAME.registerComponent('distant-bird', {
  schema: {
    speed:  { type: 'number', default: 15 },
    height: { type: 'number', default: 45 },
    startX: { type: 'number', default: -100 },
    endX:   { type: 'number', default:  100 }
  },

  init: function () {
    const el        = this.el;
    const birdColor = '#1e1e1e';

    // Wing pivot containers
    this.leftWing  = document.createElement('a-entity');
    this.rightWing = document.createElement('a-entity');
    this.leftWing .setAttribute('position', '0.18 0 0');
    this.rightWing.setAttribute('position', '-0.18 0 0');
    el.appendChild(this.leftWing);
    el.appendChild(this.rightWing);

    // Inner wing panel
    const makeWingPanel = (container, side) => {
      const s = side === 'left' ? 1 : -1;

      // Inner panel
      const inner = document.createElement('a-cone');
      inner.setAttribute('radius-bottom', '0.055');
      inner.setAttribute('radius-top',    '0.008');
      inner.setAttribute('height',        '0.34');
      inner.setAttribute('color',         birdColor);
      inner.setAttribute('rotation',      `0 0 ${s * -20}`);
      inner.setAttribute('scale',         '0.28 1 0.12');
      container.appendChild(inner);

      // Outer primary panel (stored for flex animation)
      const outer = document.createElement('a-entity');
      outer.setAttribute('position', `${s * 0.32} 0 0`);
      container.appendChild(outer);

      const tip = document.createElement('a-cone');
      tip.setAttribute('radius-bottom', '0.030');
      tip.setAttribute('radius-top',    '0.002');
      tip.setAttribute('height',        '0.30');
      tip.setAttribute('color',         birdColor);
      tip.setAttribute('rotation',      `0 0 ${s * -10}`);
      tip.setAttribute('scale',         '0.22 1 0.10');
      outer.appendChild(tip);

      return outer;
    };

    this.leftOuterTip  = makeWingPanel(this.leftWing,  'left');
    this.rightOuterTip = makeWingPanel(this.rightWing, 'right');

    // Body — slim streamlined ellipsoid
    const body = document.createElement('a-sphere');
    body.setAttribute('radius', '0.055');
    body.setAttribute('scale',  '1 0.55 2.2');
    body.setAttribute('color',  birdColor);
    el.appendChild(body);

    // Head nub
    const head = document.createElement('a-sphere');
    head.setAttribute('radius', '0.038');
    head.setAttribute('color',  birdColor);
    head.setAttribute('position', '0 0.01 0.14');
    el.appendChild(head);

    // Tail wedge
    const tail = document.createElement('a-cone');
    tail.setAttribute('radius-bottom', '0.03');
    tail.setAttribute('radius-top',    '0.002');
    tail.setAttribute('height',        '0.18');
    tail.setAttribute('color',         birdColor);
    tail.setAttribute('position',      '0 -0.005 -0.19');
    tail.setAttribute('rotation',      '-95 0 0');
    tail.setAttribute('scale',         '0.6 1 0.06');
    el.appendChild(tail);

    // State
    this.x         = this.data.startX;
    this.z         = -60 + Math.random() * 40;
    this.y         = this.data.height + Math.random() * 10;
    this.time      = Math.random() * 100;
    this.flapSpeed = 8 + Math.random() * 6;
  },

  tick: function (time, delta) {
    const data = this.data;
    const dt   = delta / 1000;

    this.time += dt;
    this.x    += data.speed * dt;

    const y = this.y + Math.sin(this.time * 0.3) * 0.5;

    // Wing flap — same angles as original
    const wingAngle = 20 + Math.sin(this.time * this.flapSpeed) * 15;
    this.leftWing .setAttribute('rotation', { x: 0, y: 0, z: -wingAngle });
    this.rightWing.setAttribute('rotation', { x: 0, y: 0, z:  wingAngle });

    // Outer tip droops slightly on upstroke
    const tipFlex = Math.sin(this.time * this.flapSpeed + 0.4) * 10;
    this.leftOuterTip .setAttribute('rotation', { x: 0, y: 0, z: -tipFlex });
    this.rightOuterTip.setAttribute('rotation', { x: 0, y: 0, z:  tipFlex });

    if (this.x > data.endX) {
      this.x = data.startX;
      this.z = -60 + Math.random() * 40;
      this.y = data.height + Math.random() * 10;
    }

    const glide = Math.sin(this.time * 0.5) * 2;
    this.el.setAttribute('position', { x: this.x, y, z: this.z });
    this.el.setAttribute('rotation', { x: glide, y: 90, z: 0 });
  }
});