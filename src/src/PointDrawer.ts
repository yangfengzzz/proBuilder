import {
  dependentComponents,
  DependentMode,
  GLCapabilityType,
  Material,
  Matrix,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  RenderFace,
  Script,
  UnlitMaterial,
  Vector3,
  Color
} from "oasis-engine";

/**
 * Point Drawer.
 * @decorator `@dependentComponents(MeshRenderer)`
 */
@dependentComponents(MeshRenderer, DependentMode.CheckOnly)
export class PointDrawer extends Script {
  private static _positions: Vector3[] = [];
  private static _colors: Color[] = [];
  private static _positionCount: number = 0;
  private static _indices: Uint16Array | Uint32Array;
  private static _indicesCount: number = 0;
  private static _supportUint32Array: boolean;
  private _renderer: MeshRenderer;
  private _material: Material;
  private _mesh: ModelMesh;

  /**
   * The PointDrawer.matrix stores the position, rotation and scale of the PointDrawer.
   * By default, PointDrawer always uses world coordinates.
   * The default PointDrawer.matrix transforms the world coordinates using a default identity matrix.
   */
  static matrix: Matrix = null;

  /**
   * Draws a Point
   * @param from - from position
   * @param color - to color
   */
  static drawPoint(from: Vector3, color: Color) {
    PointDrawer._growthPositionColor(1);
    PointDrawer._growthIndexMemory(1);
    PointDrawer._indices[PointDrawer._indicesCount++] = PointDrawer._positionCount;
    if (PointDrawer.matrix == null) {
      PointDrawer._positions[PointDrawer._positionCount++].copyFrom(from);
    } else {
      Vector3.transformCoordinate(from, PointDrawer.matrix, PointDrawer._positions[PointDrawer._positionCount++]);
    }
    PointDrawer._colors[PointDrawer._positionCount - 1].copyFrom(color);
  }

  static flush() {
    PointDrawer._positionCount = 0;
    PointDrawer._indicesCount = 0;
  }

  /**
   * @override
   */
  onAwake(): void {
    const engine = this.engine;
    const mesh = new ModelMesh(engine);
    const material = new UnlitMaterial(engine);
    material.renderFace = RenderFace.Double;
    const renderer = this.entity.getComponent(MeshRenderer);
    renderer.castShadows = false;
    renderer.receiveShadows = false;
    // @ts-ignore
    const supportUint32Array = engine._hardwareRenderer.canIUse(GLCapabilityType.elementIndexUint);

    // @ts-ignore
    mesh._enableVAO = false;
    mesh.addSubMesh(0, PointDrawer._indicesCount, MeshTopology.Points);
    renderer.mesh = mesh;
    renderer.setMaterial(material);

    const { bounds } = mesh;
    bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this._mesh = mesh;
    this._material = material;
    this._renderer = renderer;
    PointDrawer._indices = supportUint32Array ? new Uint32Array(128) : new Uint16Array(128);
    PointDrawer._supportUint32Array = supportUint32Array;
  }

  onLateUpdate(deltaTime: number) {
    const { _mesh: mesh } = this;

    if (PointDrawer._positionCount > 0) {
      mesh.setPositions(PointDrawer._positions);
      mesh.setColors(PointDrawer._colors);
      mesh.setIndices(PointDrawer._indices);
      mesh.uploadData(false);
      mesh.subMesh.count = PointDrawer._indicesCount;
      this._renderer.setMaterial(this._material);
    } else {
      this._renderer.setMaterial(null);
    }

    PointDrawer.flush();
  }

  private static _growthIndexMemory(length: number): void {
    const indices = PointDrawer._indices;
    const neededLength = PointDrawer._indicesCount + length;
    if (neededLength > indices.length) {
      const maxLength = PointDrawer._supportUint32Array ? 4294967295 : 65535;
      if (neededLength > maxLength) {
        throw Error("The vertex count is over limit.");
      }

      const newIndices = PointDrawer._supportUint32Array
        ? new Uint32Array(neededLength)
        : new Uint16Array(neededLength);
      newIndices.set(indices);
      PointDrawer._indices = newIndices;
    }
  }

  private static _growthPositionColor(length: number): void {
    const positions = PointDrawer._positions;
    const colors = PointDrawer._colors;
    const neededLength = PointDrawer._positionCount + length;
    if (neededLength > positions.length) {
      for (let i = 0, n = neededLength - positions.length; i < n; i++) {
        positions.push(new Vector3());
        colors.push(new Color());
      }
    }
  }
}

/**
 * Circle Axis.
 */
export enum AxisType {
  X,
  Y,
  Z
}
