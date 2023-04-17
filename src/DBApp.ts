import {
  AmbientLight,
  AssetType,
  Camera,
  Color,
  Entity,
  MeshRenderer,
  PBRMaterial,
  PointLight,
  PrimitiveMesh,
  Script,
  Vector3,
  WebGLEngine
} from "oasis-engine";
import * as dat from "dat.gui";
import { LitePhysics } from "@oasis-engine/physics-lite";
import { OrbitControl } from "@oasis-engine-toolkit/controls";
import { DynamicBone, UpdateMode } from "./db/DynamicBone";
import { DynamicBoneCollider } from "./db/DynamicBoneCollider";
import { LineDrawer } from "./src";

class MoveScript extends Script {
  private _rTri: number = 0;

  override onUpdate(deltaTime: number) {
    this._rTri += deltaTime * 8;
    this.entity.transform.position.set(0, Math.cos(this._rTri), 0);
  }
}

function createEntity(entity: Entity, offset: Vector3, color: Color = new Color(0.7, 0.0, 0.0)): Entity {
  let cubeEntity = entity.createChild();
  cubeEntity.transform.position = offset;
  let renderer = cubeEntity.addComponent(MeshRenderer);
  renderer.mesh = PrimitiveMesh.createCuboid(entity.engine);
  let material = new PBRMaterial(entity.engine);
  material.baseColor = color;
  renderer.setMaterial(material);
  return cubeEntity;
}

class ColliderDebugger extends Script {
  private _dynamicBone: DynamicBone;
  collider: DynamicBoneCollider;

  override onAwake() {
    let colliderEntity = this.entity.createChild();
    colliderEntity.transform.position = new Vector3(3, -2, 0);
    this.collider = colliderEntity.addComponent(DynamicBoneCollider);
  }

  get dynamicBone(): DynamicBone {
    return this._dynamicBone;
  }

  set dynamicBone(value: DynamicBone) {
    this._dynamicBone = value;
    this._dynamicBone.colliders.push(this.collider);
  }

  override onUpdate(deltaTime: number) {
    LineDrawer.drawSphere(this.collider.radius, this.collider.entity.transform.worldPosition);
  }
}

WebGLEngine.create({ canvas: "canvas", physics: new LitePhysics() }).then((engine) => {
  engine.canvas.resizeByClientSize();
  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity("root");
  rootEntity.addComponent(MeshRenderer);
  rootEntity.addComponent(LineDrawer);
  const colliderDebugger = rootEntity.addComponent(ColliderDebugger);
  const collider = colliderDebugger.collider;

  scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
  scene.ambientLight.diffuseIntensity = 1.2;

  // init camera
  const cameraEntity = rootEntity.createChild("camera");
  cameraEntity.addComponent(Camera);
  cameraEntity.transform.setPosition(10, 10, 10);
  cameraEntity.transform.lookAt(new Vector3());
  const control = cameraEntity.addComponent(OrbitControl);
  control.target.set(4, -4, 0);

  // init point light
  const light = rootEntity.createChild("light");
  light.transform.setPosition(0, 3, 0);
  light.addComponent(PointLight);

  var entity = createEntity(rootEntity, new Vector3(1, -1, 0), new Color(0, 0.7, 0));
  entity.addComponent(MoveScript);
  let dynamicBone = entity.addComponent(DynamicBone);
  dynamicBone.setWeight(0.9);

  entity = createEntity(entity, new Vector3(1, -1, 0));
  dynamicBone.root = entity.transform;
  colliderDebugger.dynamicBone = dynamicBone;

  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));

  function openDebug(): void {
    const info = {
      colliderRadius: 1,
      colliderY: 0
    };

    const gui = new dat.GUI();
    gui.add(info, "colliderRadius", 0, 10).onChange((v) => {
      collider.radius = v;
    });
    gui.add(info, "colliderY", -10, 10).onChange((v) => {
      collider.entity.transform.worldPosition.y = v;
    });
  }

  engine.resourceManager
    .load<AmbientLight>({
      type: AssetType.Env,
      url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin"
    })
    .then((ambientLight) => {
      scene.ambientLight = ambientLight;
      openDebug();
      engine.run();
    });
});
