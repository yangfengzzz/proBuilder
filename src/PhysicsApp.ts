import { OrbitControl } from "@oasis-engine-toolkit/controls";
import { PhysXPhysics } from "@oasis-engine/physics-physx";
import { LitePhysics } from "@oasis-engine/physics-lite";
import { WireframeManager } from "@oasis-engine-toolkit/auxiliary-lines";
import {
  AmbientLight,
  AssetType,
  BackgroundMode,
  BoxColliderShape,
  Camera,
  DirectLight,
  Entity,
  MeshRenderer,
  PBRMaterial,
  PrimitiveMesh,
  Quaternion,
  Script,
  ShadowType,
  SkyBoxMaterial,
  StaticCollider,
  Vector3,
  WebGLEngine,
  ColliderShape,
  DynamicCollider,
  Logger
} from "oasis-engine";

Logger.enable();

function addBox(rootEntity: Entity, size: Vector3, position: Vector3, rotation: Quaternion, isStatic): Entity {
  const mtl = new PBRMaterial(rootEntity.engine);
  mtl.roughness = 0.2;
  mtl.metallic = 0.8;
  mtl.baseColor.set(1, 1, 0, 1.0);
  const boxEntity = rootEntity.createChild();
  const renderer = boxEntity.addComponent(MeshRenderer);
  renderer.mesh = PrimitiveMesh.createCuboid(rootEntity.engine, size.x, size.y, size.z);
  renderer.setMaterial(mtl);
  boxEntity.transform.position = position;

  //boxEntity.transform.rotationQuaternion = rotation;
  boxEntity.transform.rotate(new Vector3(0, 60, 0));
  //boxEntity.transform.scale = new Vector3(0.5,0.5,0.5)

  const physicsBox = new BoxColliderShape();
  physicsBox.size = size;
  if (isStatic) {
    // physicsBox.isTrigger = true;
    const boxCollider = boxEntity.addComponent(StaticCollider);
    boxCollider.addShape(physicsBox);
  } else {
    const boxCollider = boxEntity.addComponent(DynamicCollider);
    boxCollider.isKinematic = true;
    boxCollider.addShape(physicsBox);
  }

  class CollisionScript extends Script {
    onTriggerExit(other: ColliderShape) {
      console.log("onTriggerExit");

      (<PBRMaterial>renderer.getMaterial()).baseColor.set(Math.random(), Math.random(), Math.random(), 1.0);
    }

    onTriggerEnter(other: ColliderShape) {
      console.log("onTriggerEnter");
      (<PBRMaterial>renderer.getMaterial()).baseColor.set(Math.random(), Math.random(), Math.random(), 1.0);
    }

    onTriggerStay(other: ColliderShape) {}

    onCollisionEnter(other: ColliderShape) {
      console.log("onCollisionEnter");
      (<PBRMaterial>renderer.getMaterial()).baseColor.set(Math.random(), Math.random(), Math.random(), 1.0);
    }
    onCollisionStay() {}

    onCollisionExit(other: ColliderShape) {
      console.log("onCollisionExit");
      (<PBRMaterial>renderer.getMaterial()).baseColor.set(Math.random(), Math.random(), Math.random(), 1.0);
    }
  }
  boxEntity.addComponent(CollisionScript);
  const wireframe = rootEntity.addComponent(WireframeManager); // debug draw
  wireframe.addEntityWireframe(boxEntity);

  return boxEntity;
}

PhysXPhysics.initialize().then(() => {
  const engine = new WebGLEngine("canvas");
  engine.physicsManager.initialize(LitePhysics);
  engine.canvas.resizeByClientSize();

  const scene = engine.sceneManager.activeScene;
  scene.shadowDistance = 10;
  const { background } = scene;
  const rootEntity = scene.createRootEntity();

  // camera
  const cameraEntity = rootEntity.createChild("camera_node");
  cameraEntity.transform.position.set(0, 10, 0);
  cameraEntity.addComponent(Camera);
  cameraEntity.addComponent(OrbitControl);

  const lightNode = rootEntity.createChild("light_node");
  lightNode.transform.setPosition(8, 10, 10);
  lightNode.transform.lookAt(new Vector3(0, 0, 0));
  const directLight = lightNode.addComponent(DirectLight);
  directLight.shadowType = ShadowType.SoftLow;

  // Create sky
  const sky = background.sky;
  const skyMaterial = new SkyBoxMaterial(engine);
  background.mode = BackgroundMode.Sky;
  sky.material = skyMaterial;
  sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

  const slope = new Quaternion();
  const boxEntity = addBox(rootEntity, new Vector3(2, 2, 2), new Vector3(0, 0, 0), slope, true);
  addBox(rootEntity, new Vector3(2, 2, 2), new Vector3(3, 0, 0), slope, true);
  class Move extends Script {
    onUpdate() {
      const { x, y, z } = this.entity.transform.worldPosition;
      this.entity.transform.setWorldPosition(x + 0.01, y, z);
    }
  }
  boxEntity.addComponent(Move);

  engine.resourceManager
    .load<AmbientLight>({
      type: AssetType.Env,
      url: "https://gw.alipayobjects.com/os/bmw-prod/09904c03-0d23-4834-aa73-64e11e2287b0.bin"
    })
    .then((ambientLight) => {
      scene.ambientLight = ambientLight;
      skyMaterial.textureCubeMap = ambientLight.specularTexture;
      skyMaterial.textureDecodeRGBM = true;

      engine.run();
    });
});
