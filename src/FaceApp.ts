import {
  AmbientLight,
  AssetType,
  Camera,
  MathUtil,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  PBRMaterial,
  Pointer,
  PointLight,
  PrimitiveMesh,
  Quaternion,
  Ray,
  RenderFace,
  Script,
  UnlitMaterial,
  Vector3,
  WebGLEngine,
  PointerButton,
  PointerPhase
} from "oasis-engine";

import { LineDrawer } from "./src";
import { HandleUtility } from "./src/HandleUtility";
import { SelectionResult } from "./src/SelectionResult";
import { LitePhysics } from "@oasis-engine/physics-lite";
import { OrbitControl } from "@oasis-engine-toolkit/controls";

WebGLEngine.create({ canvas: "canvas", physics: new LitePhysics() }).then((engine) => {
  engine.canvas.resizeByClientSize();
  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity("root");

  scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
  scene.ambientLight.diffuseIntensity = 1.2;

  // init camera
  const cameraEntity = rootEntity.createChild("camera");
  cameraEntity.addComponent(Camera);
  cameraEntity.transform.setPosition(2, 2, 2);
  cameraEntity.transform.lookAt(new Vector3());
  cameraEntity.addComponent(OrbitControl);

  // init point light
  const light = rootEntity.createChild("light");
  light.transform.setPosition(0, 3, 0);
  light.addComponent(PointLight);

  const meshEntity = rootEntity.createChild();
  const meshRenderer = meshEntity.addComponent(MeshRenderer);
  meshRenderer.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1, false);
  const mtl = new PBRMaterial(engine);
  mtl.baseColor.set(1, 1, 1, 0.5);
  mtl.isTransparent = true;
  mtl.renderFace = RenderFace.Double;
  meshRenderer.setMaterial(mtl);

  const lineDrawer = rootEntity.createChild();
  lineDrawer.addComponent(MeshRenderer);
  lineDrawer.addComponent(LineDrawer);

  class FaceInfo {
    private _averageCenter = new Vector3();

    start = 0;
    end = 0;
    direction = new Vector3();
    positions: Vector3[] = [];
    mesh: ModelMesh;
    callback: (translation: Vector3) => void;

    get averageCenter(): Vector3 {
      this._averageCenter.set(0, 0, 0);
      for (let i = 0; i < this.positions.length; i++) {
        this._averageCenter.add(this.positions[i]);
      }
      this._averageCenter.scale(1 / this.positions.length);
      return this._averageCenter;
    }

    constructor(start: number, end: number) {
      this.start = start;
      this.end = end;
    }
  }

  class SelectScript extends Script {
    private startPointerPos = new Vector3();
    private tempVec3: Vector3 = new Vector3();
    private zValue: number = 0;

    hasCreateHandle = false;

    faceInfos: FaceInfo[] = [];
    positions: Vector3[] = [];
    meshRenderer: MeshRenderer;
    ray = new Ray();
    mouse = new Vector3();
    hit = new SelectionResult();
    camera: Camera;
    control: OrbitControl;

    pointer: Pointer;
    currentFace: FaceInfo;

    width = 1;
    height = 1;
    depth = 1;

    onAwake() {
      this.camera = this.entity.getComponent(Camera);
      this.control = this.entity.getComponent(OrbitControl);
    }

    onUpdate(deltaTime: number) {
      if (!this.hasCreateHandle) {
        let faceInfo = this.createSelectPlane(new Vector3(0, 0, 1), new Quaternion(), new Vector3(0, 0, 1));
        faceInfo.callback = (position: Vector3) => {
          this.depth += position.z;
          this.meshRenderer.mesh = PrimitiveMesh.createCuboid(this.engine, this.width, this.height, this.depth);
        };

        const rotation = new Quaternion();
        Quaternion.rotationY(MathUtil.degreeToRadian(90), rotation);
        faceInfo = this.createSelectPlane(new Vector3(1, 0, 0), rotation, new Vector3(1, 0, 0));
        faceInfo.callback = (position: Vector3) => {
          this.width += position.x;
          this.meshRenderer.mesh = PrimitiveMesh.createCuboid(this.engine, this.width, this.height, this.depth);
        };

        Quaternion.rotationX(MathUtil.degreeToRadian(90), rotation);
        faceInfo = this.createSelectPlane(new Vector3(0, 1, 0), rotation, new Vector3(0, 1, 0));
        faceInfo.callback = (position: Vector3) => {
          this.height += position.y;
          this.meshRenderer.mesh = PrimitiveMesh.createCuboid(this.engine, this.width, this.height, this.depth);
        };
        this.hasCreateHandle = true;
      }
      this.faceRaycast();

      if (this.pointer) {
        if (
          this.pointer.phase == PointerPhase.Down ||
          this.pointer.phase == PointerPhase.Move ||
          this.pointer.phase == PointerPhase.Stationary
        ) {
          const viewPos = new Vector3();
          const average = this.currentFace.averageCenter;
          Vector3.transformCoordinate(average, this.camera.viewMatrix, viewPos);

          const positionOffset = new Vector3();
          const pointerPosition = this.pointer.position;
          this.camera.screenToWorldPoint(new Vector3(pointerPosition.x, pointerPosition.y, -viewPos.z), positionOffset);
          positionOffset.subtract(average);
          const project = Vector3.dot(positionOffset, this.currentFace.direction);
          Vector3.scale(this.currentFace.direction, project, positionOffset);

          for (let i = 0; i < this.currentFace.positions.length; i++) {
            const position = this.currentFace.positions[i];
            position.add(positionOffset);
          }
          // fresh
          this.currentFace.mesh.setPositions(this.currentFace.positions);
          this.currentFace.mesh.uploadData(false);
          this.currentFace.callback(positionOffset);
        } else {
          this.control.enabled = true;
          this.currentFace = null;
          this.pointer = null;
        }
      }
    }

    faceRaycast() {
      const { engine, ray } = this;
      const { inputManager } = engine;
      const { pointers } = inputManager;
      if (!pointers) {
        return;
      }
      if (pointers && inputManager.isPointerDown(PointerButton.Primary)) {
        const transform = this.meshRenderer.entity.transform;
        for (let i = pointers.length - 1; i >= 0; i--) {
          const pointer = pointers[i];
          this.camera.screenPointToRay(pointer.position, ray);
          if (HandleUtility.faceSelect(ray, this.positions, transform, this.hit)) {
            this.pointer = pointer;
            this.control.enabled = false;
            for (let j = 0; j < this.faceInfos.length; j++) {
              const faceInfo = this.faceInfos[j];
              if (faceInfo.start <= this.hit.face && this.hit.face < faceInfo.end) {
                this.currentFace = this.faceInfos[j];
              }
            }

            HandleUtility.highlightFace(this.positions, transform, this.hit);
          }
        }
      }
    }

    createSelectPlane(translation: Vector3, rotation: Quaternion, direction: Vector3): FaceInfo {
      const scale: number = 0.1;
      const child = this.meshRenderer.entity.createChild();
      const renderer = child.addComponent(MeshRenderer);
      const mtl = new UnlitMaterial(this.engine);
      mtl.renderFace = RenderFace.Double;
      renderer.setMaterial(mtl);
      const mesh = new ModelMesh(this.engine);
      const positions = [
        new Vector3(-scale, -scale, 0),
        new Vector3(-scale, scale, 0),
        new Vector3(scale, -scale, 0),
        new Vector3(scale, -scale, 0),
        new Vector3(-scale, scale, 0),
        new Vector3(scale, scale, 0)
      ];
      const faceBegin = this.positions.length / 3;
      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        Vector3.transformByQuat(position, rotation, position);
        position.add(translation);
        this.positions.push(position);
      }
      const faceEnd = this.positions.length / 3;
      const faceInfo = new FaceInfo(faceBegin, faceEnd);
      faceInfo.positions = positions;
      faceInfo.direction = direction;
      this.faceInfos.push(faceInfo);

      mesh.setPositions(positions);
      mesh.uploadData(true);
      mesh.addSubMesh(0, 6, MeshTopology.Triangles);
      renderer.mesh = mesh;
      faceInfo.mesh = mesh;
      return faceInfo;
    }
  }

  const selectScript = cameraEntity.addComponent(SelectScript);
  selectScript.meshRenderer = meshRenderer;

  engine.resourceManager
    .load<AmbientLight>({
      type: AssetType.Env,
      url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin"
    })
    .then((ambientLight) => {
      scene.ambientLight = ambientLight;
      engine.run();
    });
});
