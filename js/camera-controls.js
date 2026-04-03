// Enhanced Camera Controls with Q/E vertical movement (Blender-style)
AFRAME.registerComponent('camera-controls', {
    schema: {
        moveSpeed: { default: 5 },
        lookSpeed: { default: 0.5 },
        enabled: { default: true }
    },

    init: function() {
        if (!this.data.enabled) return;
        
        this.camera = this.el.querySelector('[camera]');
        this.velocity = new THREE.Vector3();
        this.keys = {};
        
        this.setupKeyboardControls();
        this.setupMouseControls();
    },

    setupKeyboardControls: function() {
        // Track key states
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    },

    setupMouseControls: function() {
        // Enhanced look controls are already handled by A-Frame's look-controls
        // This component focuses on movement
    },

    tick: function(time, delta) {
        if (!this.data.enabled || !this.camera) return;
        
        const deltaSeconds = delta / 1000;
        const moveSpeed = this.data.moveSpeed;
        
        // Reset velocity
        this.velocity.set(0, 0, 0);
        
        // Forward/Backward (W/S)
        if (this.keys['w']) {
            this.camera.object3D.getWorldDirection(this.velocity);
            this.velocity.multiplyScalar(-moveSpeed * deltaSeconds);
        }
        if (this.keys['s']) {
            this.camera.object3D.getWorldDirection(this.velocity);
            this.velocity.multiplyScalar(moveSpeed * deltaSeconds);
        }
        
        // Left/Right (A/D)
        if (this.keys['a'] || this.keys['d']) {
            const forward = new THREE.Vector3();
            this.camera.object3D.getWorldDirection(forward);
            const rightVector = this.camera.object3D.up.clone().cross(forward).normalize();
            
            if (this.keys['a']) {
                this.velocity.add(rightVector.multiplyScalar(-moveSpeed * deltaSeconds));
            }
            if (this.keys['d']) {
                this.velocity.add(rightVector.multiplyScalar(moveSpeed * deltaSeconds));
            }
        }
        
        // Up/Down (Q/E) - Blender-style vertical movement
        if (this.keys['q']) {
            this.velocity.y = -moveSpeed * deltaSeconds;
        }
        if (this.keys['e']) {
            this.velocity.y = moveSpeed * deltaSeconds;
        }
        
        // Apply movement
        if (this.velocity.length() > 0) {
            const currentPosition = this.el.getAttribute('position');
            this.el.setAttribute('position', {
                x: currentPosition.x + this.velocity.x,
                y: currentPosition.y + this.velocity.y,
                z: currentPosition.z + this.velocity.z
            });
        }
    },

    remove: function() {
        // Clean up event listeners if needed
        this.keys = {};
    }
});