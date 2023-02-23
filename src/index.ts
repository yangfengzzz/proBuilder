import { OrbitControl } from "oasis-engine-toolkit";
import {
  Color,
  Camera,
  GLTFResource,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Vector3,
  WebGLEngine,
  BlinnPhongMaterial,
  DirectLight
} from "oasis-engine";
import { ConvexDecompose } from "./ConvexDecompose";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, 3);
cameraEntity.addComponent(OrbitControl);

const lightEntity = rootEntity.createChild();
lightEntity.addComponent(DirectLight).intensity = 0.5;
lightEntity.transform.setPosition(-5, 5, 5);
lightEntity.transform.lookAt(new Vector3(0, 0, 0));

engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

function vec3ToFloat64Array(positions: Vector3[]): Float64Array {
  let array = new Float64Array(positions.length * 3);
  for (let i = 0; i < positions.length; i++) {
    array[3 * i] = positions[i].x;
    array[3 * i + 1] = positions[i].y;
    array[3 * i + 2] = positions[i].z;
  }
  return array;
}

function arrayToVec3(array: Float64Array): Vector3[] {
  let vec: Vector3[] = [];
  vec.length = array.length / 3;
  for (let i = 0; i < vec.length; i++) {
    vec[i] = new Vector3(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]);
  }
  return vec;
}

fetch("http://30.46.128.35:9000/bunny.obj")
  .then((res) => res.text())
  .then((objText) => {
    const lines = objText.split(/\n/);
    const positions: Vector3[] = [];
    const indices: number[] = [];
    lines
      .map((lineText) => lineText.split(" "))
      .forEach((parseTexts) => {
        if (parseTexts[0] === "v") {
          positions.push(new Vector3(parseFloat(parseTexts[1]), parseFloat(parseTexts[2]), parseFloat(parseTexts[3])));
        } else if (parseTexts[0] === "f") {
          indices.push(parseInt(parseTexts[1]) - 1, parseInt(parseTexts[2]) - 1, parseInt(parseTexts[3]) - 1);
        }
      });

    let indexBuffer = Uint32Array.from(indices);
    const mesh = new ModelMesh(engine);
    mesh.setPositions(positions);
    mesh.setIndices(indexBuffer);
    mesh.addSubMesh(0, indices.length, MeshTopology.Triangles);
    mesh.uploadData(false);

    // init cube
    const cubeEntity = rootEntity.createChild("cube");
    const renderer = cubeEntity.addComponent(MeshRenderer);
    renderer.mesh = mesh;
    const material = new BlinnPhongMaterial(engine);
    material.baseColor = new Color(1, 0.25, 0.25, 1);
    renderer.setMaterial(material);

    ConvexDecompose.initialize().then(() => {
      let vertexBuffer = vec3ToFloat64Array(positions);
      // Optionally configure how the decomposition is performed.
      const options = { maxHulls: 20 };
      // debugger;
      let result = ConvexDecompose.computeConvexHulls({ positions: vertexBuffer, indices: indexBuffer }, options);
      debugger;
    });
  });

engine.run();
