"use strict";
import * as Three from "three";
import "./style.css";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

let path1 = "./floor.json";
let path2 = "./bobine.json";
let floors = [];
let bobine = [];
floors = await loadJson(path1);
bobine = await loadJson(path2);

const res = {
  // imposto risoluzione iniziale
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new Three.Scene();
scene.rotation.z = Math.PI;
scene.add(new Three.AxesHelper(100));
scene.background = new Three.Color(0xffffff);

const renderer = new Three.WebGLRenderer();
const clock = new Three.Clock();

const editCamera = new Three.PerspectiveCamera(70, res.width / res.height);
let currentCamera = editCamera;

editCamera.position.z -= 8;
editCamera.position.y += 5;

editCamera.lookAt(0, 0, 0);

const control = new FlyControls(editCamera, renderer.domElement);

control.rollSpeed += 0.6;
control.movementSpeed += 1.6;
control.dragToLook = true;

//#region Generazione Elementi

const plane = new Three.Mesh(
  new Three.PlaneGeometry(100, 100),
  new Three.MeshBasicMaterial({ color: "#37c21b" })
);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

const box = new Three.Mesh(
  new Three.BoxGeometry(1, 1, 1),
  new Three.MeshBasicMaterial({ color: "#ff0000" })
);
// box.add(new Three.AxesHelper());
// box.position.y -= 1;
// box.position.z = 0;
// box.position.x = 10;
// scene.add(box);

// scene.add(new Three.AxesHelper());

//#endregion

renderer.setSize(res.width, res.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); //Densità pixel

document.body.appendChild(renderer.domElement);
generateFloors();
function animate() {
  // box.rotation.y += 0.01;

  let deltaTime = clock.getDelta();
  control.update(deltaTime);

  renderer.render(scene, currentCamera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function onResize() {
  //funzione chiamata dal listener che ascolta il cambio di risoluzione della finestra
  res.height = window.innerHeight;
  res.width = window.innerWidth;

  renderer.setSize(res.width, res.height);

  currentCamera.aspect = res.width / res.height;
  currentCamera.updateProjectionMatrix(); //Se si modificano queste proprietà della currentCamera bisogna aggiornare la matrice d proiezione

  // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function generateFloors() {
  floors.forEach((f) => {
    const floor = new Three.Mesh(
      new Three.BoxGeometry(f.size.x, 0.01, f.size.y),
      new Three.MeshBasicMaterial({ color: "#e897f0" })
    );

    floor.add(new Three.AxesHelper(10));

    // floor.rotation.x = Math.PI * 2 - Math.PI / 2;

    // floor.rotation.y = Three.MathUtils.degToRad(f.rotation);

    // console.log("posizione iniziale");
    // console.log(f.position.x);
    // console.log(f.position.y);

    // let cyl = new Three.Mesh(
    //   new Three.BoxGeometry(1, 1, 1),
    //   new Three.MeshNormalMaterial()
    // );

    // cyl.position.x = f.position.x;
    // cyl.position.z = f.position.y;

    floor.position.x = f.position.x;
    floor.position.z = f.position.y;

    let dx = f.size.x / 2;
    let dy = f.size.y / 2;
 
    floor.position.x += dx;
 
    floor.position.z += dy;

    let x = floor.position.x;
    let z = floor.position.z;
    
    floor.rotation.y = Three.MathUtils.degToRad(f.rotation);
    // cyl.rotation.y = -Three.MathUtils.degToRad(f.rotation);
    
    floor.position.x =
    (x - f.position.x) * Math.cos(Three.MathUtils.degToRad(-f.rotation)) -
    (z - f.position.y) * Math.sin(Three.MathUtils.degToRad(-f.rotation)) +
    f.position.x;
    
    
    
    
    floor.position.z =
    (x - f.position.x) * Math.sin(Three.MathUtils.degToRad(-f.rotation)) +
    (z - f.position.y) * Math.cos(Three.MathUtils.degToRad(-f.rotation)) +
    f.position.y;
    
    // scene.add(floor)
    // cyl.add(floor);
    // cyl.rotation.y += Three.MathUtils.degToRad(f.rotation);

    // floor.position.x -= dx * Math.cos(Three.MathUtils.degToRad(f.rotation));
    // floor.position.z -= dy * Math.sin(Three.MathUtils.degToRad(f.rotation));
    
    floor.name = f.id;
    scene.add(floor);
    // scene.add(cyl);
  });
}

async function generateBobine(idPavimento) {
  bobine = await loadJson(path2, idPavimento);
  bobine.forEach(async (f) => {
    const bobina = await loadFbx("./models/bobina2.fbx");
    bobina.add(new Three.AxesHelper(50));
    bobina.scale.set(0.02 * f.diameter, 0.02 * f.length, 0.02 * f.diameter);
    bobina.rotation.z = Math.PI / 2;
    bobina.position.y = f.diameter / 2 - 0.1 * f.diameter;
    bobina.position.x = f.position.x;
    bobina.position.z = f.position.y;
    bobina.name = f.id;
    bobina.floorId = f.floorId;
    console.log(bobina);
    scene.add(bobina);
  });
}

async function loadFbx(path) {
  const fbxLoader = new FBXLoader();
  let x = new Three.Group();
  x = await fbxLoader.loadAsync(path);

  x.traverse(function (child) {
    if (child.isMesh) {
      if (child.material) {
        child.material.transparent = false;
      }
    }
  });

  let i = 0;
  while (i < x.children.length) {
    if (x.children[i].type != "Mesh") {
      x.children.splice(i, 1);
      i--;
    }
    i++;
  }
  x.castShadow = false;
  x.receiveShadow = false;
  return x;

  // && !(x.children[i].type == "PointLight")
}


//#region EventListener
window.addEventListener("resize", onResize);
//#endregion

//#region Carica Liste
async function loadJson(path) {
  let res;
  res = (await fetch(path)).json();
  return res;
}
//#endregion


