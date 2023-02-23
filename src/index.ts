import { OrbitControl } from "oasis-engine-toolkit";
import { Camera, GLTFResource, WebGLEngine } from "oasis-engine";
import { ConvexDecompose } from "./ConvexDecompose";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, 3);
cameraEntity.addComponent(OrbitControl);

engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

engine.resourceManager.load<GLTFResource>("scene.glb").then((gltf) => {
  rootEntity.addChild(gltf.defaultSceneRoot);
});

ConvexDecompose.initialize().then(() => {
  debugger;
});

engine.run();
