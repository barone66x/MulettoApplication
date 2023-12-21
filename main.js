"use strict";
import * as Three from "three";
import "./style.css";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import { ShapeGeometry } from "three/src/geometries/ShapeGeometry";
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
let bobinaPath = "./models/bobina2.fbx";
let floors = [];
let bobine = [];
let floorPolygons = [];
let bobinaPolygons = [];

let rotationSpeed = 0.05;
let translationSpeed = 0.25;
const worldScale = 0.002;

let isForkliftLoaded = false;

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

let currentBobinaOffsetX;
let currentBobinaOffsetY;

//#region Camere e Control
const editCamera = new Three.PerspectiveCamera(70, res.width / res.height);
editCamera.position.z -= 8;
editCamera.lookAt(0, 0, 0);

const forkLiftCamera = new Three.PerspectiveCamera(
  90,
  res.width / res.height,
  0.1,
  5000 / worldScale
);

const skyCamera = new Three.PerspectiveCamera(
  70,
  res.width / res.height,
  0.1,
  5000 / worldScale
);

forkLiftCamera.position.z -= 0.5 / worldScale;
forkLiftCamera.position.y -= 0.75 / worldScale;

skyCamera.position.x = 0;
skyCamera.position.y = 10 / worldScale;
skyCamera.position.z = 0;
skyCamera.lookAt(new Three.Vector3(0, 0, 0));

const control = new ArcballControls(editCamera, renderer.domElement, scene);
let currentCamera = forkLiftCamera;
//#endregion

//#region Creazione Bottoni
// createButton("cameraBtn", 10, 10, "Cambia Camera", () => {
//   changeCamera();
// });

// createButton("stressBtn", 120, 10, "Stress Test", () => {
//   stressTest();
// });

// createButton("generateBtn", 199, 10, "Genera Bobina", () => {
//   spawnBobina(5);
//   generateBtn.disabled = true;
//   loadBtn.disabled = true;
//   unloadBtn.disabled = false;
// });

// createButton("unloadBtn", 302, 10, "Scarica Bobina", () => {
//   unloadForklift();
//   unloadBtn.disabled = true;
//   generateBtn.disabled = false;
// });

// createButton("loadBtn", 405, 10, "Carica Bobina", () => {
//   loadForklift();
//   loadBtn.disabled = true;
//   generateBtn.disabled = true;
//   unloadBtn.disabled = false;
// });

// createButton("forwardBtn", 50, 150, "↑", () => {});
// createButton("backBtn", 50, 210, "↓", () => {});
// createButton("leftBtn", 20, 180, "←", () => {});
// createButton("rightBtn", 73, 180, "→", () => {});

const container = document.createElement("div");
container.className = "container-fluid contentDiv";

const navbar = document.createElement("div");
navbar.className = "row p-1";

container.appendChild(navbar);

document.body.appendChild(container);

const cameraBtn = addToNavbar("Cambio Camera", () => { changeCamera(); });
const stressBtn = addToNavbar("Stress Test", () => { stressTest(); });

const generateBtn = addToNavbar("Genera Bobina", () => { 
  spawnBobina(5);
  generateBtn.disabled = true;
  loadBtn.disabled = true;
  unloadBtn.disabled = false;
});

const unloadBtn = addToNavbar("Scarica Bobina", () => {
  unloadForklift();
  unloadBtn.disabled = true;
  generateBtn.disabled = false;
});

const loadBtn = addToNavbar("Carica Bobina", () => {
  loadForklift();
  loadBtn.disabled = true;
  generateBtn.disabled = true;
  unloadBtn.disabled = false;
});

addControls();

