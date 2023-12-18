"use strict";
import * as Three from "three";
import "./style.css";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { pointInPolygon } from "detect-collisions";
import * as dc from "detect-collisions";

class Point {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const inputMovement = {
  movement: 0,
  rotation: 0,
};

let path1 = "./floor.json";
let path2 = "./bobine.json";
let forkliftPath = "./models/Forklift.fbx";
let floors = [];
let bobine = [];
let floorPolygons = [];
let bobinaPolygons = [];

let rotationSpeed = 0.05;
let translationSpeed = 0.25;
const worldScale = 0.002;

const clock = new Three.Clock();

const res = {
  // imposto risoluzione iniziale
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new Three.WebGLRenderer();
renderer.setPixelRatio(2);
renderer.setSize(res.width, res.height);

const scene = new Three.Scene();
scene.rotation.z = Math.PI;
scene.background = new Three.Color(0xffffff);
scene.add(new Three.AmbientLight());

floors = await loadJson(path1);
bobine = await loadJson(path2);

let currentArea;
let currentBobina;

//#region Camere e Control
const editCamera = new Three.PerspectiveCamera(70, res.width / res.height);
editCamera.position.z -= 8;
editCamera.lookAt(0, 0, 0);

const forkLiftCamera = new Three.PerspectiveCamera(
  70,
  res.width / res.height,
  0.1,
  5000 / worldScale
);

const control = new ArcballControls(editCamera, renderer.domElement, scene);
let currentCamera = forkLiftCamera;
//#endregion

//#region Creazione Bottoni
createButton(10, 10, "Genera Bobina", () => {
  // generateBobine(3);
 
});
createButton(150, 10, "Carica Bobina", () =>{

})

//#endregion

//#region Creazione Label
createLabel(10, 40, "floorLabel");
let floorLabel = document.getElementById("floorLabel");

createLabel(10, 80, "bobinaLabel");
let bobinaLabel = document.getElementById("bobinaLabel");
//#endregion

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
forkLift.position.y = -22 * (worldScale / 0.02);
forkLift.scale.multiplyScalar(worldScale);
forkLift.rotation.z = Math.PI;
forkLift.add(forkLiftCamera);
// #endregion

generateFloors();
generateBobine();

document.body.appendChild(renderer.domElement);

function animate() {
  forkLift.rotation.y -= inputMovement.rotation * rotationSpeed;
  forkLift.translateZ(-inputMovement.movement * translationSpeed);

  floorCollision();
  bobinaCollision();

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

    // floor.position.x =
    //   (x - f.position.x) * Math.cos(Three.MathUtils.degToRad(-f.rotation)) -
    //   (z - f.position.y) * Math.sin(Three.MathUtils.degToRad(-f.rotation)) +
    //   f.position.x;

    // floor.position.z =
    //   (x - f.position.x) * Math.sin(Three.MathUtils.degToRad(-f.rotation)) +
    //   (z - f.position.y) * Math.cos(Three.MathUtils.degToRad(-f.rotation)) +
    //   f.position.y;
    let newCenter = rotateOnAxis(
      f.position,
      new Point(floor.position.x, floor.position.z),
      f.rotation
    );
    floor.name = f.id;
    floor.position.x = newCenter.x;
    floor.position.z = newCenter.y;
    
    floor.name = f.id;
    
    scene.add(floor);

    generateFloorPolygon(newCenter, f);
    // scene.add(cyl);

  });
}
async function generateBobine() {
  bobine = await loadJson(path2);
  bobine.forEach(async (f) => {
    const bobina = await loadFbx("./models/bobina2.fbx");
    let newCenter = new Point(f.position.x, f.position.y);


    bobina.scale.set(
      worldScale * f.base,
      worldScale * f.depth,
      worldScale * f.height
    );
    if (!f.isStanding) {
      bobina.rotation.z = Math.PI / 2;
      newCenter = rotateOnAxis(
        f.position,
        new Point(f.position.x + f.depth / 2, f.position.y),
        f.rotation
      );
    }

    bobina.position.y = -(f.depth / 2); //  - 0.1 * f.depth);
    // bobina.position.y =- 10;c
    bobina.position.x = newCenter.x;
    bobina.position.z = newCenter.y;
    bobina.name = f.id;
    bobina.floorId = f.floorId;
    bobina.rotation.y = Three.MathUtils.degToRad(f.rotation);

    if (f.isStanding) {
      bobina.position.y = -(f.depth / 2 - 0.04 * f.depth);
    } else {
      bobina.position.y = -(f.base / 2 - 0.1 * f.base);
    }
    generateBobinaPolygon(newCenter, f);
    scene.add(bobina);
  });
}

function rotateOnAxis(rotationAxis, point, rotationAngle) {
  let x = point.x;
  let y = point.y;
  let newPoint = {};
  // floor.rotation.y = Three.MathUtils.degToRad(f.rotation);

  newPoint.x =
    (x - rotationAxis.x) * Math.cos(Three.MathUtils.degToRad(-rotationAngle)) -
    (y - rotationAxis.y) * Math.sin(Three.MathUtils.degToRad(-rotationAngle)) +
    rotationAxis.x;

  newPoint.y =
    (x - rotationAxis.x) * Math.sin(Three.MathUtils.degToRad(-rotationAngle)) +
    (y - rotationAxis.y) * Math.cos(Three.MathUtils.degToRad(-rotationAngle)) +
    rotationAxis.y;

  return newPoint;
}

