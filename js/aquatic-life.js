// Aquatic life for the ocean - fish, dolphins, and other sea creatures
AFRAME.registerComponent('aquatic-life', {
  schema: {
    count: { type: 'int', default: 30 },
    type: { type: 'string', default: 'mixed' }, // mixed, fish, dolphin, turtle
    rangeX: { type: 'number', default: 150 },
    rangeZ: { type: 'number', default: 150 },
    waterLevel: { type: 'number', default: -0.5 }
  },

  init: function() {
    const el = this.el;
    const data = this.data;
    
    const creatures = [];
    const types = data.type === 'mixed' ? ['fish', 'fish', 'fish', 'fish', 'dolphin', 'turtle'] : [data.type];
    
    for (let i = 0; i < data.count; i++) {
      const creatureType = types[Math.floor(Math.random() * types.length)];
      const creature = document.createElement('a-entity');
      creature.setAttribute(creatureType === 'fish' ? 'swimming-fish' : creatureType === 'dolphin' ? 'dolphin' : 'sea-turtle', {
        x: (Math.random() - 0.5) * data.rangeX,
        z: -30 - Math.random() * data.rangeZ,
        y: data.waterLevel - 2 - Math.random() * 8,
        speed: 3 + Math.random() * 4
      });
      el.appendChild(creature);
      creatures.push(creature);
    }
    
    this.creatures = creatures;
  }
});

