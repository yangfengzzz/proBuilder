import { OrbitControl } from "@oasis-engine-toolkit/controls";
import {
  AmbientLight,
  AssetType,
  Camera,
  DirectLight,
  GLTFResource,
  ShadowType,
  Vector3,
  WebGLEngine
} from "oasis-engine";
import { MeshRenderer, PrimitiveMesh, UnlitMaterial } from "../../oasis-engine/packages/core";
async function init() {
  const engine = new WebGLEngine("canvas");
  engine.canvas.resizeByClientSize();

  const scene = engine.sceneManager.activeScene;
  // Set shadow distance
  scene.shadowDistance = 20;

  // Create root entity
  const rootEntity = scene.createRootEntity();

  // Create camera entity and component
  const cameraEntity = rootEntity.createChild("camera");
  cameraEntity.transform.setPosition(0, 10, 3);
  cameraEntity.addComponent(Camera);
  const control = cameraEntity.addComponent(OrbitControl);
  control.target = new Vector3(30, 0, 5);

  const boxEntity = rootEntity.createChild("light");
  boxEntity.transform.worldPosition.set(30, 5, 5);
  const renderer = boxEntity.addComponent(MeshRenderer);
  renderer.mesh = PrimitiveMesh.createSphere(engine, 2);
  renderer.setMaterial(new UnlitMaterial(engine));

  // Create light entity and component
  const lightEntity = rootEntity.createChild("light");
  lightEntity.transform.setPosition(0.5, 0.9, 0);
  lightEntity.transform.lookAt(new Vector3(0, 0, 0));
  const directLight = lightEntity.addComponent(DirectLight);

  // Enable shadow
  directLight.shadowType = ShadowType.SoftLow;

  const glTFResource = await engine.resourceManager.load<GLTFResource>("withNormal/HZ_Environment_wilan_LGH.gltf");
  rootEntity.addChild(glTFResource.defaultSceneRoot);

  const ambientLight = await engine.resourceManager.load<AmbientLight>({
    type: AssetType.Env,
    url: "https://gw.alipayobjects.com/os/bmw-prod/09904c03-0d23-4834-aa73-64e11e2287b0.bin"
  });
  scene.ambientLight = ambientLight;

  engine.run();
}
init();
