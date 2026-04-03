// Teleport Controls for VR locomotion
AFRAME.registerComponent('teleport-controls', {
    schema: {
        cameraRig: { type: 'selector', default: '' },
        teleportOrigin: { type: 'selector', default: '' },
        button: { default: 'thumbstick' },
        curve: { default: 'line' },
        collisionEntities: { default: '' },
        maxDistance: { default: 25 },
        landingNormal: { type: 'vec3', default: { x: 0, y: 1, z: 0 } },
        hitNormal: { type: 'vec3', default: { x: 0, y: 1, z: 0 } }
    },

    init: function() {
        this.active = false;
        this.origin = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.line = null;
        this.hitPoint = null;
        this.raycaster = new THREE.Raycaster();
        this.collisionEntities = [];
        
        this.createTeleportLine();
        this.setupEventListeners();
    },

    createTeleportLine: function() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(20 * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        this.line = new THREE.Line(geometry, material);
        this.line.frustumCulled = false;
        this.line.visible = false;
        this.el.sceneEl.object3D.add(this.line);
    },

    setupEventListeners: function() {
        const self = this;
        const el = this.el;
        
        el.addEventListener('axismove', function(evt) {
            const axis = evt.detail.axis;
            const button = self.data.button;
            
            if (button === 'thumbstick' || button === 'trackpad') {
                const y = axis[1] || axis[3] || 0;
                
                if (y < -0.5 && !self.active) {
                    self.active = true;
                    self.startTeleport();
                } else if (y > -0.3 && self.active) {
                    self.active = false;
                    self.endTeleport();
                }
            }
        });

        el.addEventListener('buttondown', function(evt) {
            if (self.data.button === 'trigger' && evt.detail.id === 0) {
                self.active = true;
                self.startTeleport();
            }
        });

        el.addEventListener('buttonup', function(evt) {
            if (self.data.button === 'trigger' && evt.detail.id === 0) {
                self.active = false;
                self.endTeleport();
            }
        });
    },

    startTeleport: function() {
        this.line.visible = true;
    },

    endTeleport: function() {
        this.line.visible = false;
        
        if (this.hitPoint && this.data.cameraRig) {
            const rig = this.data.cameraRig;
            const currentPos = rig.getAttribute('position');
            
            rig.setAttribute('position', {
                x: this.hitPoint.x,
                y: this.hitPoint.y,
                z: this.hitPoint.z
            });
        }
    },

    tick: function() {
        if (!this.active) return;

        const hand = this.el.object3D;
        hand.getWorldPosition(this.origin);
        hand.getWorldDirection(this.direction);
        this.direction.multiplyScalar(-1);

        const curve = this.calculateCurve();
        this.updateLine(curve);
        
        this.checkIntersection(curve);
    },

    calculateCurve: function() {
        const points = [];
        const steps = 20;
        const velocity = this.direction.clone().multiplyScalar(10);
        const gravity = new THREE.Vector3(0, -9.8, 0);
        
        let position = this.origin.clone();
        const dt = 0.05;
        
        for (let i = 0; i < steps; i++) {
            points.push(position.clone());
            velocity.add(gravity.clone().multiplyScalar(dt));
            position.add(velocity.clone().multiplyScalar(dt));
        }
        
        return points;
    },

    updateLine: function(points) {
        const positions = this.line.geometry.attributes.position.array;
        
        for (let i = 0; i < points.length && i < 20; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
        }
        
        this.line.geometry.attributes.position.needsUpdate = true;
    },

    checkIntersection: function(curve) {
        this.hitPoint = null;
        this.line.material.color.setHex(0xff0000);
        
        const collisionIds = this.data.collisionEntities.split(',').map(s => s.trim()).filter(s => s);
        
        if (collisionIds.length === 0) {
            const groundY = 0.5;
            for (let i = 0; i < curve.length; i++) {
                if (curve[i].y <= groundY) {
                    this.hitPoint = new THREE.Vector3(curve[i].x, groundY, curve[i].z);
                    this.line.material.color.setHex(0x00ff00);
                    break;
                }
            }
            return;
        }

        for (const id of collisionIds) {
            const entity = document.querySelector(id);
            if (!entity) continue;
            
            const mesh = entity.getObject3D('mesh');
            if (!mesh) continue;

            for (let i = 0; i < curve.length - 1; i++) {
                this.raycaster.set(curve[i], curve[i + 1].clone().sub(curve[i]).normalize());
                const intersects = this.raycaster.intersectObject(mesh, true);
                
                if (intersects.length > 0) {
                    const hit = intersects[0];
                    if (hit.distance < 1.0) {
                        this.hitPoint = hit.point;
                        this.hitPoint.y += 1.6;
                        this.line.material.color.setHex(0x00ff00);
                        return;
                    }
                }
            }
        }
    },

    remove: function() {
        if (this.line) {
            this.el.sceneEl.object3D.remove(this.line);
        }
    }
});
