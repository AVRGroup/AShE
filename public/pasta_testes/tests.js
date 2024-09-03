import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// Criar cena
var scene = new THREE.Scene();
scene.background = new THREE.Color('grey'); // Background azul escuro

// Criar câmera
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
//camera.position.set(-6, 4, 8); // Ajustar a posição da câmera
camera.position.set(-6, 4.5, 8); // Ajustar a posição da câmera
camera.lookAt(0, 0, 0);

// Criar renderer com sombras
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Adicionar plano de fundo à cena
var backgroundPlaneGeometry = new THREE.PlaneGeometry(500, 500);
var backgroundTextureLoader = new THREE.TextureLoader();
var backgroundTexture = backgroundTextureLoader.load('background_1.jpg');
backgroundTexture.wrapS = THREE.RepeatWrapping;
backgroundTexture.wrapT = THREE.RepeatWrapping;
backgroundTexture.repeat.set(200, 200); // Ajustar a quantidade de repetição
var backgroundPlaneMaterial = new THREE.MeshStandardMaterial({ map: backgroundTexture, side: THREE.DoubleSide });
var backgroundPlane = new THREE.Mesh(backgroundPlaneGeometry, backgroundPlaneMaterial);
backgroundPlane.rotation.x = Math.PI / 2;
backgroundPlane.receiveShadow = true; // Permitir que o plano de fundo receba sombras
scene.add(backgroundPlane);

// Adicionar plano menor com a imagem do marcador
var markerPlaneGeometry = new THREE.PlaneGeometry(1.5, 1.5); // Tamanho do plano do marcador
var markerTextureLoader = new THREE.TextureLoader();
var markerTexture = markerTextureLoader.load('kanji.png');
var markerPlaneMaterial = new THREE.MeshBasicMaterial({map: markerTexture, side: THREE.TwoPassDoubleSide, emissive: 0xffffff, emissiveIntensity: -0.25 });
var markerPlane = new THREE.Mesh(markerPlaneGeometry, markerPlaneMaterial);
markerPlane.position.y = 0.001; // Posicionar acima do plano de fundo
markerPlane.rotation.x = Math.PI / 2;
markerPlane.rotation.y = Math.PI / 1;
markerPlane.rotation.z = Math.PI / 1;
markerPlane.receiveShadow = false; // Permitir que o plano de fundo receba sombras
scene.add(markerPlane);

// CILINDROS //////////////////////////////////////////////////////////////////////////////////////////////////////////

// Adicionar cilindro esquerdo
// var leftCylinderGeometry = new THREE.CylinderGeometry(0.75, 0.75, 1.5, 32);
// var leftCylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x80FF00 }); // Cinza escuro
// var leftCylinder = new THREE.Mesh(leftCylinderGeometry, leftCylinderMaterial);
// leftCylinder.position.set(-3, 0.75, 0); // Posicionar à esquerda do marcador
// leftCylinder.castShadow = true; // Permitir que o cilindro projete sombras
// scene.add(leftCylinder);

// // Adicionar cilindro direito
// var rightCylinderGeometry = new THREE.CylinderGeometry(1, 1, 1.5, 32);
// var rightCylinderMaterial = new THREE.MeshStandardMaterial({ color: 0xD8BFD8 }); // Cinza escuro
// var rightCylinder = new THREE.Mesh(rightCylinderGeometry, rightCylinderMaterial);
// rightCylinder.position.set(3, 0.75, 1); // Posicionar à direita do marcador
// rightCylinder.castShadow = true; // Permitir que o cilindro projete sombras
// scene.add(rightCylinder);

// ESFERAS //////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // Adicionar esfera à esquerda do marcador
// var leftSphereGeometry = new THREE.SphereGeometry(1, 32, 32);
// var leftSphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Cinza escuro
// var leftSphere = new THREE.Mesh(leftSphereGeometry, leftSphereMaterial);
// leftSphere.position.set(-3, 1, 0); // Posicionar à esquerda do marcador
// leftSphere.castShadow = true; // Permitir que a esfera projete sombras
// scene.add(leftSphere);

// // Adicionar esfera à direita do marcador
// var rightSphereGeometry = new THREE.SphereGeometry(1, 32, 32);
// var rightSphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Cinza escuro
// var rightSphere = new THREE.Mesh(rightSphereGeometry, rightSphereMaterial);
// rightSphere.position.set(1, 1, 3); // Posicionar à direita do marcador
// rightSphere.castShadow = true; // Permitir que a esfera projete sombras
// scene.add(rightSphere);