// Individual swimming fish
AFRAME.registerComponent('swimming-fish', {
  schema: {
    x: { type: 'number', default: 0 },
    z: { type: 'number', default: -50 },
    y: { type: 'number', default: -3 },
    speed: { type: 'number', default: 5 },
    size: { type: 'number', default: 1 }
  },

  init: function() {
    const el = this.el;
    const data = this.data;
    
    // Fish species with different colors and sizes
    const fishTypes = {
      tropical: { body: '#ff6b6b', stripe: '#ffd93d', scale: 0.8 },
      blue: { body: '#4ecdc4', stripe: '#ffffff', scale: 1 },
      yellow: { body: '#ffe66d', stripe: '#ff8c42', scale: 0.7 },
      purple: { body: '#a855f7', stripe: '#e9d5ff', scale: 0.9 }
    };
    
    const fishType = Object.keys(fishTypes)[Math.floor(Math.random() * 4)];
    const colors = fishTypes[fishType];
    const scale = colors.scale * (0.6 + Math.random() * 0.6) * data.size;
    
    // Fish container
    this.fishContainer = document.createElement('a-entity');
    el.appendChild(this.fishContainer);
    
    // Fish body - streamlined shape
    const body = document.createElement('a-cone');
    body.setAttribute('radius-bottom', '0.12');
    body.setAttribute('radius-top', '0.04');
    body.setAttribute('height', '0.5');
    body.setAttribute('color', colors.body);
    body.setAttribute('rotation', '-90 0 0');
    body.setAttribute('scale', '1 0.7 1');
    this.fishContainer.appendChild(body);
    
    // Stripe on body
    const stripe = document.createElement('a-torus');
    stripe.setAttribute('radius', '0.11');
    stripe.setAttribute('radius-tubular', '0.02');
    stripe.setAttribute('arc', '180');
    stripe.setAttribute('color', colors.stripe);
    stripe.setAttribute('position', '0 0 0');
    stripe.setAttribute('rotation', '0 0 90');
    stripe.setAttribute('scale', '1 0.7 1');
    this.fishContainer.appendChild(stripe);
    
    // Side fins
    const leftFin = document.createElement('a-cone');
    leftFin.setAttribute('radius-bottom', '0.06');
    leftFin.setAttribute('radius-top', '0.01');
    leftFin.setAttribute('height', '0.2');
    leftFin.setAttribute('color', colors.body);
    leftFin.setAttribute('position', '0.08 -0.02 0.05');
    leftFin.setAttribute('rotation', '0 0 -40');
    leftFin.setAttribute('scale', '0.3 1 0.15');
    this.fishContainer.appendChild(leftFin);
    
    const rightFin = document.createElement('a-cone');
    rightFin.setAttribute('radius-bottom', '0.06');
    rightFin.setAttribute('radius-top', '0.01');
    rightFin.setAttribute('height', '0.2');
    rightFin.setAttribute('color', colors.body);
    rightFin.setAttribute('position', '-0.08 -0.02 0.05');
    rightFin.setAttribute('rotation', '0 0 40');
    rightFin.setAttribute('scale', '0.3 1 0.15');
    this.fishContainer.appendChild(rightFin);
    
    // Tail fin container for animation
    this.tailContainer = document.createElement('a-entity');
    this.tailContainer.setAttribute('position', '0 0 -0.28');
    this.fishContainer.appendChild(this.tailContainer);
    
    // Tail fin
    const tail = document.createElement('a-cone');
    tail.setAttribute('radius-bottom', '0.1');
    tail.setAttribute('radius-top', '0.01');
    tail.setAttribute('height', '0.25');
    tail.setAttribute('color', colors.stripe);
    tail.setAttribute('rotation', '-90 0 0');
    tail.setAttribute('scale', '0.6 1 0.1');
    this.tailContainer.appendChild(tail);
    
    // Eyes
    const leftEye = document.createElement('a-sphere');
    leftEye.setAttribute('radius', '0.025');
    leftEye.setAttribute('color', '#000000');
    leftEye.setAttribute('position', '0.06 0.03 0.18');
    this.fishContainer.appendChild(leftEye);
    
    const rightEye = document.createElement('a-sphere');
    rightEye.setAttribute('radius', '0.025');
    rightEye.setAttribute('color', '#000000');
    rightEye.setAttribute('position', '-0.06 0.03 0.18');
    this.fishContainer.appendChild(rightEye);
    
    // Movement state
    this.posX = data.x;
    this.posY = data.y;
    this.posZ = data.z;
    this.angle = Math.random() * Math.PI * 2;
    this.turnRate = 0;
    this.targetAngle = this.angle;
    
    // Swimming animation
    this.tailPhase = Math.random() * Math.PI * 2;
    this.finPhase = Math.random() * Math.PI * 2;
    
    el.setAttribute('scale', `${scale} ${scale} ${scale}`);
    el.setAttribute('position', { x: this.posX, y: this.posY, z: this.posZ });
  },

  tick: function(time, delta) {
    const dt = delta / 1000;
    const data = this.data;
    
    // Random direction changes
    if (Math.random() < 0.005) {
      this.targetAngle = Math.random() * Math.PI * 2;
    }
    
    // Smooth turning
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.turnRate = angleDiff * 2;
    this.angle += this.turnRate * dt;
    
    // Move forward
    const speed = data.speed * (1 + Math.sin(time * 0.001) * 0.2);
    this.posX += Math.sin(this.angle) * speed * dt;
    this.posZ += Math.cos(this.angle) * speed * dt;
    
    // Vertical bobbing
    this.posY += Math.sin(time * 0.002 + this.tailPhase) * 0.3 * dt;
    
    // Boundary check - turn back if too far
    const distFromCenter = Math.sqrt(this.posX * this.posX + (this.posZ + 80) * (this.posZ + 80));
    if (distFromCenter > 100) {
      this.targetAngle = Math.atan2(-this.posX, -80 - this.posZ);
    }
    
    // Tail wag animation
    this.tailPhase += 15 * dt;
    const tailAngle = Math.sin(this.tailPhase) * 25;
    this.tailContainer.setAttribute('rotation', { x: 0, y: tailAngle, z: 0 });
    
    // Update position and rotation
    const facingAngle = this.angle * 180 / Math.PI;
    const bankAngle = this.turnRate * 5;
    
    this.el.setAttribute('position', { x: this.posX, y: this.posY, z: this.posZ });
    this.el.setAttribute('rotation', { x: -bankAngle * 0.5, y: facingAngle, z: bankAngle });
  }
});

