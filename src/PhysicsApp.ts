/**
 * @title Infinity Grid
 * @category Toolkit
 */

import { Camera, GLTFResource, WebGLEngine, Vector3, Script } from "oasis-engine";
import { OrbitControl } from "oasis-engine-toolkit";
import { GridControl } from "./GridControl";

class GridCameraControl extends Script {
  girdControl: GridControl;
  camera: Camera;

  onUpdate(deltaTime: number) {
    this.girdControl.distance = camera.entity.transform.worldPosition.lengthSquared() / 8;
  }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
const camera = cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(6, 6, 6);
cameraEntity.transform.lookAt(new Vector3());
cameraEntity.addComponent(OrbitControl);

const grid = rootEntity.addComponent(GridControl);
grid.camera = camera;

const script = rootEntity.addComponent(GridCameraControl);
script.camera = camera;
script.girdControl = grid;

engine.resourceManager
  .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/267000040/9994/%25E5%25BD%2592%25E6%25A1%25A3.gltf")
  .then((gltf) => {
    rootEntity.addChild(gltf.defaultSceneRoot);
  });

engine.run();
