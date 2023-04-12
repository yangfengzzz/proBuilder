import {
  AmbientLight,
  AssetType,
  Camera,
  MeshRenderer,
  ModelMesh,
  PBRMaterial,
  Pointer,
  PointerButton,
  PointerPhase,
  PointLight,
  PrimitiveMesh,
  Ray,
  RenderFace,
  Script,
  Transform,
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
  // mtl.baseColor.set(1, 1, 1, 0.5);
  // mtl.isTransparent = true;
  mtl.renderFace = RenderFace.Double;
  meshRenderer.setMaterial(mtl);

  const lineDrawer = rootEntity.createChild();
  lineDrawer.addComponent(MeshRenderer);
  lineDrawer.addComponent(LineDrawer);

  class SelectScript extends Script {
    private startPointerPos = new Vector3();
    private tempVec3: Vector3 = new Vector3();
    private zValue: number = 0;

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
        if (HandleUtility.faceRaycast(ray, this.mesh, this.transform, this.hit)) {
          HandleUtility.highlightFace(this.mesh, this.transform, this.hit);
        }
      }
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