// Dolphins - larger, faster, with breaching behavior
AFRAME.registerComponent('dolphin', {
  schema: {
    x: { type: 'number', default: 0 },
    z: { type: 'number', default: -80 },
    y: { type: 'number', default: -2 },
    speed: { type: 'number', default: 12 }
  },

  init: function() {
    const el = this.el;
    
    // Dolphin container
    this.dolphinContainer = document.createElement('a-entity');
    el.appendChild(this.dolphinContainer);
    
    // Main body - elongated torpedo shape
    const body = document.createElement('a-cone');
    body.setAttribute('radius-bottom', '0.35');
    body.setAttribute('radius-top', '0.08');
    body.setAttribute('height', '1.8');
    body.setAttribute('color', '#6b7280');
    body.setAttribute('rotation', '-90 0 0');
    body.setAttribute('scale', '1 0.6 1');
    this.dolphinContainer.appendChild(body);
    
    // Lighter belly
    const belly = document.createElement('a-cone');
    belly.setAttribute('radius-bottom', '0.25');
    belly.setAttribute('radius-top', '0.06');
    belly.setAttribute('height', '1.6');
    belly.setAttribute('color', '#d1d5db');
    belly.setAttribute('rotation', '-90 0 0');
    belly.setAttribute('position', '0 -0.12 0');
    belly.setAttribute('scale', '0.9 0.5 0.9');
    this.dolphinContainer.appendChild(belly);
    
    // Dorsal fin
    const dorsalFin = document.createElement('a-cone');
    dorsalFin.setAttribute('radius-bottom', '0.15');
    dorsalFin.setAttribute('radius-top', '0.02');
    dorsalFin.setAttribute('height', '0.4');
    dorsalFin.setAttribute('color', '#6b7280');
    dorsalFin.setAttribute('position', '0 0.35 -0.1');
    dorsalFin.setAttribute('rotation', '-20 0 0');
    dorsalFin.setAttribute('scale', '0.3 1 0.15');
    this.dolphinContainer.appendChild(dorsalFin);
    
    // Pectoral fins
    const leftFin = document.createElement('a-cone');
    leftFin.setAttribute('radius-bottom', '0.18');
    leftFin.setAttribute('radius-top', '0.03');
    leftFin.setAttribute('height', '0.5');
    leftFin.setAttribute('color', '#6b7280');
    leftFin.setAttribute('position', '0.25 -0.05 0.2');
    leftFin.setAttribute('rotation', '0 0 -60');
    leftFin.setAttribute('scale', '0.4 1 0.15');
    this.dolphinContainer.appendChild(leftFin);
    
    const rightFin = document.createElement('a-cone');
    rightFin.setAttribute('radius-bottom', '0.18');
    rightFin.setAttribute('radius-top', '0.03');
    rightFin.setAttribute('height', '0.5');
    rightFin.setAttribute('color', '#6b7280');
    rightFin.setAttribute('position', '-0.25 -0.05 0.2');
    rightFin.setAttribute('rotation', '0 0 60');
    rightFin.setAttribute('scale', '0.4 1 0.15');
    this.dolphinContainer.appendChild(rightFin);
    
    // Tail fluke container
    this.flukeContainer = document.createElement('a-entity');
    this.flukeContainer.setAttribute('position', '0 0 -1');
    this.dolphinContainer.appendChild(this.flukeContainer);
    
    // Tail flukes
    const leftFluke = document.createElement('a-cone');
    leftFluke.setAttribute('radius-bottom', '0.12');
    leftFluke.setAttribute('radius-top', '0.02');
    leftFluke.setAttribute('height', '0.4');
    leftFluke.setAttribute('color', '#6b7280');
    leftFluke.setAttribute('position', '0.2 0 -0.1');
    leftFluke.setAttribute('rotation', '-30 0 -30');
    leftFluke.setAttribute('scale', '0.5 1 0.1');
    this.flukeContainer.appendChild(leftFluke);
    
    const rightFluke = document.createElement('a-cone');
    rightFluke.setAttribute('radius-bottom', '0.12');
    rightFluke.setAttribute('radius-top', '0.02');
    rightFluke.setAttribute('height', '0.4');
    rightFluke.setAttribute('color', '#6b7280');
    rightFluke.setAttribute('position', '-0.2 0 -0.1');
    rightFluke.setAttribute('rotation', '-30 0 30');
    rightFluke.setAttribute('scale', '0.5 1 0.1');
    this.flukeContainer.appendChild(rightFluke);
    
    // Beak/snout
    const beak = document.createElement('a-cone');
    beak.setAttribute('radius-bottom', '0.08');
    beak.setAttribute('radius-top', '0.02');
    beak.setAttribute('height', '0.25');
    beak.setAttribute('color', '#4b5563');
    beak.setAttribute('position', '0 0 1');
    beak.setAttribute('rotation', '-90 0 0');
    this.dolphinContainer.appendChild(beak);
    
    // Blowhole
    const blowhole = document.createElement('a-circle');
    blowhole.setAttribute('radius', '0.03');
    blowhole.setAttribute('color', '#374151');
    blowhole.setAttribute('position', '0 0.18 -0.3');
    blowhole.setAttribute('rotation', '-90 0 0');
    this.dolphinContainer.appendChild(blowhole);
    
    // Movement state
    this.posX = this.data.x;
    this.posY = this.data.y;
    this.posZ = this.data.z;
    this.angle = Math.random() * Math.PI * 2;
    
    // Breaching state
    this.isBreaching = false;
    this.breachPhase = 0;
    this.nextBreachTime = 5 + Math.random() * 10;
    this.breachTimer = 0;
    
    // Animation
    this.flukePhase = Math.random() * Math.PI * 2;
    
    el.setAttribute('scale', '2 2 2');
  },

  tick: function(time, delta) {
    const dt = delta / 1000;
    const data = this.data;
    
    this.breachTimer += dt;
    
    // Start breach occasionally
    if (!this.isBreaching && this.breachTimer > this.nextBreachTime && Math.random() < 0.3) {
      this.isBreaching = true;
      this.breachPhase = 0;
      this.breachTimer = 0;
      this.nextBreachTime = 8 + Math.random() * 15;
    }
    
    // Normal swimming or breaching
    if (this.isBreaching) {
      this.breachPhase += dt * 0.8;
      
      // Breach arc movement
      const breachProgress = Math.min(this.breachPhase, Math.PI);
      this.posY = data.y + Math.sin(breachProgress) * 4;
      
      // Forward movement during breach
      this.posX += Math.sin(this.angle) * data.speed * 1.5 * dt;
      this.posZ += Math.cos(this.angle) * data.speed * 1.5 * dt;
      
      // Pitch up during breach ascent, down during descent
      const breachPitch = Math.cos(breachProgress) * 60;
      
      if (this.breachPhase > Math.PI) {
        this.isBreaching = false;
        this.posY = data.y;
      }
      
      this.el.setAttribute('rotation', { 
        x: breachPitch, 
        y: this.angle * 180 / Math.PI, 
        z: 0 
      });
    } else {
      // Normal swimming
      this.posX += Math.sin(this.angle) * data.speed * dt;
      this.posZ += Math.cos(this.angle) * data.speed * dt;
      this.posY = data.y + Math.sin(time * 0.001) * 0.5;
      
      // Gentle turning
      if (Math.random() < 0.01) {
        this.angle += (Math.random() - 0.5) * 0.5;
      }
      
      // Boundary check
      const distFromCenter = Math.sqrt(this.posX * this.posX + (this.posZ + 100) * (this.posZ + 100));
      if (distFromCenter > 120) {
        this.angle = Math.atan2(-this.posX, -100 - this.posZ);
      }
      
      this.el.setAttribute('rotation', { 
        x: Math.sin(time * 0.003) * 5, 
        y: this.angle * 180 / Math.PI, 
        z: 0 
      });
    }
    
    // Tail fluke animation
    this.flukePhase += 8 * dt;
    const flukeAngle = Math.sin(this.flukePhase) * 20;
    this.flukeContainer.setAttribute('rotation', { x: 0, y: flukeAngle, z: 0 });
    
    this.el.setAttribute('position', { x: this.posX, y: this.posY, z: this.posZ });
  }
});

