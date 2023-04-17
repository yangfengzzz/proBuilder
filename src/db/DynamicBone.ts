import { Matrix, Quaternion, Script, Transform, Vector3 } from "oasis-engine";
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

  override onStart(): void {}

  override onEnable(): void {}

  override onDisable(): void {}

  override onPhysicsUpdate(): void {}

  override onUpdate(deltaTime: number): void {}

  override onLateUpdate(deltaTime: number): void {}

  public setWeight(w: number) {}

  public getWeight(): number {
    return this._weight;
  }

  prepare(): void {}

  updateParticles(): void {}

  setupParticles(): void {}

  updateParameters(): void {}

  updateSingleParameters(pt: ParticleTree): void {}

  appendParticleTree(root: Transform): void {}

  appendParticles(pt: ParticleTree, b: Transform, parentIndex: number, boneLength: number): void {}

  isNeedUpdate(): boolean {
    return false;
  }

  preUpdate(): void {}

  checkDistance(): void {}

  initTransforms(): void {}

  initSingleTransforms(pt: ParticleTree): void {}

  resetParticlesPosition(): void {}

  resetSingleParticlesPosition(pt: ParticleTree): void {}

  updateParticles1(timeVar: number, loopIndex: number): void {}

  updateSingleParticles1(pt: ParticleTree, timeVar: number, loopIndex: number): void {}

  updateParticles2(timeVar: number): void {}

  updateSingleParticles2(pt: ParticleTree, timeVar: number): void {}

  applyParticlesToTransforms(): void {}

  applySingleParticlesToTransforms(pt: ParticleTree): void {}

  skipUpdateParticles(): void {}

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
