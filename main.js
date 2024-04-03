import * as THREE from 'three';
import TWEEN from './lib/tween.js';
import { TrackballControls } from './lib/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from './lib/renderers/CSS3DRenderer.js';

const sheetURL = 'https://docs.google.com/spreadsheets/d/1haGHGP97Ryk123gVQZRWVlw8ufe4CnCbGVjCJkz4vdE/gviz/tq?tqx=out:csv';
const table = [];
await fetch(sheetURL)
.then((response) => response.text())
.then((csvText) => {
    let csvRows = csvText.split('\n')
    let propertyNames = csvRows[0].slice(1,-1).split(/","/);
    for (let i = 1, max = csvRows.length; i < max; i++) {
        let thisObject = {};
        let row = csvRows[i].slice(1,-1).split(/","/);
        for (let j = 0, max = row.length; j < max; j++) {
            let thisProperty = propertyNames[j];
            if(thisProperty == 'Age'){
                thisObject[thisProperty] = parseInt(row[j]);
            }
            else if(thisProperty == 'Net Worth'){
                thisObject[thisProperty] = parseFloat(row[j].replace(/[^\d.]/g, ''));
            }
            else{
                thisObject[propertyNames[j]] = row[j];
            }
        }
        table.push(thisObject)
    }
});

let camera, scene, renderer, controls, composer;
var hblur, vblur;
let targets = {simple: [], table: [], sphere: [], helix: [], grid: []};

const redHex = '#EF3022', yellowHex = '#FDCA35', greenHex = '#3A9F48';

init();
animate();

function init() {

    initCamera();

    initScene();

    initObjects();

    addClickListeners();

    initRenderer();

    initTrackbarControls();

    transform(targets.table, 2000);

    window.addEventListener('resize', onWindowResize, false);

}

function initCamera() {

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

}

function initScene() {

    scene = new THREE.Scene();

}

function initRenderer() {

    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
}

function initObjects() {

    simpleObjectsLayout();
    generateGeometricLayouts();

}

function addClickListeners() {

    addClickListener(targets.table, 'table');
    addClickListener(targets.sphere, 'sphere');
    addClickListener(targets.helix, 'helix');
    addClickListener(targets.grid, 'grid');

}

function simpleObjectsLayout() {

    for (let i = 0; i < table.length; i++) {

        let object = new CSS3DObject(htmlElement(table[i], i));
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;

        scene.add(object);
        targets.simple.push(object);
        tableLayout(i);

    }

}

function htmlElement(employee, i) {
    let element = document.createElement('div');
    element.className = 'element';
    let netWorth = employee['Net Worth'];
    let netWorthColor = redHex;
    if(netWorth > 200000){
        netWorthColor = greenHex;
    }
    else if(netWorth > 100000){
        netWorthColor = yellowHex;
    }
    element.style.backgroundColor = netWorthColor+'60';
    element.style.border =  '2px solid '+netWorthColor+'99';
    element.style.boxShadow = '0px 0px 5px '+netWorthColor+'99';

    let country = document.createElement('div');
    country.className = 'country';
    country.textContent = employee['Country'];
    element.appendChild(country);

    let age = document.createElement('div');
    age.className = 'age';
    age.textContent = employee['Age'];
    element.appendChild(age);

    let photo = document.createElement('img');
    photo.className = 'photo';
    photo.src = employee['Photo']
    element.appendChild(photo);

    let details = document.createElement('div');
    details.className = 'details';
    details.innerHTML = employee['Name'] + '<br>' + employee['Interest'];
    element.appendChild(details);

    element.addEventListener('click', ()=>elementClickHandler(i), false);

    return element;
}

function elementClickHandler(i){

    transform(targets.table,500);

    new TWEEN.Tween(targets.simple[i].position)
        .to({
            x: 0,
            y: 0,
            z: 2500
        }, Math.random() * 2000 + 2000)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

    new TWEEN.Tween(this)
        .to({}, 2000 * 2)
        .onUpdate(render)
        .start();
}

function tableLayout(index) {

    let object = new THREE.Object3D();

    object.position.x = (index%20 * 140) - 1330;
    object.position.y = -(Math.floor(index/20) * 180) + 990;
    targets.table.push(object);

}

function addClickListener(target, elementId) {

    const button = document.getElementById(elementId);

    button.addEventListener('click', function () {
        transform(target, 1000);
    }, false);

}

function initTrackbarControls() {
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.5;
    controls.minDistance = 500;
    controls.maxDistance = 6000;
    controls.addEventListener('change', render);
}

function generateGeometricLayouts() {

    let sphereVector = new THREE.Vector3();
    let helixVector = new THREE.Vector3();

    for (let i = 0, l = targets.simple.length; i < l; i++) {
        addSphereObject(sphereVector, i, l);
        addHelixObject(helixVector, i);
        addGridObject(i);
    }

}

function addSphereObject(sphereVector, index, length) {

    const phi = Math.acos(-1 + (2 * index) / length);
    const theta = Math.sqrt(length * Math.PI) * phi;
    let object = new THREE.Object3D();

    object.position.setFromSphericalCoords(800, phi, theta);

    sphereVector.copy(object.position).multiplyScalar(2);

    object.lookAt(sphereVector);

    targets.sphere.push(object);
}

function addHelixObject(helixVector, index) {

    const indexThreshold = Math.floor(table.length/2);
    if(index < indexThreshold){
        var theta = index * 0.2 + Math.PI;
        var y = -(index * 12) + 500;
    }
    else{
        var theta = -index * 0.175 + Math.PI;
        var y = -((index-indexThreshold) * 12) + 500;
    }
    
    let object = new THREE.Object3D();

    object.position.setFromCylindricalCoords(900, theta, y);

    helixVector.x = object.position.x * 2;
    helixVector.y = object.position.y;
    helixVector.z = object.position.z * 2;

    object.lookAt(helixVector);

    targets.helix.push(object);
}

function addGridObject(index) {

    let object = new THREE.Object3D();
    object.position.x = ((index % 5) * 400) - 800;
    object.position.y = (-(Math.floor(index / 5) % 4) * 400) + 800;
    object.position.z = (Math.floor(index / 20)) * 1000 - 2000;
    targets.grid.push(object);

}

function transform(target, duration) {

    TWEEN.removeAll();

    for (let i = 0; i < targets.simple.length; i++) {
        let object = targets.simple[i];
        let targetObject = target[i];
        transformObjectPosition(object, targetObject, duration);
        transformObjectRotation(object, targetObject, duration);
    }

    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(render)
        .start();

}

function transformObjectPosition(object, targetObject, duration) {

    new TWEEN.Tween(object.position)
        .to({
            x: targetObject.position.x,
            y: targetObject.position.y,
            z: targetObject.position.z
        }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

}

function transformObjectRotation(object, targetObject, duration) {

    new TWEEN.Tween(object.rotation)
        .to({
            x: targetObject.rotation.x,
            y: targetObject.rotation.y,
            z: targetObject.rotation.z
        }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();

}

function render() {

    renderer.render(scene, camera);

}

function animate() {

    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
}
