import { HitResult, Matrix, ModelMesh, Ray, Transform, Vector3 } from "oasis-engine";

export class SelectionResult {
  public distance: number = 0;
  public point = new Vector3();
  public normal = new Vector3();
  public face: number = 0;
}