function addControls() {

  const span = document.createElement("span");
  span.className = "col-4"

  const controls = document.createElement("div");
  controls.className = "col-12 col-md-5 col-lg-4 fixed-bottom px-4"
  container.appendChild(controls);

  const controlsT = document.createElement("div");
  controlsT.className = "row"
  controls.appendChild(controlsT);
  
  const controlsM = document.createElement("div");
  controlsM.className = "row"
  controls.appendChild(controlsM);
  
  const controlsB = document.createElement("div");
  controlsB.className = "row"
  controls.appendChild(controlsB);
  
  const downBtn = document.createElement("button");
  downBtn.className = "col-4 py-2 m-0"
  downBtn.appendChild(document.createTextNode("↓"));
  controlsB.appendChild(span);
  controlsB.appendChild(downBtn);
  
  const upBtn = document.createElement("button");
  upBtn.className = "col-4 py-2 m-0"
  upBtn.appendChild(document.createTextNode("↑"));
  controlsT.appendChild(span.cloneNode());
  controlsT.appendChild(upBtn);
  
  const leftBtn = document.createElement("button");
  leftBtn.className = "col-4 py-2 m-0"
  leftBtn.appendChild(document.createTextNode("←"));
  controlsM.appendChild(leftBtn);
  controlsM.appendChild(span.cloneNode());
  
  const rightBtn = document.createElement("button");
  rightBtn.className = "col-4 py-2 m-0"
  rightBtn.appendChild(document.createTextNode("→"));
  controlsM.appendChild(rightBtn);
  
}

function addToNavbar(text, func) {
  const btn = document.createElement("button");
  btn.className = "col m-1"

  const btnText = document.createTextNode(text);
  btn.appendChild(btnText);

  btn.addEventListener("click", func);

  navbar.appendChild(btn);
  return btn;
}

// btnAddEventListener("forwardBtn", "touchstart", () => {
//   inputMovement.movement = 1;
// });
// btnAddEventListener("forwardBtn", "touchend", () => {
//   inputMovement.movement -= (1 + inputMovement.movement) / 2;
// });

// btnAddEventListener("backBtn", "touchstart", () => {
//   inputMovement.movement = -1;
// });
// btnAddEventListener("backBtn", "touchend", () => {
//   inputMovement.movement += (1 - inputMovement.movement) / 2;
// });

// btnAddEventListener("leftBtn", "touchstart", () => {
//   inputMovement.rotation = 1;
// });
// btnAddEventListener("leftBtn", "touchend", () => {
//   inputMovement.rotation -= (1 + inputMovement.rotation) / 2;
// });

// btnAddEventListener("rightBtn", "touchstart", () => {
//   inputMovement.rotation = -1;
// });
// btnAddEventListener("rightBtn", "touchend", () => {
//   inputMovement.rotation += (1 - inputMovement.rotation) / 2;
// });

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

const forkLiftScale = 2;

const forkLift = await loadFbx(forkliftPath);
scene.add(forkLift);
forkLift.position.y = -22 * forkLiftScale * (worldScale / 0.02);
forkLift.scale.multiplyScalar(worldScale * forkLiftScale);
forkLift.rotation.z = Math.PI;
forkLift.add(forkLiftCamera);
forkLift.add(skyCamera);
// #endregion

//inizialmente disabilito il bottone del carica/scarica bobina

loadBtn.disabled = true;
unloadBtn.disabled = true;

generateFloors();
generateBobine();


document.body.appendChild(renderer.domElement);

