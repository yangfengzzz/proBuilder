import { DynamicBoneColliderBase } from "./DynamicBoneColliderBase";
import { Vector3 } from "oasis-engine";

export class DynamicBoneCollider extends DynamicBoneColliderBase {
  /// The radius of the sphere or capsule.
  public radius: number = 0.5;

  /// The height of the capsule.
  public height: number = 0;

  /// The other radius of the capsule.
  public radius2: number = 0;

  // prepare data
  /** @internal */
  _scaledRadius: number = 0;
  /** @internal */
  _scaledRadius2: number = 0;
  /** @internal */
  _c0: Vector3 = new Vector3();
  /** @internal */
  _c1: Vector3 = new Vector3();
  /** @internal */
  _c01Distance: number = 0;
  /** @internal */
  _collideType: number = 0;

  override prepare(): void {}

  override collide(particlePosition: Vector3, particleRadius: number): boolean {
    return false;
  }

  static outsideSphere(
    particlePosition: Vector3,
    particleRadius: number,
    sphereCenter: Vector3,
    sphereRadius: number
  ): boolean {
    return false;
  }

  static insideSphere(
    particlePosition: Vector3,
    particleRadius: number,
    sphereCenter: Vector3,
    sphereRadius: number
  ): boolean {
    return false;
  }

  static outsideCapsule(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius: number,
    dirlen: number
  ): boolean {
    return false;
  }

  static insideCapsule(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius: number,
    dirlen: number
  ): boolean {
    return false;
  }

  static outsideCapsule2(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius0: number,
    capsuleRadius1: number,
    dirlen: number
  ): boolean {
    return false;
  }

  static insideCapsule2(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius0: number,
    capsuleRadius1: number,
    dirlen: number
  ): boolean {
    return false;
  }
}
