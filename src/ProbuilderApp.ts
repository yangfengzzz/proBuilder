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
      this.vertexRaycast();
      if (this.pointer) {
        const entry = this.entry;
        HandleUtility.highlightVertex(this.camera, entry);

        if (
          this.pointer.phase == PointerPhase.Down ||
          this.pointer.phase == PointerPhase.Move ||
          this.pointer.phase == PointerPhase.Stationary
        ) {
          const viewPos = new Vector3();
          Vector3.transformCoordinate(entry.worldPosition, this.camera.viewMatrix, viewPos);

          const newPosition = new Vector3();
          const pointerPosition = this.pointer.position;
          this.camera.screenToWorldPoint(new Vector3(pointerPosition.x, pointerPosition.y, -viewPos.z), newPosition);

          // update
          entry.worldPosition.copyFrom(newPosition);
          const positions = entry.mesh.getPositions();
          const position = positions[entry.vertex];
          position.copyFrom(newPosition);
          // fresh
          entry.mesh.setPositions(positions);
          entry.mesh.uploadData(false);
        } else {
          this.control.enabled = true;
          this.entry = null;
          this.pointer = null;
        }
      }
    }

    vertexRaycast() {
      const { engine, mouse } = this;
      const { inputManager } = engine;
      const { pointers } = inputManager;
      if (pointers && inputManager.isPointerDown(PointerButton.Primary)) {
        for (let i = pointers.length - 1; i >= 0; i--) {
          const pointer = pointers[i];
          mouse.set(pointer.position.x, pointer.position.y, 1);
          const entry = HandleUtility.vertexRaycast(this.camera, this.mesh, this.transform, mouse);

          if (entry != null) {
            HandleUtility.highlightVertex(this.camera, entry);
            this.entry = entry;
            this.pointer = pointer;
            this.control.enabled = false;
          }
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
