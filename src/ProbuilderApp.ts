import {
  WebGLEngine,
  Vector3,
  MeshRenderer,
  PointLight,
  Camera,
  Script,
  AmbientLight,
  AssetType,
  Ray,
  PrimitiveMesh,
  PBRMaterial,
  ModelMesh,
  Transform
} from "oasis-engine";

import { LineDrawer } from "./src";
import { HandleUtility } from "./src/HandleUtility";
import { SelectionResult } from "./src/SelectionResult";
import { OrbitControl } from "@oasis-engine-toolkit/controls";

const engine = await WebGLEngine.create({ canvas: "canvas" });
engine.canvas.resizeByClientSize();
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity("root");

scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
scene.ambientLight.diffuseIntensity = 1.2;

// init camera
const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(5, 5, 5);
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
meshRenderer.setMaterial(mtl);

const lineDrawer = rootEntity.createChild();
lineDrawer.addComponent(MeshRenderer);
lineDrawer.addComponent(LineDrawer);

class SelectScript extends Script {
  mesh: ModelMesh;
  transform: Transform;
  ray = new Ray();
  mouse = new Vector3();
  hit = new SelectionResult();
  camera: Camera;

  onAwake() {
    this.camera = this.entity.getComponent(Camera);
  }

  onUpdate(deltaTime: number) {
    // this.faceRaycast();
    this.vertexRaycast();
  }

  vertexRaycast() {
    const { engine, mouse } = this;
    const { inputManager } = engine;
    const { pointers } = inputManager;
    if (!pointers) {
      return;
    }
    for (let i = pointers.length - 1; i >= 0; i--) {
      const pointer = pointers[i];
      this.camera.screenToWorldPoint(new Vector3(pointer.position.x, pointer.position.y, 0), mouse);
      const entry = HandleUtility.vertexRaycast(this.camera, this.mesh, this.transform, mouse);

      if (entry != null) {
        HandleUtility.highlightVertex(this.camera, entry);
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