// CONES /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // Adicionar cone à esquerda do marcador
// var leftConeGeometry = new THREE.ConeGeometry(0.5, 3, 32);
// var leftConeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); // Cinza escuro
// var leftCone = new THREE.Mesh(leftConeGeometry, leftConeMaterial);
// leftCone.position.set(-3, 1, 0); // Posicionar à esquerda do marcador
// leftCone.castShadow = true; // Permitir que o cone projete sombras
// scene.add(leftCone);

// Adicionar cone à direita do marcador
var rightConeGeometry = new THREE.ConeGeometry(0.5, 3, 32);
var rightConeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); // Cinza escuro
var rightCone = new THREE.Mesh(rightConeGeometry, rightConeMaterial);
rightCone.position.set(3, 1, 1); // Posicionar à direita do marcador
rightCone.castShadow = true; // Permitir que o cone projete sombras
scene.add(rightCone);

// cubos ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // Adicionar cubo à esquerda do marcador
// var leftCubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
// var leftCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xD8BFD8 }); // Cinza escuro
// var leftCube = new THREE.Mesh(leftCubeGeometry, leftCubeMaterial);
// leftCube.position.set(-2, 0.75, -3); // Posicionar à esquerda do marcador
// leftCube.castShadow = true; // Permitir que o cubo projete sombras
// scene.add(leftCube);

// var middleCubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
// var middleCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xD8BFD8 }); // Cinza escuro
// var middleCube = new THREE.Mesh(middleCubeGeometry, middleCubeMaterial);
// middleCube.position.set(-2.5, 0.75, -1); // Posicionar à esquerda do marcador
// middleCube.castShadow = true; // Permitir que o cubo projete sombras
// scene.add(middleCube);

// // Adicionar cubo à direita do marcador
// var rightCubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
// var rightCubeMaterial = new THREE.MeshStandardMaterial({ color: 0x80FF00 }); // Cinza escuro
// var rightCube = new THREE.Mesh(rightCubeGeometry, rightCubeMaterial);
// //rightCube.position.set(2, 0.75, 3); // Posicionar à direita do marcador
// rightCube.position.set(3, 0.75, 0); // Posicionar à direita do marcador
// rightCube.castShadow = true; // Permitir que o cubo projete sombras
// scene.add(rightCube);

// CUBO
var vObjHeight     =   1.5;
var vObjRatio      =   1.0;
var loader = new THREE.TextureLoader();
var wood = new THREE.MeshLambertMaterial({map: loader.load("wood.png")});
var cube   = new THREE.BoxGeometry(vObjHeight, vObjHeight * vObjRatio, vObjHeight);
var vObj        = new THREE.Mesh(cube,   wood);
vObj.castShadow = true;
//scene.add(vObj)

vObj.position.set(0, vObjRatio * vObjHeight / 2, 0);

// Adicionar iluminação ambiente
var ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

// Adicionar iluminação direcional com sombras
var directionalLight = new THREE.DirectionalLight(0xffffff, 1.15);
directionalLight.position.set(1, 9, -5);

directionalLight.castShadow = true; // Permitir que a luz direcional projete sombras
scene.add(directionalLight);

// Configurar sombras
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;

// Função de animação
function animate() {
    requestAnimationFrame(animate);

    // Renderizar a cena
    renderer.render(scene, camera);
}

// Iniciar a animação
animate();

// Função para tirar uma captura de tela
// Função para tirar uma captura de tela
function GetImage() {
    // Renderizar a cena
    renderer.render(scene, camera);

    // Obter a representação em base64 da imagem diretamente do WebGL
    var screenshotDataUrl = renderer.domElement.toDataURL("image/jpeg");

    // Criar um link para download da imagem
    var link = document.createElement('a');
    link.href = screenshotDataUrl;
    link.download = 'imagem_1.jpg';

    // Disparar o clique no link para iniciar o download
    link.click();
}

// Adicionar um evento de escuta de tecla
window.addEventListener('keydown', function (event) {
    // Verificar se a tecla pressionada é 'p' (código 80)
    if (event.keyCode === 80) {
        GetImage();
    }
});

// Atualizar tamanho da janela
window.addEventListener('resize', function () {
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
});