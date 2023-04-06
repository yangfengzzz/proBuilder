import { HitResult, Matrix, ModelMesh, Ray, Transform, Vector3 } from "oasis-engine";

export enum CullingMode {
  None = 0,
  Back = 1,
  Front = 2,
  FrontBack = Front | Back // 0x00000003
}

/// Static methods for working with ProBuilderMesh objects in an editor.
export class HandleUtility {
  private static invMat = new Matrix();
  private static tempVec1 = new Vector3();
  private static tempVec2 = new Vector3();
  private static tempVec3 = new Vector3();
  private static tempVec4 = new Vector3();
  private static tempVec5 = new Vector3();

  /**
   * Find the nearest face intersected by InWorldRay on this pb_Object.
   * True if the ray intersects with the mesh, false if not.
   * @param worldRay A ray in world space.
   * @param mesh The ProBuilder object to raycast against.
   * @param transform
   * @param hit If the mesh was intersected, hit contains information about the intersect point in local coordinate space.
   * @param distance The distance from the ray origin to the intersection point.
   * @param cullingMode Which sides of a face are culled when hit testing. Default is back faces are culled.
   */
  static FaceRaycast(
    worldRay: Ray,
    mesh: ModelMesh,
    transform: Transform,
    hit: HitResult,
    distance: number = Number.MAX_VALUE,
    cullingMode: CullingMode = CullingMode.Back
  ): boolean {
    // Transform ray into model space
    Vector3.subtract(worldRay.origin, transform.worldPosition, worldRay.origin);
    Matrix.invert(transform.worldMatrix, HandleUtility.invMat);
    Vector3.transformCoordinate(worldRay.origin, HandleUtility.invMat, worldRay.origin);
    Vector3.transformCoordinate(worldRay.direction, HandleUtility.invMat, worldRay.direction);

    const positions = mesh.getPositions();
    const indices = mesh.getIndices();

    let OutHitPoint = Number.POSITIVE_INFINITY;
    let OutHitFace = -1;
    let OutNrm = new Vector3();

    // Iterate faces, testing for nearest hit to ray origin. Optionally ignores backfaces.
    for (let j = 0, ic = indices.length; j < ic; j += 3) {
      let a = positions[indices[j]];
      let b = positions[indices[j + 1]];
      let c = positions[indices[j + 2]];
      Vector3.subtract(b, a, HandleUtility.tempVec1);
      Vector3.subtract(c, a, HandleUtility.tempVec2);

      let nrm = new Vector3();
      Vector3.cross(HandleUtility.tempVec1, HandleUtility.tempVec2, nrm);
      let dot = Vector3.dot(worldRay.direction, nrm);

      let skip = false;
      switch (cullingMode) {
        case CullingMode.Front:
          if (dot < 0) skip = true;
          break;

        case CullingMode.Back:
          if (dot > 0) skip = true;
          break;
      }

      let dist: number = 0;

      let point = new Vector3();
      if (!skip && HandleUtility.rayIntersectsTriangle(worldRay, a, b, c, point) > -1) {
        if (dist > OutHitPoint || dist > distance) continue;

        OutNrm = nrm;
        OutHitFace = j / 3;
        OutHitPoint = dist;
      }
    }
    return false;
  }

  /**
   * Test if a raycast intersects a triangle. Does not test for culling.
   * If triangle is intersected, this is the distance of intersection point from ray origin. Zero if not intersected.
   * @remarks:
   *  http://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
   *   http://www.cs.virginia.edu/~gfx/Courses/2003/ImageSynthesis/papers/Acceleration/Fast%20MinimumStorage%20RayTriangle%20Intersection.pdf
   * @param InRay
   * @param InTriangleA First vertex position in the triangle.
   * @param InTriangleB Second vertex position in the triangle.
   * @param InTriangleC Third vertex position in the triangle.
   * @param OutPoint If triangle is intersected, this is the point of collision. Zero if not intersected.
   */
  public static rayIntersectsTriangle(
    InRay: Ray,
    InTriangleA: Vector3,
    InTriangleB: Vector3,
    InTriangleC: Vector3,
    OutPoint: Vector3
  ): number {
    let OutDistance = 0;
    OutPoint.set(0, 0, 0);

    //Find vectors for two edges sharing V1
    const e1 = HandleUtility.tempVec1;
    const e2 = HandleUtility.tempVec2;
    Vector3.subtract(InTriangleB, InTriangleA, e1);
    Vector3.subtract(InTriangleC, InTriangleA, e2);

    //Begin calculating determinant - also used to calculate `u` parameter
    const P = HandleUtility.tempVec3;
    Vector3.cross(InRay.direction, e2, P);

    //if determinant is near zero, ray lies in plane of triangle
    const det = Vector3.dot(e1, P);

    // Non-culling branch {
    if (det > -Number.EPSILON && det < Number.EPSILON) return -1;

    const inv_det = 1 / det;

    //calculate distance from V1 to ray origin
    const T = HandleUtility.tempVec4;
    Vector3.subtract(InRay.origin, InTriangleA, T);

    // Calculate u parameter and test bound
    const u = Vector3.dot(T, P) * inv_det;

    //The intersection lies outside the triangle
    if (u < 0 || u > 1) return -1;

    //Prepare to test v parameter
    const Q = HandleUtility.tempVec5;
    Vector3.cross(T, e1, Q);

    //Calculate V parameter and test bound
    const v = Vector3.dot(InRay.direction, Q) * inv_det;

    //The intersection lies outside the triangle
    if (v < 0 || u + v > 1) return -1;

    const t = Vector3.dot(e2, Q) * inv_det;
    // }

    if (t > Number.EPSILON) {
      //ray intersection
      OutDistance = t;

      OutPoint.x = u * InTriangleB.x + v * InTriangleC.x + (1 - (u + v)) * InTriangleA.x;
      OutPoint.y = u * InTriangleB.y + v * InTriangleC.y + (1 - (u + v)) * InTriangleA.y;
      OutPoint.z = u * InTriangleB.z + v * InTriangleC.z + (1 - (u + v)) * InTriangleA.z;

      return OutDistance;
    }

    return -1;
  }
}
