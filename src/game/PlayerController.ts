import * as THREE from 'three';

/**
 * First-person player controller with WASD movement, mouse look,
 * sprint, crouch, and jump mechanics for a 3D horror game.
 */
export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3;
  private direction: THREE.Vector3;
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private canJump: boolean = false;
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  
  // Mouse look
  private euler: THREE.Euler;
  private isPointerLocked: boolean = false;
  
  // Movement parameters
  private readonly walkSpeed: number = 5.0;
  private readonly sprintSpeed: number = 8.0;
  private readonly crouchSpeed: number = 2.5;
  private readonly jumpVelocity: number = 8.0;
  private readonly gravity: number = 20.0;
  private readonly friction: number = 8.0;
  
  // Height parameters
  private readonly standingHeight: number = 1.8;
  private readonly crouchingHeight: number = 1.2;
  private currentHeight: number;
  private targetHeight: number;
  private readonly crouchTransitionSpeed: number = 8.0;
  
  // Camera sensitivity
  private readonly mouseSensitivity: number = 0.002;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.currentHeight = this.standingHeight;
    this.targetHeight = this.standingHeight;
    
    // Set initial camera position
    this.camera.position.y = this.standingHeight;
    
    this.initEventListeners(domElement);
  }
  
  private initEventListeners(domElement: HTMLElement): void {
    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Mouse events
    domElement.addEventListener('click', () => {
      domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === domElement;
    });
    
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y += this.jumpVelocity;
          this.canJump = false;
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.isCrouching) {
          this.isSprinting = true;
        }
        break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        this.toggleCrouch();
        break;
    }
  }
  
  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    
    // Clamp vertical rotation
    this.euler.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.euler.x)
    );
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  private toggleCrouch(): void {
    this.isCrouching = !this.isCrouching;
    this.targetHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
    
    if (this.isCrouching) {
      this.isSprinting = false;
    }
  }
  
  /**
   * Update the player controller. Call this in your game loop.
   * @param deltaTime Time elapsed since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Calculate movement speed based on state
    let speed = this.walkSpeed;
    if (this.isSprinting && !this.isCrouching) {
      speed = this.sprintSpeed;
    } else if (this.isCrouching) {
      speed = this.crouchSpeed;
    }
    
    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    // Apply friction
    const frictionMultiplier = Math.exp(-this.friction * deltaTime);
    this.velocity.x *= frictionMultiplier;
    this.velocity.z *= frictionMultiplier;
    
    // Get camera direction vectors
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Apply movement
    if (this.direction.z !== 0) {
      this.velocity.x += forward.x * this.direction.z * speed * deltaTime * 10;
      this.velocity.z += forward.z * this.direction.z * speed * deltaTime * 10;
    }
    
    if (this.direction.x !== 0) {
      this.velocity.x += right.x * this.direction.x * speed * deltaTime * 10;
      this.velocity.z += right.z * this.direction.x * speed * deltaTime * 10;
    }
    
    // Update position
    this.camera.position.x += this.velocity.x * deltaTime;
    this.camera.position.z += this.velocity.z * deltaTime;
    this.camera.position.y += this.velocity.y * deltaTime;
    
    // Simple ground collision (you'll want to replace this with proper collision detection)
    if (this.camera.position.y < this.currentHeight) {
      this.camera.position.y = this.currentHeight;
      this.velocity.y = 0;
      this.canJump = true;
    }
    
    // Smooth crouch transition
    if (this.currentHeight !== this.targetHeight) {
      const heightDelta = (this.targetHeight - this.currentHeight) * this.crouchTransitionSpeed * deltaTime;
      this.currentHeight += heightDelta;
      
      // Snap to target if close enough
      if (Math.abs(this.targetHeight - this.currentHeight) < 0.01) {
        this.currentHeight = this.targetHeight;
      }
    }
  }
  
  /**
   * Get the current camera position
   */
  public getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }
  
  /**
   * Set the player position
   */
  public setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }
  
  /**
   * Get the camera's forward direction
   */
  public getForwardDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }
  
  /**
   * Check if the player is currently sprinting
   */
  public getIsSprinting(): boolean {
    return this.isSprinting;
  }
  
  /**
   * Check if the player is currently crouching
   */
  public getIsCrouching(): boolean {
    return this.isCrouching;
  }
  
  /**
   * Get current player height
   */
  public getCurrentHeight(): number {
    return this.currentHeight;
  }
  
  /**
   * Clean up event listeners
   */
  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }
}
