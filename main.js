"use strict";
import * as Three from "three";
import "./style.css";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { pointInPolygon } from "detect-collisions"
import * as dc from "detect-collisions"

class Point {
  x;
  y;
  constructor (x,y){
    this.x = x;
    this.y = y;
  }
}

const inputMovement = {
  movement: 0,
  rotation: 0,
}

let path1 = "./floor.json";
let path2 = "./bobine.json";
let forkliftPath = "./models/Forklift.fbx"
let floors = [];
let bobine = [];
let polygons = [];
let rotationSpeed = 0.05;
let translationSpeed = 0.5;
floors = await loadJson(path1);
bobine = await loadJson(path2);

console.log(isInArea("ciao","ciao"))

createButton(10, 10, "Carica Bobina", () => {
  generateBobine(3);
});

const res = {
  // imposto risoluzione iniziale
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new Three.Scene();
scene.rotation.z = Math.PI;
scene.background = new Three.Color(0xffffff);
scene.add(new Three.AmbientLight());

const renderer = new Three.WebGLRenderer();
const clock = new Three.Clock();

const editCamera = new Three.PerspectiveCamera(70, res.width / res.height);
const forkLiftCamera = new Three.PerspectiveCamera(70, res.width / res.height);
let currentCamera = forkLiftCamera;

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

// const box = new Three.Mesh(
//   new Three.BoxGeometry(1, 1, 1),
//   new Three.MeshBasicMaterial({ color: "#ff0000" })
// );
// box.position.y -= 1;
// box.position.z = 0;
// box.position.x = 10;
// box.name = "box1";
// const boxB = new Three.Box3();
// boxB.int
// scene.add(box);


const forkLift = await loadFbx(forkliftPath);
scene.add(forkLift);
forkLift.position.y = -3;
forkLift.scale.multiplyScalar(0.05);
forkLift.scale.y *= 2

// #endregion

forkLift.add(forkLiftCamera);
forkLiftCamera.position.y = -2 / forkLift.scale.x;
forkLiftCamera.position.z = -5 / forkLift.scale.x;
forkLiftCamera.lookAt(forkLift.position.clone().add(new Three.Vector3(0,10,0)));

renderer.setSize(res.width, res.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); //Densità pixel

document.body.appendChild(renderer.domElement);
generateFloors();


function animate() {
  
  forkLift.rotation.y -= inputMovement.rotation * rotationSpeed;

  forkLift.translateZ(inputMovement.movement * translationSpeed);


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
}

function generateFloors() {
  floors.forEach((f) => {

    const floor = new Three.Mesh(
      new Three.BoxGeometry(f.size.x, 0.01, f.size.y),
      new Three.MeshBasicMaterial({ color: "#e897f0" })
    );

    floor.position.x = f.position.x + f.size.x / 2;
    floor.position.z = f.position.y + f.size.y / 2;
    
    floor.rotation.y = Three.MathUtils.degToRad(f.rotation);

    let newCenter = rotateOnAxis(f.position, new Point(floor.position.x, floor.position.z), f.rotation)
    floor.position.x = newCenter.x;
    floor.position.z = newCenter.y;
    
    floor.name = f.id;
    
    scene.add(floor);
  });
}

function rotateOnAxis(centerOfRotation, point, rotationAngle){
  let newPoint = {};

  newPoint.x =
  (point.x - centerOfRotation.x) * Math.cos(Three.MathUtils.degToRad(-rotationAngle)) -
  (point.y - centerOfRotation.y) * Math.sin(Three.MathUtils.degToRad(-rotationAngle)) +
  centerOfRotation.x;

  newPoint.y =
  (point.x - centerOfRotation.x) * Math.sin(Three.MathUtils.degToRad(-rotationAngle)) +
  (point.y - centerOfRotation.y) * Math.cos(Three.MathUtils.degToRad(-rotationAngle)) +
  centerOfRotation.y;

  return newPoint;
}

function generateFloorPolygon(floor){
  const polygon = new dc.Polygon(new Point(floor))
}

async function generateBobine(idPavimento) {
  bobine = await loadJson(path2, idPavimento, "floorId");
  bobine.forEach(async (f) => {
    const bobina = await loadFbx("./models/bobina2.fbx");
    bobina.scale.set(0.02 * f.diameter, 0.02 * f.length, 0.02 * f.diameter);
    bobina.rotation.z = Math.PI / 2;
    bobina.position.y = -(f.diameter / 2 - 0.1 * f.diameter);
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
  console.log(x);

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

}

function createButton(left, top, text, func) {
  const div = document.createElement("div");
  const btn = document.createElement("button");
  const btnText = document.createTextNode(text);

  div.style.left = left + "px";
  div.style.top = top + "px";

  div.className = "btnDiv";
  btn.addEventListener("click", func);

  btn.appendChild(btnText);
  div.appendChild(btn);

  document.body.appendChild(div);
}

function isInArea(point, area){
  return pointInPolygon(new Point(0,5), new dc.Polygon(new Point(110,110),
 [new Point(-1,-1), new Point(1,-1),new Point(-1,1), new Point(1,1)]))
}


//#region EventListener
window.addEventListener("resize", onResize);

window.addEventListener("keydown", (event) => {
 
  switch (event.code) {
    case "KeyA": {
      inputMovement.rotation = 1;
      break;
    }
    case "KeyD": {
      inputMovement.rotation = -1;
      break;
    }
    case "KeyW": {
      inputMovement.movement = 1;
      break;
    }
    case "KeyS": {
      inputMovement.movement = -1;
      break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  
  switch (event.code) {
    case "KeyA": {
      inputMovement.rotation -= (1 + inputMovement.rotation)/ 2;
      break;
    }
    case "KeyD": {
      inputMovement.rotation += (1 - inputMovement.rotation)/ 2;
      break;
    }
    case "KeyW": {
      inputMovement.movement -= (1 + inputMovement.movement)/ 2;
      break;
    }
    case "KeyS": {
      inputMovement.movement += (1 - inputMovement.movement)/ 2;
      break;
    }
  }
});

//#endregion

//#region Carica Liste
async function loadJson(path, filter, field) {
  let res = await (await fetch(path)).json();
  if (filter && field) {
    res = res.filter((x) => x[field] == filter);
  }

  return res;
}
//#endregion
