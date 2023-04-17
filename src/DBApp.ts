import {
  AmbientLight,
  AssetType,
  Camera,
  PointLight,
  Vector3,
  WebGLEngine,
  Script,
  Entity,
  Color,
  MeshRenderer,
  PrimitiveMesh,
  PBRMaterial
} from "oasis-engine";

import { LitePhysics } from "@oasis-engine/physics-lite";
import { OrbitControl } from "@oasis-engine-toolkit/controls";
import { DynamicBone } from "./db/DynamicBone";

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

  var entity = createEntity(rootEntity, new Vector3(1, -1, 0), new Color(0, 0.7, 0));
  entity.addComponent(MoveScript);
  let dynamicBone = entity.addComponent(DynamicBone);
  dynamicBone.setWeight(0.9);

  entity = createEntity(entity, new Vector3(1, -1, 0));
  dynamicBone.root = entity.transform;

  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));
  entity = createEntity(entity, new Vector3(1, -1, 0));

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
