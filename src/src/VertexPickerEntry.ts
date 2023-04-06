import { ModelMesh, Transform, Vector3 } from "oasis-engine";

export class VertexPickerEntry {
  mesh: ModelMesh;
  transform: Transform;
  vertex: number;
  distance: number;
  worldPosition = new Vector3();
}
