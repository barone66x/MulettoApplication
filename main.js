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

class Mission {
  id;
  bobine;
  destinationArea;
  constructor(id, bobine, destinationArea) {
    this.id = id;
    this.bobine = bobine;
    this.destinationArea = destinationArea;
  }
}

const inputMovement = {
  movement: 0,
  rotation: 0,
};

let inputForkMovement = 0;
let forkSpeed = 0.02;

let floorsJsonPath = "./floor.json";
let bobineJsonPath = "./bobine.json";
let missionsJsonPath = "./missions.json";
let bobineEsterneJsonPath = "./bobineEsterne.json";

let missionsApiPath = "http://172.16.107.136:5174/missions";
let bobineApiPath = "http://172.16.107.136:5174/bobine";
let floorsApiPath = "http://172.16.107.136:5174/floors";
let bobineEsterneApiPath = "http://172.16.107.136:5174/bobineEsterne";

let forkliftPath = "./models/Forklift.fbx";
let bobinaPath = "./models/bobina2.fbx";
let arrowPath = "./models/arrow.fbx";
let floors = [];
let bobine = [];
let missions = [];
let floorPolygons = [];
let bobinaPolygons = [];
let oldBobinaColors = [];

let currentMission;
let rotationSpeed = 0.05;
let translationSpeed = 0.35;
const worldScale = 0.002;

let isForkliftLoaded = false;