function generateFloorPolygon(center, floor) {
  // const polygon = new dc.Polygon(new Point(floorPosition.x, floorPosition.z))
  const polygon = new dc.Polygon(center, [
    rotateOnAxis(
      new Point(0, 0),
      new Point(-(floor.size.x / 2), floor.size.y / 2),
      floor.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(floor.size.x / 2, floor.size.y / 2),
      floor.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(floor.size.x / 2, -(floor.size.y / 2)),
      floor.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(-(floor.size.x / 2), -(floor.size.y / 2)),
      floor.rotation
    ),
  ]);
  polygon.name = floor.id;
  floorPolygons.push(polygon);

  // let helper = new Three.Mesh(new Three.CylinderGeometry(dc.distance(new Point(0, 0), polygon.points[0]), dc.distance(new Point(0, 0), polygon.points[0]),0.0000001), new Three.MeshBasicMaterial({color: "#ff0000"}));
  // scene.add(helper);
  // helper.position.set(center.x, 0, center.y)
}


function generateBobinaPolygon(center, bobina) {
  // const polygon = new dc.Polygon(new Point(floorPosition.x, floorPosition.z))
  const polygon = new dc.Polygon(center, [
    rotateOnAxis(
      new Point(0, 0),
      new Point(
        -(bobina.base / 2),
        (bobina.isStanding ? bobina.height : bobina.depth) / 2
      ),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(
        bobina.base / 2,
        (bobina.isStanding ? bobina.height : bobina.depth) / 2
      ),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(
        bobina.base / 2,
        -((bobina.isStanding ? bobina.height : bobina.depth) / 2)
      ),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(
        -(bobina.base / 2),
        -((bobina.isStanding ? bobina.height : bobina.depth) / 2)
      ),
      bobina.rotation
    ),
  ]);
  polygon.name = bobina.id;
  bobinaPolygons.push(polygon);

  // let helper = new Three.Mesh(new Three.CylinderGeometry(dc.distance(new Point(0, 0), polygon.points[0]), dc.distance(new Point(0, 0), polygon.points[0]),0.0000001), new Three.MeshBasicMaterial({color: "#ff0000"}));
  // scene.add(helper);
  // helper.position.set(center.x, 0, center.y)
}


function floorCollision() {
  let trovato = false;
  floorPolygons.forEach((area) => {
    if (isInArea(new Point(forkLift.position.x, forkLift.position.z), area)) {
      currentArea = floors.find((x) => x.id == area.name);
      trovato = true;
      // const test = new Three.ShapeGeometry(new Three.Shape())
    }

  });

  if (trovato == true) {
    floorLabel.innerHTML =
      "floor id: " + currentArea.id + "<br> floor name: " + currentArea.name;
  } else {
    currentArea = "";
    floorLabel.innerHTML = "";
  }
}

function bobinaCollision() {
  let trovato = false;
  bobinaPolygons.forEach((bobina) => {
    if (isInArea(new Point(forkLift.position.x, forkLift.position.z), bobina)) {
      currentBobina = bobine.find((x) => x.id == bobina.name);
      trovato = true;
    }
  });

  if (trovato == true) {
    bobinaLabel.innerHTML =
      "bobina id: " +
      currentBobina.id +
      "<br> bobina depth: " +
      currentBobina.depth +
      "<br>bobina diameter: " +
      currentBobina.base;
  } else {
    currentBobina = "";
    bobinaLabel.innerHTML = "";
  }
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

}

function createButton(left, top, text, func) {
  const div = document.createElement("div");
  const btn = document.createElement("button");
  const btnText = document.createTextNode(text);

  div.style.left = left + "px";
  div.style.top = top + "px";

  div.className = "contentDiv col-12";
  btn.addEventListener("click", func);

  btn.appendChild(btnText);
  div.appendChild(btn);

  btn.className = "btn btn-primary p-1 col-2"

  document.body.appendChild(div);
}

function createLabel(left, top, id) {
  const div = document.createElement("div");
  const p = document.createElement("p");
  p.setAttribute("id", id);

  div.style.left = left + "px";
  div.style.top = top + "px";

  div.className = "contentDiv";
  div.appendChild(p);
  document.body.appendChild(div);
}

function isInArea(point, area) {
  return pointInPolygon(point, area);
}

function changeCamera() {
  if (currentCamera == editCamera) {
    currentCamera = forkLiftCamera;
  } else {
    currentCamera = editCamera;
  }
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

    case "KeyC": {
      changeCamera();
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA": {
      inputMovement.rotation -= (1 + inputMovement.rotation) / 2;
      break;
    }
    case "KeyD": {
      inputMovement.rotation += (1 - inputMovement.rotation) / 2;
      break;
    }
    case "KeyW": {
      inputMovement.movement -= (1 + inputMovement.movement) / 2;
      break;
    }
    case "KeyS": {
      inputMovement.movement += (1 - inputMovement.movement) / 2;
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
