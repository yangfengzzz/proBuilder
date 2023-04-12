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
  Transform,
  UnlitMaterial,
  Vector3,
  WebGLEngine
} from "oasis-engine";

import { LineDrawer } from "./src";
import { HandleUtility } from "./src/HandleUtility";
import { SelectionResult } from "./src/SelectionResult";
import { VertexPickerEntry } from "./src/VertexPickerEntry";
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

  class SelectScript extends Script {
    private startPointerPos = new Vector3();
    private tempVec3: Vector3 = new Vector3();
    private zValue: number = 0;

    hasCreateHandle = false;

    positions: Vector3[] = [];
    mesh: ModelMesh;
    transform: Transform;
    ray = new Ray();
    mouse = new Vector3();
    hit = new SelectionResult();
    camera: Camera;
    control: OrbitControl;

    pointer: Pointer;
    entry: VertexPickerEntry;

    onAwake() {
      this.camera = this.entity.getComponent(Camera);
      this.control = this.entity.getComponent(OrbitControl);
    }

    onUpdate(deltaTime: number) {
      if (!this.hasCreateHandle) {
        this.createSelectPlane(new Vector3(0, 0, 1), new Quaternion());
        this.createSelectPlane(new Vector3(0, 0, -1), new Quaternion());
        const rotation = new Quaternion();
        Quaternion.rotationY(MathUtil.degreeToRadian(90), rotation);
        this.createSelectPlane(new Vector3(1, 0, 0), rotation);
        this.createSelectPlane(new Vector3(-1, 0, 0), rotation);
        Quaternion.rotationX(MathUtil.degreeToRadian(90), rotation);
        this.createSelectPlane(new Vector3(0, 1, 0), rotation);
        this.createSelectPlane(new Vector3(0, -1, 0), rotation);
        this.hasCreateHandle = true;
      }
      this.faceRaycast();
    }

    faceRaycast() {
      const { engine, ray } = this;
      const { inputManager } = engine;
      const { pointers } = inputManager;
      if (!pointers) {
        return;
      }
      for (let i = pointers.length - 1; i >= 0; i--) {
        const pointer = pointers[i];
        this.camera.screenPointToRay(pointer.position, ray);
        if (HandleUtility.faceSelect(ray, this.positions, this.transform, this.hit)) {
          HandleUtility.highlightFace(this.positions, this.transform, this.hit);
        }
      }
    }

    createSelectPlane(translation: Vector3, rotation: Quaternion) {
      const scale: number = 0.1;
      const child = this.transform.entity.createChild();
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
      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        Vector3.transformByQuat(position, rotation, position);
        position.add(translation);
        this.positions.push(position);
      }

      mesh.setPositions(positions);
      mesh.uploadData(true);
      mesh.addSubMesh(0, 6, MeshTopology.Triangles);
      renderer.mesh = mesh;
    }
  }

  const selectScript = cameraEntity.addComponent(SelectScript);
  selectScript.mesh = <ModelMesh>meshRenderer.mesh;
  selectScript.transform = meshEntity.transform;

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
