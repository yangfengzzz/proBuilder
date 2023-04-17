import { MathUtil, Matrix, Quaternion, Script, Transform, Vector3 } from "oasis-engine";
import { DynamicBoneColliderBase } from "./DynamicBoneColliderBase";

export enum UpdateMode {
  Normal,
  AnimatePhysics,
  UnscaledTime,
  Default
}

export enum FreezeAxis {
  None = 0,
  X = 1,
  Y = 2,
  Z = 3
}

export class DynamicBone extends Script {
  private static _updateCount: number = 0;
  private static _prepareFrame: number = 0;

  /// The roots of the transform hierarchy to apply physics.
  public root: Transform;
  public roots: Transform[] = [];

  /// Internal physics simulation rate.
  public updateRate: number = 60.0;

  public updateMode = UpdateMode.Default;

  /// How much the bones slowed down.
  public damping: number = 0.1;

  /// How much the force applied to return each bone to original orientation.
  public elasticity: number = 0.1;

  /// How much bone's original orientation are preserved.
  public stiffness: number = 0.1;

  /// How much character's position change is ignored in physics simulation.
  public inert: number = 0;

  /// How much the bones slowed down when collided.
  public friction: number = 0;

  /// Each bone can be a sphere to collide with colliders. Radius describe sphere's size.
  public radius: number = 0;

  /// If End Length is not zero, an extra bone is generated at the end of transform hierarchy.
  public endLength: number = 0;

  /// If End Offset is not zero, an extra bone is generated at the end of transform hierarchy.
  public endOffset = new Vector3();

  /// The force apply to bones. Partial force apply to character's initial pose is cancelled out.
  public gravity = new Vector3();

  /// The force apply to bones.
  public force = new Vector3();

  /// Control how physics blends with existing animation.
  public blendWeight: number = 1.0;

  /// Collider objects interact with the bones.
  public colliders: DynamicBoneColliderBase[] = [];

  /// Bones exclude from physics simulation.
  public exclusions: Transform[] = [];

  /// Constrain bones to move on specified plane.
  public freezeAxis = FreezeAxis.None;

  /// Disable physics simulation automatically if character is far from camera or player.
  public distantDisable = false;
  public referenceObject: Transform;
  public distanceToObject: number = 20;

  private _objectMove = new Vector3();
  private _objectPrevPosition = new Vector3();
  private _objectScale: number = 0;

  private _time: number = 0;
  private _weight: number = 1.0;
  private _distantDisabled: boolean = false;
  private _preUpdateCount: number = 0;

  private _particleTrees: ParticleTree[] = [];

  // prepare data
  private _deltaTime: number = 0;
  private _effectiveColliders: DynamicBoneColliderBase[] = [];

  override onStart(): void {
    this.setupParticles();
  }

  override onEnable(): void {
    this.resetParticlesPosition();
  }

  override onDisable(): void {
    this.initTransforms();
  }

  override onPhysicsUpdate(): void {
    if (this.updateMode == UpdateMode.AnimatePhysics) {
      this.preUpdate();
    }
  }

  override onUpdate(deltaTime: number): void {
    if (this.updateMode != UpdateMode.AnimatePhysics) {
      this.preUpdate();
    }
    DynamicBone._updateCount += 1;
  }

  override onLateUpdate(deltaTime: number): void {
    if (this._preUpdateCount == 0) {
      return;
    }

    if (DynamicBone._updateCount > 0) {
      DynamicBone._updateCount = 0;
      DynamicBone._prepareFrame += 1;
    }

    this.setWeight(this.blendWeight);

    this.checkDistance();
    if (this.isNeedUpdate()) {
      this.prepare();
      this.updateParticles();
      this.applyParticlesToTransforms();
    }
    this._preUpdateCount = 0;
  }

  public setWeight(w: number): void {
    if (this._weight != w) {
      if (w == 0) {
        this.initTransforms();
      } else if (this._weight == 0) {
        this.resetParticlesPosition();
      }
      this._weight = w;
      this.blendWeight = w;
    }
  }

  public getWeight(): number {
    return this._weight;
  }

