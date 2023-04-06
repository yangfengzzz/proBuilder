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
  Transform,
  Pointer
} from "oasis-engine";

import { LineDrawer } from "./src";
import { HandleUtility } from "./src/HandleUtility";
import { SelectionResult } from "./src/SelectionResult";
import { OrbitControl } from "@oasis-engine-toolkit/controls";
import { VertexPickerEntry } from "./src/VertexPickerEntry";
import { LitePhysics } from "@oasis-engine/physics-lite";

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
  // cameraEntity.addComponent(OrbitControl);

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
    private startPointerPos = new Vector3();
    private tempVec3: Vector3 = new Vector3();
    private zValue: number = 0;

    mesh: ModelMesh;
    transform: Transform;
    ray = new Ray();
    mouse = new Vector3();
    hit = new SelectionResult();
    camera: Camera;
    entry: VertexPickerEntry;

    onAwake() {
      this.camera = this.entity.getComponent(Camera);
    }

    onPointerDrag(pointer: Pointer) {
      const { tempVec3, startPointerPos } = this;
      const { transform } = this.entity;
      const invCanvasWidth = 1 / engine.canvas.width;
      const invCanvasHeight = 1 / engine.canvas.height;
      this.tempVec3.set(pointer.position.x * invCanvasWidth, pointer.position.y * invCanvasHeight, this.zValue);
      this.camera.viewportToWorldPoint(tempVec3, tempVec3);
      Vector3.subtract(tempVec3, startPointerPos, startPointerPos);
      startPointerPos.copyFrom(tempVec3);

      if (this.entry != null) {
        const entry = this.entry;
        const positions = entry.mesh.getPositions();
        const position = positions[entry.vertex];
        position.add(startPointerPos);
        // fresh
        entry.mesh.setPositions(positions);
        entry.mesh.uploadData(false);
      }
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
        mouse.set(pointer.position.x, pointer.position.y, 1);
        const entry = HandleUtility.vertexRaycast(this.camera, this.mesh, this.transform, mouse);

        if (entry != null) {
          HandleUtility.highlightVertex(this.camera, entry);
          this.entry = entry;
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
});