// Sea turtles - slow, graceful swimmers
AFRAME.registerComponent('sea-turtle', {
  schema: {
    x: { type: 'number', default: 0 },
    z: { type: 'number', default: -60 },
    y: { type: 'number', default: -4 },
    speed: { type: 'number', default: 2 }
  },

  init: function() {
    const el = this.el;
    
    // Turtle container
    this.turtleContainer = document.createElement('a-entity');
    el.appendChild(this.turtleContainer);
    
    // Shell - flattened dome
    const shell = document.createElement('a-sphere');
    shell.setAttribute('radius', '0.5');
    shell.setAttribute('color', '#5d4e37');
    shell.setAttribute('scale', '1 0.4 1.2');
    shell.setAttribute('position', '0 0.1 0');
    this.turtleContainer.appendChild(shell);
    
    // Shell pattern (scutes)
    for (let i = 0; i < 5; i++) {
      const scute = document.createElement('a-circle');
      scute.setAttribute('radius', '0.12');
      scute.setAttribute('color', '#4a3f2d');
      scute.setAttribute('position', `0 0.31 ${-0.3 + i * 0.15}`);
      scute.setAttribute('rotation', '-90 0 0');
      scute.setAttribute('scale', '1 0.8 1');
      this.turtleContainer.appendChild(scute);
    }
    
    // Head
    const head = document.createElement('a-sphere');
    head.setAttribute('radius', '0.18');
    head.setAttribute('color', '#6b8e6b');
    head.setAttribute('position', '0 0.05 0.65');
    head.setAttribute('scale', '0.8 0.7 1');
    this.turtleContainer.appendChild(head);
    
    // Eyes
    const leftEye = document.createElement('a-sphere');
    leftEye.setAttribute('radius', '0.03');
    leftEye.setAttribute('color', '#000000');
    leftEye.setAttribute('position', '0.08 0.12 0.72');
    this.turtleContainer.appendChild(leftEye);
    
    const rightEye = document.createElement('a-sphere');
    rightEye.setAttribute('radius', '0.03');
    rightEye.setAttribute('color', '#000000');
    rightEye.setAttribute('position', '-0.08 0.12 0.72');
    this.turtleContainer.appendChild(rightEye);
    
    // Front flippers - large paddles
    this.leftFrontFlipper = document.createElement('a-entity');
    this.leftFrontFlipper.setAttribute('position', '0.45 -0.05 0.2');
    this.turtleContainer.appendChild(this.leftFrontFlipper);
    
    const leftFlipperShape = document.createElement('a-cone');
    leftFlipperShape.setAttribute('radius-bottom', '0.25');
    leftFlipperShape.setAttribute('radius-top', '0.05');
    leftFlipperShape.setAttribute('height', '0.7');
    leftFlipperShape.setAttribute('color', '#6b8e6b');
    leftFlipperShape.setAttribute('rotation', '0 0 -50');
    leftFlipperShape.setAttribute('scale', '0.4 1 0.1');
    this.leftFrontFlipper.appendChild(leftFlipperShape);
    
    this.rightFrontFlipper = document.createElement('a-entity');
    this.rightFrontFlipper.setAttribute('position', '-0.45 -0.05 0.2');
    this.turtleContainer.appendChild(this.rightFrontFlipper);
    
    const rightFlipperShape = document.createElement('a-cone');
    rightFlipperShape.setAttribute('radius-bottom', '0.25');
    rightFlipperShape.setAttribute('radius-top', '0.05');
    rightFlipperShape.setAttribute('height', '0.7');
    rightFlipperShape.setAttribute('color', '#6b8e6b');
    rightFlipperShape.setAttribute('rotation', '0 0 50');
    rightFlipperShape.setAttribute('scale', '0.4 1 0.1');
    this.rightFrontFlipper.appendChild(rightFlipperShape);
    
    // Rear flippers
    this.leftRearFlipper = document.createElement('a-entity');
    this.leftRearFlipper.setAttribute('position', '0.3 -0.05 -0.5');
    this.turtleContainer.appendChild(this.leftRearFlipper);
    
    const leftRearShape = document.createElement('a-cone');
    leftRearShape.setAttribute('radius-bottom', '0.12');
    leftRearShape.setAttribute('radius-top', '0.03');
    leftRearShape.setAttribute('height', '0.35');
    leftRearShape.setAttribute('color', '#6b8e6b');
    leftRearShape.setAttribute('rotation', '0 0 -30');
    leftRearShape.setAttribute('scale', '0.5 1 0.15');
    this.leftRearFlipper.appendChild(leftRearShape);
    
    this.rightRearFlipper = document.createElement('a-entity');
    this.rightRearFlipper.setAttribute('position', '-0.3 -0.05 -0.5');
    this.turtleContainer.appendChild(this.rightRearFlipper);
    
    const rightRearShape = document.createElement('a-cone');
    rightRearShape.setAttribute('radius-bottom', '0.12');
    rightRearShape.setAttribute('radius-top', '0.03');
    rightRearShape.setAttribute('height', '0.35');
    rightRearShape.setAttribute('color', '#6b8e6b');
    rightRearShape.setAttribute('rotation', '0 0 30');
    rightRearShape.setAttribute('scale', '0.5 1 0.15');
    this.rightRearFlipper.appendChild(rightRearShape);
    
    // Movement state
    this.posX = this.data.x;
    this.posY = this.data.y;
    this.posZ = this.data.z;
    this.angle = Math.random() * Math.PI * 2;
    
    // Flipper animation
    this.flipperPhase = Math.random() * Math.PI * 2;
    
    el.setAttribute('scale', '2.5 2.5 2.5');
  },

  tick: function(time, delta) {
    const dt = delta / 1000;
    const data = this.data;
    
    // Slow, steady movement
    this.posX += Math.sin(this.angle) * data.speed * dt;
    this.posZ += Math.cos(this.angle) * data.speed * dt;
    
    // Very slow direction changes
    if (Math.random() < 0.002) {
      this.angle += (Math.random() - 0.5) * 0.3;
    }
    
    // Gentle vertical movement
    this.posY = data.y + Math.sin(time * 0.0005) * 0.8;
    
    // Boundary check
    const distFromCenter = Math.sqrt(this.posX * this.posX + (this.posZ + 80) * (this.posZ + 80));
    if (distFromCenter > 100) {
      this.angle = Math.atan2(-this.posX, -80 - this.posZ);
    }
    
    // Slow flipper strokes (alternating)
    this.flipperPhase += 2 * dt;
    const flipperAngle = Math.sin(this.flipperPhase) * 35;
    
    // Front flippers - powerful strokes
    this.leftFrontFlipper.setAttribute('rotation', { 
      x: flipperAngle * 0.3, 
      y: flipperAngle * 0.2, 
      z: -30 + flipperAngle 
    });
    this.rightFrontFlipper.setAttribute('rotation', { 
      x: -flipperAngle * 0.3, 
      y: -flipperAngle * 0.2, 
      z: 30 - flipperAngle 
    });
    
    // Rear flippers - follow front with delay
    const rearAngle = Math.sin(this.flipperPhase - 0.5) * 20;
    this.leftRearFlipper.setAttribute('rotation', { 
      x: rearAngle * 0.2, 
      y: 0, 
      z: -20 + rearAngle 
    });
    this.rightRearFlipper.setAttribute('rotation', { 
      x: -rearAngle * 0.2, 
      y: 0, 
      z: 20 - rearAngle 
    });
    
    // Slight pitch and roll
    const pitch = Math.sin(this.flipperPhase) * 8;
    const roll = Math.cos(this.flipperPhase * 0.7) * 5;
    
    this.el.setAttribute('position', { x: this.posX, y: this.posY, z: this.posZ });
    this.el.setAttribute('rotation', { 
      x: pitch, 
      y: this.angle * 180 / Math.PI, 
      z: roll 
    });
  }
});