  prepare(): void {
    this._deltaTime = this.engine.time.deltaTime;

    const transform = this.entity.transform!;
    this._objectScale = Math.abs(transform.lossyWorldScale.x);
    Vector3.subtract(transform.worldPosition, this._objectPrevPosition, this._objectMove);
    this._objectPrevPosition.copyFrom(transform.worldPosition);

    for (let i = 0; i < this._particleTrees.length; i++) {
      const pt = this._particleTrees[i];
      Vector3.transformToVec3(pt._localGravity, pt._root!.worldMatrix, pt._restGravity);

      for (let j = 0; j < pt._particles.length; j++) {
        const p = pt._particles[j];
        const transform = p._transform;
        if (transform != null) {
          p._transformPosition.copyFrom(transform.worldPosition);
          p._transformLocalPosition.copyFrom(transform.position);
          p._transformLocalToWorldMatrix.copyFrom(transform.worldMatrix);
        }
      }
    }

    this._effectiveColliders.length = 0;

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.enabled) {
        this._effectiveColliders.length = 0;
        this._effectiveColliders.push(c);

        if (c.prepareFrame != DynamicBone._prepareFrame) {
          // colliders used by many dynamic bones only prepares once
          c.prepare();
          c.prepareFrame = DynamicBone._prepareFrame;
        }
      }
    }
  }

  updateParticles(): void {
    if (this._particleTrees.length <= 0) {
      return;
    }

    let loop = 1;
    let timeVar: number = 1;
    const dt = this._deltaTime;

    if (this.updateMode == UpdateMode.Default) {
      if (this.updateRate > 0) {
        timeVar = dt * this.updateRate;
      }
    } else {
      if (this.updateRate > 0) {
        const frameTime = 1.0 / this.updateRate;
        this._time += dt;
        loop = 0;

        while (this._time >= frameTime) {
          this._time -= frameTime;
          loop += 1;
          if (loop >= 3) {
            this._time = 0;
            break;
          }
        }
      }
    }

    if (loop > 0) {
      for (let i = 0; i < loop; i++) {
        this.updateParticles1(timeVar, i);
        this.updateParticles2(timeVar);
      }
    } else {
      this.skipUpdateParticles();
    }
  }

  setupParticles(): void {
    this._particleTrees.length = 0;

    if (this.root != null) {
      this.appendParticleTree(this.root);
    }

    if (this.roots.length != 0) {
      for (let i = 0; i < this.roots.length; i++) {
        let root = this.roots[i];
        let result = this._particleTrees.find((value, index, obj) => {
          return value._root === root;
        });

        if (result !== undefined) {
          continue;
        }
        this.appendParticleTree(root);
      }
    }

    let transform = this.entity.transform!;
    this._objectScale = Math.abs(transform.lossyWorldScale.x);
    this._objectPrevPosition.copyFrom(transform.worldPosition);
    this._objectMove.set(0, 0, 0);

    for (let i = 0; i < this._particleTrees.length; i++) {
      let pt = this._particleTrees[i];
      this.appendParticles(pt, pt._root, -1, 0);
    }
    this.updateParameters();
  }

  updateParameters(): void {
    this.setWeight(this.blendWeight);

    for (let i = 0; i < this._particleTrees.length; i++) {
      this.updateSingleParameters(this._particleTrees[i]);
    }
  }

  updateSingleParameters(pt: ParticleTree): void {
    Vector3.transformToVec3(this.gravity, pt._rootWorldToLocalMatrix, pt._localGravity);

    for (let i = 0; i < pt._particles.length; i++) {
      let p = pt._particles[i];
      p._damping = this.damping;
      p._elasticity = this.elasticity;
      p._stiffness = this.stiffness;
      p._inert = this.inert;
      p._friction = this.friction;
      p._radius = this.radius;

      p._damping = MathUtil.clamp(p._damping, 0, 1);
      p._elasticity = MathUtil.clamp(p._elasticity, 0, 1);
      p._stiffness = MathUtil.clamp(p._stiffness, 0, 1);
      p._inert = MathUtil.clamp(p._inert, 0, 1);
      p._friction = MathUtil.clamp(p._friction, 0, 1);
      p._radius = Math.max(p._radius, 0);
    }
  }

  appendParticleTree(root: Transform): void {
    let pt = new ParticleTree();
    pt._root = root;
    Matrix.invert(root.worldMatrix, pt._rootWorldToLocalMatrix);
    this._particleTrees.push(pt);
  }

  appendParticles(pt: ParticleTree, b: Transform, parentIndex: number, boneLength: number): void {}

  isNeedUpdate(): boolean {
    return this._weight > 0 && !(this.distantDisable && this._distantDisabled);
  }

  preUpdate(): void {
    if (this.isNeedUpdate()) {
      this.initTransforms();
    }
    this._preUpdateCount += 1;
  }

  checkDistance(): void {}

  initTransforms(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.initSingleTransforms(this._particleTrees[i]);
    }
  }

  initSingleTransforms(pt: ParticleTree): void {}

  resetParticlesPosition(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.resetSingleParticlesPosition(this._particleTrees[i]);
    }
    this._objectPrevPosition.copyFrom(this.entity.transform.worldPosition);
  }

  resetSingleParticlesPosition(pt: ParticleTree): void {}

  updateParticles1(timeVar: number, loopIndex: number): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.updateSingleParticles1(this._particleTrees[i], timeVar, loopIndex);
    }
  }

  updateSingleParticles1(pt: ParticleTree, timeVar: number, loopIndex: number): void {}

  updateParticles2(timeVar: number): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.updateSingleParticles2(this._particleTrees[i], timeVar);
    }
  }

  updateSingleParticles2(pt: ParticleTree, timeVar: number): void {}

  applyParticlesToTransforms(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.applySingleParticlesToTransforms(this._particleTrees[i]);
    }
  }

  applySingleParticlesToTransforms(pt: ParticleTree): void {}

  skipUpdateParticles(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this.skipUpdateSingleParticles(this._particleTrees[i]);
    }
  }

  skipUpdateSingleParticles(pt: ParticleTree): void {}
}

class Particle {
  _transform: Transform;
  _parentIndex: number = 0;
  _childCount: number = 0;
  _damping: number = 0;
  _elasticity: number = 0;
  _stiffness: number = 0;
  _inert: number = 0;
  _friction: number = 0;
  _radius: number = 0;
  _boneLength: number = 0;
  _isCollide: boolean = false;

  _position = new Vector3();
  _prevPosition = new Vector3();
  _endOffset = new Vector3();
  _initLocalPosition = new Vector3();
  _initLocalRotation = new Quaternion();

  // prepare data
  _transformPosition = new Vector3();
  _transformLocalPosition = new Vector3();
  _transformLocalToWorldMatrix = new Matrix();
}

class ParticleTree {
  _root: Transform;
  _localGravity = new Vector3();
  _rootWorldToLocalMatrix = new Matrix();
  _boneTotalLength: number = 0;
  _particles: Particle[] = [];

  // prepare data
  _restGravity = new Vector3();
}
