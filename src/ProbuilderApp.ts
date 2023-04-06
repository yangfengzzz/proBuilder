import {
  WebGLEngine,
  Vector3,
  MeshRenderer,
  PointLight,
  Camera,
  Script,
  AmbientLight,
  AssetType,
  Color
} from "oasis-engine";

import { LineDrawer } from "./src";
import { PointDrawer } from "./src/PointDrawer";

const engine = new WebGLEngine("canvas");

engine.canvas.resizeByClientSize();
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity("root");

scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
scene.ambientLight.diffuseIntensity = 1.2;

// init camera
const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(1, 0, 1);
cameraEntity.transform.lookAt(new Vector3());

// init point light
const light = rootEntity.createChild("light");
light.transform.setPosition(0, 3, 0);
light.addComponent(PointLight);

const lineDrawer = rootEntity.createChild();
lineDrawer.addComponent(MeshRenderer);
lineDrawer.addComponent(LineDrawer);
const pointDrawer = rootEntity.createChild();
pointDrawer.addComponent(MeshRenderer);
pointDrawer.addComponent(PointDrawer);

class DrawScript extends Script {
  onUpdate(deltaTime: number) {
    PointDrawer.drawPoint(new Vector3(), new Color(1, 0, 0, 1));

    // LineDrawer.drawLine(new Vector3(0, 0, 0), new Vector3(1, 2, 0));
    // LineDrawer.drawLine(new Vector3(1, 2, 0), new Vector3(2, 1, 0));
    // LineDrawer.drawLine(new Vector3(2, 1, 0), new Vector3(0, 0, 0));
    // LineDrawer.drawSphere(2, new Vector3(-4, 0, 0));
    // LineDrawer.drawCapsule(2, 2, new Vector3(4, 0, 0));
    // LineDrawer.drawCuboid(2, 3, 4, new Vector3(0, 0, 0));
  }
}

rootEntity.addComponent(DrawScript);

engine.resourceManager
  .load<AmbientLight>({
    type: AssetType.Env,
    url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin"
  })
  .then((ambientLight) => {
    scene.ambientLight = ambientLight;
    engine.run();
  });