const res = {
  // imposto risoluzione iniziale
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new Three.WebGLRenderer({ logarithmicDepthBuffer: true });
renderer.setPixelRatio(2);
renderer.setSize(res.width, res.height);

const scene = new Three.Scene();
scene.rotation.z = Math.PI;
scene.background = new Three.Color(0x95ecfc);
scene.add(new Three.AmbientLight());

// floors = await loadJson(floorsJsonPath);
// bobine = await loadJson(bobineJsonPath);
// missions = await loadJson(missionsJsonPath);
floors = await loadJson(floorsApiPath);
bobine = await loadJson(bobineApiPath);
missions = await loadJson(missionsApiPath);


let currentArea; //json area
let currentBobina; //json bobina
let currentBobinaModel; //modello 3d bobina

let currentBobinaOffsetX;
let currentBobinaOffsetY;

//#region Camere e Control

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

skyCamera.position.x = 0 / worldScale;
skyCamera.position.y = 10 / worldScale;
skyCamera.position.z = 0;
skyCamera.lookAt(new Three.Vector3(0, 0, 0));


const sideCamera = new Three.PerspectiveCamera(
  70,
  res.width / res.height,
  0.1,
  5000 / worldScale
);

sideCamera.position.x = -10 / worldScale;
sideCamera.position.y = 0 / worldScale;
sideCamera.position.z = 0;
sideCamera.lookAt(new Three.Vector3(0, 0, 0));


let currentCamera = forkLiftCamera;
//#endregion

//#region  Gui
const container = document.createElement("div");
container.className = "container-fluid contentDiv";

const navbar = document.createElement("div");
navbar.className = "row p-1";
container.appendChild(navbar);

const informationDiv = document.createElement("div");
informationDiv.className = "d-flex align-items-end flex-column";
container.appendChild(informationDiv);

const informationRows = document.createElement("div");
informationRows.className =
  "d-flex align-items-start flex-column bg-dark rounded-1 bg-opacity-75";
informationDiv.appendChild(informationRows);

document.body.appendChild(container);

const cameraBtn = addToNavbar("Change Camera", () => {
  changeCamera();
});
const stressBtn = addToNavbar("Stress Test", () => {
  stressTest();
});

const generateBtn = addToNavbar("Generate Coil", () => {
  showForm();
});

const unloadBtn = addToNavbar("Unload Fork", () => {
  unloadForklift();
  unloadBtn.disabled = true;
  generateBtn.disabled = false;
});

const loadBtn = addToNavbar("Load Fork", () => {
  loadForklift();
  loadBtn.disabled = true;
  generateBtn.disabled = true;
  unloadBtn.disabled = false;
});

const missionBtn = addToNavbar("Start mission", () => {
  if (missions.length == 0) {
    showPopup("MISSIONI NON DISPONIBILI");
  } else {
    showMissionsForm();
  }
});

const abortlMissionBtn = addToNavbar("Abort mission", () => {
  currentMission = undefined;
  currentTarget = forkLift.position;
  arrow.visible = false;
  targetArrow.visible = false;

  missionBtn.disabled = false;
  abortlMissionBtn.disabled = true;
});
abortlMissionBtn.disabled = true;

addControls();

function addControls() {
  const span = document.createElement("span");
  span.className = "col-4";

  const controls = document.createElement("div");
  controls.className = "col-12 col-sm-3 fixed-bottom px-4 py-3";
  container.appendChild(controls);

  const controlsT = document.createElement("div");
  controlsT.className = "row";
  controls.appendChild(controlsT);

  const controlsM = document.createElement("div");
  controlsM.className = "row";
  controls.appendChild(controlsM);

  const controlsB = document.createElement("div");
  controlsB.className = "row";
  controls.appendChild(controlsB);

  const downBtn = document.createElement("button");
  downBtn.className = "col-4 py-2 m-0";
  downBtn.appendChild(document.createTextNode("↓"));

  controlsB.appendChild(span);
  controlsB.appendChild(downBtn);

  const upBtn = document.createElement("button");
  upBtn.className = "col-4 py-2 m-0";
  upBtn.appendChild(document.createTextNode("↑"));
  controlsT.appendChild(span.cloneNode());
  controlsT.appendChild(upBtn);

  const leftBtn = document.createElement("button");
  leftBtn.className = "col-4 py-2 m-0";
  leftBtn.appendChild(document.createTextNode("←"));
  controlsM.appendChild(leftBtn);
  controlsM.appendChild(span.cloneNode());

  const rightBtn = document.createElement("button");
  rightBtn.className = "col-4 py-2 m-0";
  rightBtn.appendChild(document.createTextNode("→"));
  controlsM.appendChild(rightBtn);

  upBtn.addEventListener("touchstart", () => {
    inputMovement.movement = 1;
  });
  upBtn.addEventListener("touchend", () => {
    inputMovement.movement -= (1 + inputMovement.movement) / 2;
  });

  downBtn.addEventListener("touchstart", () => {
    inputMovement.movement = -1;
  });
  downBtn.addEventListener("touchend", () => {
    inputMovement.movement += (1 - inputMovement.movement) / 2;
  });

  leftBtn.addEventListener("touchstart", () => {
    inputMovement.rotation = 1;
  });
  leftBtn.addEventListener("touchend", () => {
    inputMovement.rotation -= (1 + inputMovement.rotation) / 2;
  });

  rightBtn.addEventListener("touchstart", () => {
    inputMovement.rotation = -1;
  });
  rightBtn.addEventListener("touchend", () => {
    inputMovement.rotation += (1 - inputMovement.rotation) / 2;
  });
}

function addToNavbar(text, func) {
  const btn = document.createElement("button");
  btn.className = "col m-1";

  const btnText = document.createTextNode(text);
  btn.appendChild(btnText);

  btn.addEventListener("click", func);

  navbar.appendChild(btn);
  return btn;
}

//#endregion

//#region Creazione Label

let floorLabel = addToInformation("");

let bobinaLabel = addToInformation("");

//#endregion

//#region Generazione Elementi
let textureRep = 60;

const texture = new Three.TextureLoader().load("textures/Asfalto256x256.png");

// immediately use the texture for material creation
// let textureResolution = {width:texture.source.data.natural}
texture.wrapS = Three.RepeatWrapping;
texture.wrapT = Three.RepeatWrapping;
texture.repeat.set(textureRep, textureRep);

const plane = new Three.Mesh(
  new Three.PlaneGeometry(200, 200),
  new Three.MeshBasicMaterial({ map: texture })
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
forkLift.add(sideCamera);
const forkCollisionBoxPoints = [
  new Point(-1.6, 3.2),
  new Point(1.6, 3.2),
  new Point(1, 0.7),
  new Point(-1, 0.7),
];
let fork = forkLift.getObjectByName("Fork");
// fork = forkLift.children.find((x) => x.name = "Fork");

// let fork = forkLift.children[4];



// const forkLiftCollisionSphere = new Three.Mesh(new Three.SphereGeometry(0.2), new Three.MeshNormalMaterial());
// forkLiftCollisionSphere.material.transparent = true;
// forkLiftCollisionSphere.material.opacity = 0.5;
// forkLiftCollisionSphere.scale.divideScalar(worldScale);
// forkLift.add(forkLiftCollisionSphere);
// forkLiftCollisionSphere.position.z = -2.4 / worldScale;
// forkLiftCollisionSphere.position.y = -2 / worldScale;
const forkShape = new Three.Shape();
forkShape.moveTo(
  forkCollisionBoxPoints[0].x - forkCollisionBoxPoints[0].x,
  forkCollisionBoxPoints[0].y - forkCollisionBoxPoints[0].y
);
forkShape.lineTo(
  forkCollisionBoxPoints[1].x - forkCollisionBoxPoints[0].x,
  forkCollisionBoxPoints[1].y - forkCollisionBoxPoints[0].y
);
forkShape.lineTo(
  forkCollisionBoxPoints[2].x - forkCollisionBoxPoints[0].x,
  forkCollisionBoxPoints[2].y - forkCollisionBoxPoints[0].y
);
forkShape.lineTo(
  forkCollisionBoxPoints[3].x - forkCollisionBoxPoints[0].x,
  forkCollisionBoxPoints[3].y - forkCollisionBoxPoints[0].y
);
forkShape.lineTo(
  forkCollisionBoxPoints[0].x - forkCollisionBoxPoints[0].x,
  forkCollisionBoxPoints[0].y - forkCollisionBoxPoints[0].y
);

const forkCollisionBox = new Three.Mesh(
  new Three.ShapeGeometry(forkShape),
  new Three.MeshPhongMaterial({ side: Three.DoubleSide, color: "#5555ff" })
);
//AREA FORCHE
// forkLift.add(forkCollisionBox);

forkCollisionBox.scale.divideScalar(worldScale);
forkCollisionBox.rotation.x = -Math.PI / 2;
forkCollisionBox.position.y -= 2.15 / worldScale;

forkCollisionBox.position.x = forkCollisionBoxPoints[0].x / worldScale;
forkCollisionBox.position.z = -forkCollisionBoxPoints[0].y / worldScale;

// #endregion

//inizialmente disabilito il bottone del carica/scarica bobina

loadBtn.disabled = true;
unloadBtn.disabled = true;

generateFloors();
generateBobine();

document.body.appendChild(renderer.domElement);

let currentTarget = forkLift.position;

//#region Arrow

let arrow = await loadFbx(arrowPath);
arrow.name = "freccia";
arrow.visible = false;

arrow.scale.multiplyScalar(worldScale);
arrow.scale.multiplyScalar(7);
arrow.scale.z /= 1.3;

arrow.position.x = -4;
arrow.position.y = -1.3;
arrow.position.z = -5;

arrow.rotation.order = "YXZ";

let targetArrow = arrow.clone();

scene.add(arrow);
forkLift.attach(arrow);

targetArrow.name = "frecciaTarget";
targetArrow.visible = false;
targetArrow.rotation.x = -Math.PI / 2;
scene.add(targetArrow);

//#endregion

//ANIMATE;
function animate() {
  arrow.lookAt(currentTarget.clone().multiply(new Three.Vector3(-1, 1, 1)));
  arrow.rotation.x = 0;
  arrow.rotation.z = 0;

  targetArrow.position.y = Math.cos(Date.now() / 400) / 2.6 - 5;
  targetArrow.position.x = currentTarget.x;
  targetArrow.position.z = currentTarget.z;

  forkLift.rotation.y -= inputMovement.rotation * rotationSpeed;
  forkLift.translateZ(-inputMovement.movement * translationSpeed);
  if (forkCheckPosition())
    {
      fork.position.y += inputForkMovement * forkSpeed / worldScale * forkLiftScale;
    }

  floorCollision();
  if (!isForkliftLoaded) {
    if (!bobinaCollision()) {
      if (currentBobinaModel) {
        backToNormalColor();
      }
    }
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

  skyCamera.aspect = res.width / res.height;
  forkLiftCamera.aspect = res.width / res.height;
  sideCamera.aspect = res.width / res.height;

  forkLiftCamera.updateProjectionMatrix();
  skyCamera.updateProjectionMatrix(); //Se si modificano queste proprietà della currentCamera bisogna aggiornare la matrice d proiezione
  sideCamera.updateProjectionMatrix();
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
  let texture = new Three.TextureLoader().load("textures/Green3_280.png");
  texture.wrapS = Three.RepeatWrapping;
  texture.wrapT = Three.RepeatWrapping;
  texture.repeat.set(0.3, 0.3);

  floors.forEach((floor) => {
    let floorShape = new Three.Shape();
    floorShape.moveTo(floor.point1.x, floor.point1.y);
    floorShape.lineTo(floor.point2.x, floor.point2.y);
    floorShape.lineTo(floor.point3.x, floor.point3.y);
    floorShape.lineTo(floor.point4.x, floor.point4.y);
    floorShape.lineTo(floor.point1.x, floor.point1.y);
    const floorGeometry = new Three.ShapeGeometry(floorShape);
    let newFloor = new Three.Mesh(
      floorGeometry,
      new Three.MeshPhongMaterial({ side: Three.DoubleSide, map: texture })
    );
    newFloor.position.y = -0.05;
    // console.log(floorShape);
    scene.add(newFloor);
    generateFloorPolygon(floor);
    newFloor.name = floor.id;
    newFloor.tipo = "floor";
    // console.log(newFloor.position);
    newFloor.rotation.x = Math.PI / 2;
  });
}

async function generateBobine() {
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
    bobina.tipo = "bobina"; //aggiungo il tipo del modello perchè lo utilizzerò in carica/scarica

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

function generateFloorPolygon(floorJson) {
  const fakeCenter = new Point(floorJson.point1.x, floorJson.point1.y);
  const polygon = new dc.Polygon(fakeCenter, [
    new Point(
      floorJson.point1.x - fakeCenter.x,
      floorJson.point1.y - fakeCenter.y
    ),
    new Point(
      floorJson.point2.x - fakeCenter.x,
      floorJson.point2.y - fakeCenter.y
    ),
    new Point(
      floorJson.point3.x - fakeCenter.x,
      floorJson.point3.y - fakeCenter.y
    ),
    new Point(
      floorJson.point4.x - fakeCenter.x,
      floorJson.point4.y - fakeCenter.y
    ),
  ]);
  polygon.name = floorJson.id;

  // polygon.calcPoints.forEach((point) => {
  //   const helper = new Three.Mesh(
  //     new Three.BoxGeometry(0.5, 10, 0.5),
  //     new Three.MeshNormalMaterial()
  //   );
  //   helper.position.set(polygon.pos.x + point.x, 0, polygon.pos.y + point.y);
  //   scene.add(helper);
  // });

  // console.log(floorJson.point2.x - fakeCenter.x);
  // console.log(floorJson.point2.y - fakeCenter.y);

  floorPolygons.push(polygon);
}

function generateBobinaPolygon(center, bobina) {
  let polygon;

  if (bobina.isStanding) {
    let halfBase = bobina.base / 2;
    let halfHeigth = bobina.height / 2;
    polygon = new dc.Polygon(center, [
      new Point(halfBase, halfHeigth),
      new Point(-halfBase, halfHeigth),
      new Point(halfBase, -halfHeigth),
      new Point(-halfBase, -halfHeigth),
    ]);
  } else {
    polygon = new dc.Polygon(center, [
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
  }

  polygon.name = bobina.id;
  bobinaPolygons.push(polygon);

  //HELPER BOBINA
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

function removePolygon() {
  let indexToRemove;
  let forkArea = new dc.Polygon(
    new Point(forkLift.position.x, forkLift.position.z),
    [
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[0].x * forkLiftScale,
          -forkCollisionBoxPoints[0].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[1].x * forkLiftScale,
          -forkCollisionBoxPoints[1].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[2].x * forkLiftScale,
          -forkCollisionBoxPoints[2].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[3].x * forkLiftScale,
          -forkCollisionBoxPoints[3].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
    ]
  );
  bobinaPolygons.forEach((x) => {
    if (dc.polygonInPolygon(x, forkArea)) {
      indexToRemove = bobinaPolygons.indexOf(x);
    }
  });
  bobinaPolygons.splice(indexToRemove, 1);
}

function floorCollision() {
  let trovato = false;
  floorPolygons.forEach((area) => {
    if (
      pointInPolygon(new Point(forkLift.position.x, forkLift.position.z), area)
    ) {
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
    if (isInArea(bobina)) {
      currentBobina = bobine.find((x) => x.id == bobina.name);
      trovato = true;
      const collidedBobinaModel = scene.children.find(
        (figlio) => figlio.name == bobina.name && figlio.tipo == "bobina"
      );
      if (collidedBobinaModel != currentBobinaModel) {
        if (currentBobinaModel) {
          // currentBobinaModel.children.forEach((figlio) => {
          //   console.log(oldBobinaColors);
          //   figlio.material.color.copy(oldBobinaColors[0]);

          //   oldBobinaColors = oldBobinaColors.slice(0, -1);
          // });
          currentBobinaModel.children[0].material.color.copy(
            oldBobinaColors[0]
          );
          currentBobinaModel.children[1].material.color.copy(
            oldBobinaColors[1]
          );
          currentBobinaModel = null;
          oldBobinaColors = [];
        }

        currentBobinaModel = scene.children.find(
          (figlio) => figlio.name == bobina.name && figlio.tipo == "bobina"
        );
        if (!currentBobinaModel) {
          currentBobinaModel = forkLift.children.find(
            (figlio) => figlio.name == bobina.name && figlio.tipo == "bobina"
          );
        }

        currentBobinaModel.children.forEach((x) => {
          oldBobinaColors.push(x.material.color.clone());

          x.material.color.setHex(0xffff00);
        });
      }
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
  return trovato;
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

//deprecato
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

function showMissionsForm() {
  navbar.style.visibility = "hidden";

  const div = document.createElement("div");
  const missionDiv = document.createElement("div");
  const missionsList = document.createElement("select");
  const cancelBtn = document.createElement("button");
  const sendBtn = document.createElement("button");

  missionDiv.className = "col";
  missionsList.className = "form-select";
  cancelBtn.className = "col mx-1";
  sendBtn.className = "col mx-1";

  missions.forEach((x) => {
    var option = document.createElement("option");
    option.value = x.id;
    option.text = "Mission Id: " + x.id;
    missionsList.appendChild(option);
  });

  div.style.background = "rgb(233,233,233)";
  cancelBtn.innerHTML = "Cancella";
  sendBtn.innerHTML = "Invia";
  div.className =
    "position-absolute top-50 start-50 translate-middle p-3 rounded-1 row w-50";

  missionDiv.appendChild(missionsList);
  div.appendChild(missionDiv);
  div.appendChild(sendBtn);
  div.appendChild(cancelBtn);

  missionBtn.disabled = true;

  sendBtn.addEventListener("click", async () => {
    navbar.style.visibility = "visible";
    currentMission = missions.find(
      (x) => x.id == missionsList.options[missionsList.selectedIndex].value
    );
    currentTarget = scene.children.find(
      (x) => x.name == currentMission.bobine[0] && x.tipo == "bobina"
    ).position;
    arrow.visible = true;
    abortlMissionBtn.disabled = false;
    targetArrow.visible = true;
    document.body.removeChild(div);
  });
  cancelBtn.addEventListener("click", () => {
    navbar.style.visibility = "visible";
    missionBtn.disabled = false;
    document.body.removeChild(div);
  });

  document.body.appendChild(div);
}

function showPopup(messaggio) {
  navbar.style.visibility = "hidden";
  const message = document.createElement("p");
  const div = document.createElement("div");
  const padding = document.createElement("div");
  message.textContent = messaggio;
  div.appendChild(message);
  const sendBtn = document.createElement("button");
  div.style.background = "rgb(233,233,233)";

  sendBtn.innerHTML = "OK";

  const row = document.createElement("div");
  row.className = "row";

  padding.className = "col-4";

  row.appendChild(padding);
  div.appendChild(row);

  sendBtn.className = "col-4";
  div.className =
    "position-absolute top-50 start-50 translate-middle p-3 rounded-1";

  row.appendChild(sendBtn);

  row.appendChild(sendBtn);

  sendBtn.addEventListener("click", async () => {
    navbar.style.visibility = "visible";
    document.body.removeChild(div);
  });
  document.body.appendChild(div);
}

function showForm() {
  navbar.style.visibility = "hidden";
  const message = document.createElement("p");
  const div = document.createElement("div");
  const textArea = document.createElement("input");
  const cancelBtn = document.createElement("button");
  const sendBtn = document.createElement("button");

  textArea.className = "mx-1";
  cancelBtn.className = "mx-1 px-2";
  sendBtn.className = "mx-1 px-2";

  div.style.background = "rgb(233,233,233)";
  cancelBtn.innerHTML = "Cancella";
  sendBtn.innerHTML = "Invia";
  div.className =
    "position-absolute top-50 start-50 translate-middle p-3 rounded-1";
  textArea.type = "text";
  div.appendChild(textArea);
  div.appendChild(sendBtn);
  div.appendChild(cancelBtn);

  generateBtn.disabled = true;

  sendBtn.addEventListener("click", async () => {
    navbar.style.visibility = "visible";
    let text = await spawnBobina(textArea.value);

    if (text) {
      message.textContent = text;
      div.appendChild(message);
    } else {
      unloadBtn.disabled = false;
      document.body.removeChild(div);
    }
  });
  cancelBtn.addEventListener("click", () => {
    navbar.style.visibility = "visible";
    generateBtn.disabled = false;
    document.body.removeChild(div);
  });

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

function addToInformation(text) {
  const information = document.createElement("p");
  information.textContent = text;

  information.className = "text-light mx-1 my-0";

  informationRows.appendChild(information);

  return information;
}

function isInArea(area) {
  let fakeCenter = new Three.Vector3();
  forkCollisionBox.getWorldPosition(fakeCenter);

  fakeCenter = new Point(fakeCenter.x, fakeCenter.z);

  let forkArea = new dc.Polygon(
    new Point(forkLift.position.x, forkLift.position.z),
    [
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[0].x * forkLiftScale,
          -forkCollisionBoxPoints[0].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[1].x * forkLiftScale,
          -forkCollisionBoxPoints[1].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[2].x * forkLiftScale,
          -forkCollisionBoxPoints[2].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
      rotateOnAxis(
        new Point(0, 0),
        new Point(
          forkCollisionBoxPoints[3].x * forkLiftScale,
          -forkCollisionBoxPoints[3].y * forkLiftScale
        ),
        Three.MathUtils.radToDeg(forkLift.rotation.y)
      ),
    ]
  );

  // forkArea.calcPoints.forEach((point) => {
  //   const helper = new Three.Mesh(
  //     new Three.BoxGeometry(0.5, 10, 0.5),
  //     new Three.MeshNormalMaterial()
  //   );
  //   helper.position.set(forkArea.pos.x + point.x, 0, forkArea.pos.y + point.y);
  //   scene.add(helper);
  // });

  // console.log(area);
  return dc.polygonInPolygon(area, forkArea);
}

function changeCamera() {
  if (currentCamera == sideCamera) {
    currentCamera = forkLiftCamera;
  } else if (currentCamera == forkLiftCamera){
    currentCamera = skyCamera;
  }
  else
  {
    currentCamera = sideCamera;
  }
}

//#region interazione bobine

function unloadForklift() {
  let bobina = fork.children[fork.children.length - 1];

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
  if (
    currentMission &&
    currentArea.id == currentMission.destinationArea &&
    bobina.name == currentMission.bobine[0]
  ) {
    currentMission.bobine.shift();
    if (currentMission.bobine.length == 0) {
      missions.splice(missions.indexOf(currentMission), 1);
      currentMission = undefined;
      currentTarget = forkLift.position;
      arrow.visible = false;
      targetArrow.visible = false;
      missionBtn.disabled = false;
      abortlMissionBtn.disabled = true;
      showPopup("MISSIONE COMPLETATA");
    }
  }

  if (currentMission) {
    currentTarget = scene.children.find(
      (x) => x.name == currentMission.bobine[0] && x.tipo == "bobina"
    ).position;
  }
}

function loadForklift() {
  let newBobina = scene.children.find(
    (x) => x.name == currentBobina.id && x.type == "Group" && x.tipo == "bobina"
  );
  fork.attach(newBobina);
  newBobina.rotation.y =
    newBobina.rotation.y % (Math.PI / 2) > Math.PI / 4
      ? Math.PI / 2
      : -Math.PI / 2;
  newBobina.position.x = 0;
  removePolygon();
  backToNormalColor();
  isForkliftLoaded = true;

  if (currentMission) {
    if (currentMission.bobine.find((x) => x == newBobina.name)) {
      currentTarget = scene.children.find(
        (x) => x.name == currentMission.destinationArea && x.tipo == "floor"
      ).geometry.boundingSphere.center;
      currentTarget = new Three.Vector3(currentTarget.x, 0, currentTarget.y);
      // console.log(currentTarget);
      // currentTarget = scene.children.find(x => x.name == currentMission.destinationArea && x.tipo == "floor").position;
    }
  }
}

async function spawnBobina(id) {
  console.log(id);
  if (!id) {
    return "Id bobina non inserito";
  }
  let bobina = (await loadJson(bobineEsterneApiPath, "id", id))[0];
  console.log(bobina);

  if (!bobina) {
    return "La bobina non esiste nel database";
  }
  let newBobina = await loadFbx(bobinaPath);

  newBobina.name = bobina.id;
  newBobina.tipo = "bobina";
  newBobina.scale.set(
    bobina.base / forkLiftScale,
    bobina.depth / forkLiftScale,
    bobina.height / forkLiftScale
  );
  newBobina.rotation.z = Math.PI / 2;
  newBobina.rotation.y = -Math.PI / 2;

  currentBobinaOffsetX = 0;
  currentBobinaOffsetY = -2;
  newBobina.position.x = currentBobinaOffsetX / (forkLiftScale * worldScale);
  newBobina.position.y =
    -(-forkLift.position.y - bobina.base / forkLiftScale / 2 / 0.625) /
    (worldScale * forkLiftScale);
  newBobina.position.z = currentBobinaOffsetY / (worldScale * forkLiftScale);

  forkLift.add(newBobina);
  isForkliftLoaded = true;

  currentBobina = bobina;

  changeBobinaLabel();

  return;
}

function backToNormalColor() {
  currentBobinaModel.children[0].material.color.copy(oldBobinaColors[0]);
  currentBobinaModel.children[1].material.color.copy(oldBobinaColors[1]);
  currentBobinaModel = null;
  oldBobinaColors = [];
  
}

function forkCheckPosition(){
  if ((fork.position.y <= -1099.46337890625 && inputForkMovement <0) || (fork.position.y > 720.5 && inputForkMovement > 0)){
    return false;
  }
  return true;
  
}

//#endregion

//#region EventListener
window.addEventListener("resize", onResize);

window.addEventListener("keydown", (event) => {
  console.log(event.code);
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
      break;
    }
    case "ArrowUp":{
      inputForkMovement = +1
      
      break;
    }
    case "ArrowDown":{
      inputForkMovement = -1
      break;
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
    case "ArrowUp":{
      inputForkMovement -= (1 + inputForkMovement)/2;
      break;
    }
    case "ArrowDown":{
      inputForkMovement += (1 - inputForkMovement)/2;
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
    console.log(res);
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