//ANIMATE
function animate() {
  forkLift.rotation.y -= inputMovement.rotation * rotationSpeed;
  forkLift.translateZ(-inputMovement.movement * translationSpeed);

  floorCollision();
  if (!isForkliftLoaded) {
    bobinaCollision();
  }

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

function generateFloorsOld() {
  floors.forEach((f) => {
    const floor = new Three.Mesh(
      new Three.BoxGeometry(f.size.x, 0.3, f.size.y),
      new Three.MeshBasicMaterial({ color: "#e897f0" })
    );

    floor.position.x = f.position.x + f.size.x / 2;
    floor.position.z = f.position.y + f.size.y / 2;

    floor.rotation.y = Three.MathUtils.degToRad(f.rotation);

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

function generateFloors() {
  floors.forEach((floor) => {
    let floorShape = new Three.Shape();
    floorShape.moveTo(floor.point1.x, floor.point1.y)
    floorShape.lineTo(floor.point2.x, floor.point2.y)
    floorShape.lineTo(floor.point3.x, floor.point3.y)
    floorShape.lineTo(floor.point4.x, floor.point4.y)
    floorShape.lineTo(floor.point1.x, floor.point1.y)
    const floorGeometry = new Three.ShapeGeometry(floorShape);
    let newFloor = new Three.Mesh(
      floorGeometry,
      new Three.MeshPhongMaterial({ side: Three.DoubleSide })
    );
    newFloor.position.y = plane.position.y - 0.2;
    // console.log(floorShape);
    scene.add(newFloor);
    generateFloorPolygon(floor);
    newFloor.name = floor.id;
    // console.log(newFloor.position);
    newFloor.rotation.x = Math.PI / 2;
  });
}

async function generateBobine() {
  bobine = await loadJson(path2);
  bobine.forEach(async (f) => {
    const bobina = await loadFbx(bobinaPath);
    let newCenter = new Point(f.position.x, f.position.y);

    bobina.scale.set(
      worldScale * f.base,
      worldScale * f.depth,
      worldScale * f.height
    );
    if (!f.isStanding) {
      bobina.rotation.z = -Math.PI / 2;
      newCenter = rotateOnAxis(
        f.position,
        new Point(f.position.x, f.position.y),
        f.rotation
      );
    }
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

function generateFloorPolygonOld(center, floor) {
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

function generateFloorPolygon(floorJson){
  const fakeCenter = new Point(floorJson.point1.x,floorJson.point1.y);
  const polygon = new dc.Polygon(fakeCenter,[
    new Point(floorJson.point1.x - fakeCenter.x, floorJson.point1.y - fakeCenter.y),
    new Point(floorJson.point2.x - fakeCenter.x, floorJson.point2.y - fakeCenter.y),
    new Point(floorJson.point3.x - fakeCenter.x, floorJson.point3.y - fakeCenter.y),
    new Point(floorJson.point4.x - fakeCenter.x, floorJson.point4.y - fakeCenter.y)
  ]);
  polygon.name = floorJson.id;

  polygon.calcPoints.forEach((point) => {
    const helper = new Three.Mesh(
      new Three.BoxGeometry(0.5, 10, 0.5),
      new Three.MeshNormalMaterial()
    );
    helper.position.set(polygon.pos.x + point.x, 0, polygon.pos.y + point.y);
    scene.add(helper);
  });

  // console.log(floorJson.point2.x - fakeCenter.x);
  // console.log(floorJson.point2.y - fakeCenter.y);
  console.log(polygon);
  floorPolygons.push(polygon);
}

function generateBobinaPolygon(center, bobina) {
  const polygon = new dc.Polygon(center, [
    rotateOnAxis(
      new Point(0, 0),
      new Point(0, bobina.base / 2),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(0, -bobina.base / 2),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(bobina.depth / 2, bobina.base / 2),
      bobina.rotation
    ),
    rotateOnAxis(
      new Point(0, 0),
      new Point(bobina.depth / 2, -bobina.base / 2),
      bobina.rotation
    ),
  ]);

  polygon.name = bobina.id;
  bobinaPolygons.push(polygon);

  // polygon.calcPoints.forEach((point) => {
  //   const helper = new Three.Mesh(
  //     new Three.BoxGeometry(0.5, 10, 0.5),
  //     new Three.MeshNormalMaterial()
  //   );
  //   helper.position.set(polygon.pos.x + point.x, 0, polygon.pos.y + point.y);
  //   helper.rotation.y = Three.MathUtils.degToRad(bobina.rotation);
  //   scene.add(helper);
  // });
}

function removePolygon(position) {
  let indexToRemove;
  bobinaPolygons.forEach((x) => {
    if (isInArea(position, x)) {
      indexToRemove = bobinaPolygons.indexOf(x);
    }
  });
  bobinaPolygons.splice(indexToRemove, 1);
}

function floorCollision() {
  let trovato = false;
  floorPolygons.forEach((area) => {
    if (isInArea(new Point(forkLift.position.x, forkLift.position.z), area)) {
      currentArea = floors.find((x) => x.id == area.name);
      trovato = true;
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
    changeBobinaLabel();
    loadBtn.disabled = false;
  } else {
    currentBobina = "";
    bobinaLabel.innerHTML = "";
    loadBtn.disabled = true;
  }
}

function changeBobinaLabel() {
  bobinaLabel.innerHTML =
    "bobina id: " +
    currentBobina.id +
    "<br> bobina depth: " +
    currentBobina.depth +
    "<br>bobina diameter: " +
    currentBobina.base;
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

function createControllerButton() {
  const div = document.createElement("div");

  const btnUp = document.createElement("button");
  const btnDown = document.createElement("button");
  const btnLeft = document.createElement("button");
  const btnRight = document.createElement("button");

  const spanUp = document.createElement("span");
  const spanDown = document.createElement("span");
  const spanLeft = document.createElement("span");
  const spanRight = document.createElement("span");

  const spanUpText = document.createTextNode("up");
  const spanDownUpText = document.createTextNode("down");
  const spanLeftText = document.createTextNode("left");
  const spanRightText = document.createTextNode("right");

  div.className = "directional-buttons";

  btnUp.className = "direction-button up";
  btnDown.className = "direction-button down";
  btnLeft.className = "direction-button left";
  btnRight.className = "direction-button right";

  btnUp.setAttribute("id", "forwardBtn");
  btnDown.setAttribute("id", "backBtn");
  btnLeft.setAttribute("id", "leftBtn");
  btnRight.setAttribute("id", "rightBtn");

  spanUp.className = "visually-hidden";
  spanDown.className = "visually-hidden";
  spanLeft.className = "visually-hidden";
  spanRight.className = "visually-hidden";

  spanUp.appendChild(spanUpText);
  spanDown.appendChild(spanDownUpText);
  spanLeft.appendChild(spanLeftText);
  spanRight.appendChild(spanRightText);

  btnUp.appendChild(spanUp);
  btnDown.appendChild(spanDown);
  btnLeft.appendChild(spanLeft);
  btnRight.appendChild(spanRight);

  div.appendChild(btnUp);
  div.appendChild(btnDown);
  div.appendChild(btnLeft);
  div.appendChild(btnRight);

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
  } else if (currentCamera == forkLiftCamera) {
    currentCamera = skyCamera;
  } else {
    currentCamera = editCamera;
  }
}

//#region interazione bobine

function unloadForklift() {
  let bobina = forkLift.children[forkLift.children.length - 1];

  scene.attach(bobina);

  let rotation = new Three.Vector3();
  bobina.getWorldDirection(rotation);
  
  rotation = Three.MathUtils.radToDeg(Math.atan2(rotation.z, rotation.x));
  
  currentBobina.position = { x: bobina.position.x, y: bobina.position.z };
  currentBobina.rotation = rotation - 90;
  
  currentBobina.floorId = currentArea.id ? currentArea.id : 0;
  generateBobinaPolygon(
    new Point(bobina.position.x, bobina.position.z),
    currentBobina
  );
  bobine.push(currentBobina);
  isForkliftLoaded = false;

}

function loadForklift() {
  console.log("LOAD");
  let newBobina = scene.children.find(
    (x) =>
      x.name == currentBobina.id && x.type == "Group" && x.children.length == 3
  );
  forkLift.attach(newBobina);
  removePolygon(new Point(forkLift.position.x, forkLift.position.z));
  isForkliftLoaded = true;
}

async function spawnBobina(id) {
  let bobina = (await loadJson("bobineEsterne.json", "id", id))[0];
  let newBobina = await loadFbx(bobinaPath);

  newBobina.name = bobina.id;
  newBobina.scale.set(
    bobina.base / forkLiftScale,
    bobina.depth / forkLiftScale,
    bobina.height / forkLiftScale
  );
  newBobina.rotation.z = Math.PI / 2;

  currentBobinaOffsetX =
    bobina.depth / forkLiftScale / 2 - (0.02 * bobina.depth) / forkLiftScale;
  currentBobinaOffsetY = -(2 + bobina.base / forkLiftScale / 2 / 0.642);

  newBobina.position.x = currentBobinaOffsetX / (forkLiftScale * worldScale);
  newBobina.position.y =
    -(-forkLift.position.y - bobina.base / forkLiftScale / 2 / 0.625) /
    (worldScale * forkLiftScale);
  newBobina.position.z = currentBobinaOffsetY / (worldScale * forkLiftScale);

  forkLift.add(newBobina);
  isForkliftLoaded = true;

  currentBobina = bobina;
  changeBobinaLabel();
}

//#endregion

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
async function loadJson(path, field, filter) {
  let res = await (await fetch(path)).json();
  if (filter && field) {
    res = res.filter((x) => x[field] == filter);
  }

  return res;
}

async function stressTest() {
  const bobina = await loadFbx(bobinaPath);
  bobina.scale.multiplyScalar(worldScale);
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
      const x = bobina.clone();
      x.position.x = i;
      x.position.z = j;
      x.position.y = -2;
      scene.add(x);
    }
  }
}
//#endregion
