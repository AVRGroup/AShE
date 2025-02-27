import { pythonCode } from "./pythonCode.js";
import { pythonCode2 } from "./pythonCode2.js";

var renderer, rend;
var emptyObj, vObj, vObjMask, light, origLight, shadowPlane, wPlane, dPlane;
var sphere;
var adjustX, adjustZ;
let position = new THREE.Vector3(); // Para armazenar posição da câmera virtual
let quaternion = new THREE.Quaternion(); // Para armazenar a rotação da câmera virtual
var mouse = new THREE.Vector2();
var emptyPlane;
var ray = new THREE.Raycaster();
var point = new THREE.Vector2();
var loader = new THREE.TextureLoader();
var clock = new THREE.Clock();

var planeSize = 150.00;
var sPlaneSize = 150.00;
var sPlaneSegments = 300.00;
var vObjHeight = 1.25;
var vObjRatio = 1.00;
var adjustX = 0.00;
var adjustZ = 0.00;
var done = false;

const loaderContainer = document.createElement("div");
loaderContainer.setAttribute("class", "loader-container");
const loaderElement = document.createElement("div");
loaderElement.setAttribute("class", "loader");
loaderElement.setAttribute("id", "loader");
loaderContainer.appendChild(loaderElement);
document.body.appendChild(loaderContainer);
//const select = document.getElementById("select");
const submitBtn = document.getElementById("submitButton");
const returnBtn = document.getElementById("returnButton");
returnBtn.style.display = "none";
const select2 = document.getElementById("select2");
const select3 = document.getElementById("select3");
select3.style.display = "none";
loaderElement.style.display = "none";
var selectValue = "0";

renderer = new THREE.WebGLRenderer({
	preserveDrawingBuffer: true,
	antialias: true,
	alpha: true
});
renderer.setClearColor(0x000000, 0); // Fundo transparente
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.setSize(window.innerWidth, window.innerHeight); // Change here to render in low resolution (for example 640 x 480)
renderer.domElement.addEventListener('click', onDocumentMouseClick, false);
document.body.appendChild(renderer.domElement);

let AR = {
	source: null,
	context: null,
}
let camera, scene;

function onResize() {
    const aspectRatioBox = document.getElementById("aspect-ratio-box");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let cropWidth, cropHeight;

    if (windowWidth / windowHeight > 4 / 3) {
        cropHeight = windowHeight;
        cropWidth = (windowHeight * 4) / 3;
    } else {
        cropWidth = windowWidth;
        cropHeight = (windowWidth * 3) / 4;
    }

    aspectRatioBox.style.width = `${cropWidth}px`;
    aspectRatioBox.style.height = `${cropHeight}px`;
    aspectRatioBox.style.left = `50%`;
    aspectRatioBox.style.top = `50%`;
    aspectRatioBox.style.transform = `translate(-50%, -50%)`;

    renderer.setSize(cropWidth, cropHeight);
    renderer.domElement.style.width = `${cropWidth}px`;
    renderer.domElement.style.height = `${cropHeight}px`;
    renderer.domElement.style.left = `50%`;
    renderer.domElement.style.top = `50%`;
    renderer.domElement.style.transform = `translate(-50%, -50%)`;

    if (AR.source) {
        AR.source.domElement.style.width = `${cropWidth}px`;
        AR.source.domElement.style.height = `${cropHeight}px`;
        AR.source.domElement.style.left = `50%`;
        AR.source.domElement.style.top = `50%`;
        AR.source.domElement.style.transform = `translate(-50%, -50%)`;
    }

}
window.addEventListener('resize', onResize);

// function createVirtualObj(){
// 	var cube   = new THREE.BoxBufferGeometry(vObjHeight, vObjHeight * vObjRatio, vObjHeight);
// 	var wood = new THREE.MeshLambertMaterial({map: loader.load("my-textures/face/wood.png")});
//     var transparentMaterial = new THREE.MeshBasicMaterial({
//         map: loader.load("my-textures/face/wood.png"),
//         transparent: true,
//         opacity: 1,
//     });
// 	return vObj = new THREE.Mesh(cube, transparentMaterial);
// }

function createVirtualObj() {
    // Criar a geometria do cubo
    var cube = new THREE.BoxBufferGeometry(vObjHeight, vObjHeight * vObjRatio, vObjHeight);

    // Carregar textura de madeira
    var texture = loader.load("my-textures/face/wood.png");
    texture.anisotropy = 16; 

    // Criar material que aceita sombras
    var woodMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        roughness: 0.7,  // Ajuste de reflexividade
        metalness: 0.0,  // Material levemente metálico
    });

    var vObj = new THREE.Mesh(cube, woodMaterial);
    vObj.castShadow = true; // Permite que o cubo projete sombras
    vObj.receiveShadow = true; // Permite que o cubo receba sombras

    return vObj;
}

function create_scene() {
    let scene = new THREE.Scene();
    origLight = new THREE.DirectionalLight(0xffffff);
    origLight.castShadow = true;
    var d = vObjRatio * vObjHeight * 10;
    origLight.shadow.camera.left = -d;
    origLight.shadow.camera.right = d;
    origLight.shadow.camera.top = d;
    origLight.shadow.camera.bottom = -d;
    origLight.shadow.mapSize.width = 1024; //2048
    origLight.shadow.mapSize.height = 1024; //2048

    // Adicionar iluminação ambiente
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.40);
    scene.add(ambientLight);

    light = origLight.clone();
    scene.add(light);
    //camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 1000); // Atualizado para 4:3
    camera = new THREE.PerspectiveCamera(30, 4/3, 0.1, 1000); // Atualizado para 4:3
    scene.add(camera);
    vObj = createVirtualObj();
    scene.add(vObj);
    vObj.position.set(adjustX, (vObjRatio * vObjHeight / 2)+0.001, adjustZ);
    vObj.castShadow = false;

    return [scene, camera];
}


var aux = create_scene();
scene 	= aux[0];
camera = aux[1];
var helper = new THREE.CameraHelper(camera);
//scene.add(helper);

export function updateAR() {
    if (AR.source) {
        if (AR.source.ready === false) return;
        AR.context.update(AR.source.domElement);
        scene.visible = camera.visible;
        return camera;
    }
    return null;
}

function setSource(type, url)
{
   AR.source = new THREEx.ArToolkitSource({	
      sourceType : type,
      sourceUrl : url,
   })
}

function forceFullReset() {
    // Verificar se AR.context existe e fazer dispose
    if (AR.context && AR.context.arController) {
        AR.context.arController.dispose();
        AR.context = null; 
    }

    // Verificar se AR.markerControls existe e fazer dispose
    if (AR.markerControls) {
        AR.markerControls = null; 
    }

    if (AR.source) {
        if (AR.source.domElement && AR.source.domElement.parentNode) {
            AR.source.domElement.parentNode.removeChild(AR.source.domElement);
        }
        AR.source = null; 
    }

    const temporarySource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });

    temporarySource.init(function onReady() {
        // Depois que a câmera foi inicializada, liberamos o recurso temporário
        if (temporarySource.domElement && temporarySource.domElement.parentNode) {
            temporarySource.domElement.parentNode.removeChild(temporarySource.domElement);
        }
    });
}

function setNewSource(type, url) {
    forceFullReset(); 

    AR.source = new THREEx.ArToolkitSource({
        sourceType: type,
        sourceUrl: url,
    });

    AR.source.init(function onReady() {
        document.body.appendChild(AR.source.domElement);
        onResize();

        if (AR.source.parameters.sourceType === "video") {
            AR.source.domElement.pause(); 
        }

        AR.context = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'data/camera_para.dat',
            detectionMode: 'mono',
        });

        AR.context.init(function onCompleted() {
            camera.projectionMatrix.copy(AR.context.getProjectionMatrix());
        });

        AR.markerControls = new THREEx.ArMarkerControls(AR.context, camera, {
            type: "pattern",
            patternUrl: "data/kanji.patt",
            changeMatrixMode: 'cameraTransformMatrix'
        });

        scene.visible = true;
    });
}

export function setARStuff(source)
{
   switch (source)
   {
      case 'image':
         setSource('image', "my-images/img_test11.jpg");
         break;
      case 'video':
         setSource('video', "my-videos/vid_1.MOV");
         break;
      case 'webcam':
         setSource('webcam', null);
         break;
   }   
   
   AR.source.init(function onReady() {
        document.body.appendChild(AR.source.domElement);
        onResize();

        if (AR.source.parameters.sourceType === "video") {
            AR.source.domElement.pause();
        }

        // Reinicializar o contexto do ARToolkit
        if (AR.context) {
            AR.context.dispose(); 
        }

        AR.context = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'data/camera_para.dat',
            detectionMode: 'mono',
        });

        AR.context.init(function onCompleted() {
            camera.projectionMatrix.copy(AR.context.getProjectionMatrix());
        });

        new THREEx.ArMarkerControls(AR.context, camera, {	
            type: "pattern", 
            patternUrl: "data/kanji.patt",
            changeMatrixMode: 'cameraTransformMatrix'
        });

        scene.visible = true;
    });
}

setARStuff('image'); 

var shadowMat = new THREE.ShadowMaterial({
	opacity: 0.75,
	side: THREE.DoubleSide,
});
var splane = new THREE.PlaneGeometry(sPlaneSize, sPlaneSize, sPlaneSegments, sPlaneSegments);
shadowPlane = new THREE.Mesh(splane, shadowMat);
shadowPlane.receiveShadow = true;
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.01;
scene.add(shadowPlane);

document.getElementById("select2").addEventListener("change", async () => {
    const select = document.getElementById("select2");
    let value = select.value;
    if (selectValue != value) {
        selectValue = value;
        switch (value) {
            case '0':
                setNewSource('webcam', null);
                break;
            case '1':
                //setNewSource('image', "my-images/new_imagem_1.jpg"); 
                setNewSource('image', "my-images/img_test11.jpg"); 
                //setNewSource('image', "my-images/real_5_1.jpeg"); 
                break;
            case '2':
                setNewSource('image', "my-images/new_imagem_3.jpg");
                break;
            case '3':
                setNewSource('image', "my-images/new_imagem_4.jpg");
                break;
            case '4':
                setNewSource('image', "my-images/imagem_4.jpg"); 
                break;
            case '5':
                setNewSource('image', "my-images/imagem_7.jpg");
                break;
            case '6':
                setNewSource('image', "my-images/new_imagem_8.jpg");
                break;
            case '7':
                setNewSource('image', "my-images/new_imagem_9.jpg"); 
                break;
            case '8':
                setNewSource('image', "my-images/imagem_1.jpg"); 
                break;
            case '9':
                setNewSource('image', 'my-images/img_extobj_1.jpeg');
                break;
            case '10':
                setNewSource('image', 'my-images/img_extobj_3.jpeg');
                break;
            case '11':
                setNewSource('image', 'my-images/img_extobj_4.jpeg'); 
                break;
            case '12':
                setNewSource('image', 'my-images/img_extobj_5.jpeg');
                break;
            case '13':
                setNewSource('image', 'my-images/img_extobj_6.jpeg');
                break;
            case '14':
                setNewSource('image', 'my-images/real_img_20.jpeg'); 
                break;
            case '15':
                setNewSource('image', 'my-images/real_img_11.jpeg');
                break;
            case '16':
                setNewSource('image', "my-images/real_img_25.jpeg");
                break;  
            case '17':
                setNewSource('video', "my-videos/vid_15.mp4"); 
                break;           
        }
    }
});

returnBtn.addEventListener('click', async () => {
    let value = select2.value;
    switch (value) {
        case '0':
            setNewSource('webcam', null);
            break;
        case '1':
            setNewSource('image', "my-images/img_test11.jpg"); 
            break;
        case '2':
            setNewSource('image', "my-images/new_imagem_3.jpg");
            break;
        case '3':
            setNewSource('image', "my-images/new_imagem_4.jpg");
            break;
        case '4':
            setNewSource('image', "my-images/imagem_4.jpg"); 
            break;
        case '5':
            setNewSource('image', "my-images/imagem_7.jpg");
            break;
        case '6':
            setNewSource('image', "my-images/new_imagem_8.jpg");
            break;
        case '7':
            setNewSource('image', "my-images/new_imagem_9.jpg"); 
            break;
        case '8':
            setNewSource('image', "my-images/imagem_1.jpg"); 
            break;
        case '9':
            setNewSource('image', 'my-images/img_extobj_1.jpeg');
            break;
        case '10':
            setNewSource('image', 'my-images/img_extobj_3.jpeg');
            break;
        case '11':
            setNewSource('image', 'my-images/img_extobj_4.jpeg'); 
            break;
        case '12':
            setNewSource('image', 'my-images/img_extobj_5.jpeg');
            break;
        case '13':
            setNewSource('image', 'my-images/img_extobj_6.jpeg');
            break;
        case '14':
            setNewSource('image', 'my-images/real_img_20.jpeg'); 
            break;
        case '15':
            setNewSource('image', 'my-images/real_img_11.jpeg');
            break;
        case '16':
            setNewSource('image', "my-images/real_img_25.jpeg");
            break;  
        case '17':
            setNewSource('video', "my-videos/vid_15.mp4"); 
            break;   
    }

    if(currentFile != 'cube'){
        scene.remove(currentObject);
        scene.add(vObj);
    }
    //select.style.display = "block";
    select2.style.display = "block";
    submitBtn.style.display = "block";
    select3.style.display = "none";
    select3.value = "0";
    currentObject = vObj;
    returnBtn.style.display = "none";
    light.position.set(0, 10, 0);
    vObj.castShadow = false;
});

// Função para atualizar a barra de progresso
function updateProgressBar(value, text) {
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = value + "%";
    progressBar.innerText = text;
}

let pyodideReady = false;
let pyodide;

async function loadPyodideAndPackages() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
    });
    await pyodide.loadPackage("micropip");
    await pyodide.loadPackage("pillow");
    await pyodide.runPythonAsync(`
        import micropip
        await micropip.install('numpy')
        await micropip.install('opencv-python')
    `);
    pyodideReady = true;
}

loadPyodideAndPackages();


async function processImageWithPyodide(imageSrc, maskSrc) {
    if (!pyodideReady) {
        await loadPyodideAndPackages();
    }
    updateProgressBar(70, "Processando imagem...");
    await pyodide.runPythonAsync(pythonCode2);
    
    const imageResponse = await fetch(imageSrc);
    const imageData = await imageResponse.arrayBuffer();

    const maskResponse = await fetch(maskSrc);
    const maskData = await maskResponse.arrayBuffer();

    pyodide.globals.set("image_data", pyodide.toPy(new Uint8Array(imageData)));
    pyodide.globals.set("mask_data", pyodide.toPy(new Uint8Array(maskData)));
    
    updateProgressBar(90, "Executando script Python...");
    const result = pyodide.runPython(`
        result = process_image(image_data, mask_data)
        result
    `);

    return result.toJs();
}

document.addEventListener("DOMContentLoaded", () => {
    const aspectRatioBox = document.getElementById("aspect-ratio-box");

    function resizeAspectRatioBox() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        let cropWidth, cropHeight;

        if (windowWidth / windowHeight > 4 / 3) {
            cropHeight = windowHeight;
            cropWidth = (windowHeight * 4) / 3;
        } else {
            cropWidth = windowWidth;
            cropHeight = (windowWidth * 3) / 4;
        }

        aspectRatioBox.style.width = `${cropWidth}px`;
        aspectRatioBox.style.height = `${cropHeight}px`;
        aspectRatioBox.style.left = `50%`;
        aspectRatioBox.style.top = `50%`;
        aspectRatioBox.style.transform = `translate(-50%, -50%)`;

        renderer.setSize(cropWidth, cropHeight);
        renderer.domElement.style.width = `${cropWidth}px`;
        renderer.domElement.style.height = `${cropHeight}px`;
        renderer.domElement.style.left = `50%`;
        renderer.domElement.style.top = `50%`;
        renderer.domElement.style.transform = `translate(-50%, -50%)`;

        if (AR.source) {
            AR.source.domElement.style.width = `${cropWidth}px`;
            AR.source.domElement.style.height = `${cropHeight}px`;
            AR.source.domElement.style.left = `50%`;
            AR.source.domElement.style.top = `50%`;
            AR.source.domElement.style.transform = `translate(-50%, -50%)`;
        }

        if (camera) {
            //amera.aspect = cropWidth / cropHeight;
            //camera.updateProjectionMatrix();
        }
    }

    window.resizeAspectRatioBox = resizeAspectRatioBox;

    window.addEventListener("resize", resizeAspectRatioBox);
    resizeAspectRatioBox();
});

/*
document.getElementById("submitButtonInput").addEventListener("click", async () => {
    try {
        // Exibir loader e esconder botões durante o processamento
        loaderElement.style.display = "block";
        select2.style.display = "none";
        submitBtn.style.display = "none";

        light.position.set(0, 10, 0); // Definir a posição inicial da luz
        const progressContainer = document.getElementById("progressContainer");
        progressContainer.style.display = "block";
        updateProgressBar(0, "Inicializando...");

        // Obter as dimensões da fonte de AR
        var vw, vh;
        if (AR.source.parameters.sourceType == "webcam" || AR.source.parameters.sourceType == "video") {
            vw = AR.source.domElement.videoWidth;
            vh = AR.source.domElement.videoHeight;
        } else {
            vw = AR.source.domElement.naturalWidth;
            vh = AR.source.domElement.naturalHeight;
        }

        vw = vw / 6; // Ajustar a escala da largura
        vh = vh / 6; // Ajustar a escala da altura

        // Criar o canvas com as dimensões exatas da imagem original
        var canvas = document.createElement("canvas");
        canvas.width = vw;  // Usar a largura original da imagem
        canvas.height = vh; // Usar a altura original da imagem
        var ctx = canvas.getContext("2d");

        // Desenhar a imagem original no canvas sem redimensionamento
        ctx.drawImage(AR.source.domElement, 0, 0, vw, vh);

        // Criar uma segunda imagem da cena processada com a máscara (neste caso o objeto 3D)
        var client = document.createElement("canvas");
        client.width = vw;
        client.height = vh;
        var aux = client.getContext("2d");

        // Redimensionar o conteúdo do renderer (o objeto 3D com a cena) para as dimensões originais
        aux.drawImage(renderer.domElement, 0, 0, renderer.domElement.width, renderer.domElement.height, 0, 0, vw, vh);

        // Aplicar o conteúdo do renderer (máscara do objeto 3D) diretamente ao canvas
        ctx.drawImage(client, 0, 0, vw, vh);

        // Obter o data URL da imagem da cena (incluindo o cubo)
        var img = canvas.toDataURL("image/jpeg", 1);

        // Limpar o canvas para a geração da máscara
        ctx.clearRect(0, 0, vw, vh);

        // Criar o canvas para a saída do renderer (para gerar a máscara)
        var client = document.createElement("canvas");
        client.width = vw;
        client.height = vh;
        var aux = client.getContext("2d");

        // Desenhar a saída do renderer no canvas 'client' (para gerar a máscara)
        aux.drawImage(renderer.domElement, 0, 0, renderer.domElement.width, renderer.domElement.height, 0, 0, vw, vh);

        // Obter os dados de imagem do renderer
        var imageData = aux.getImageData(0, 0, vw, vh);
        var data = imageData.data;

        // Criar um novo ImageData para a máscara
        var maskData = ctx.createImageData(vw, vh);
        var maskDataArray = maskData.data;

        // Criar a máscara com base nos pixels alpha do renderer
        for (var i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {  // Se o pixel for visível, marcar como branco
                maskDataArray[i] = 255;
                maskDataArray[i + 1] = 255;
                maskDataArray[i + 2] = 255;
                maskDataArray[i + 3] = 255;
            } else {  // Caso contrário, marcar como preto
                maskDataArray[i] = 0;
                maskDataArray[i + 1] = 0;
                maskDataArray[i + 2] = 0;
                maskDataArray[i + 3] = 255;
            }
        }

        // Colocar os dados da máscara de volta no canvas
        ctx.putImageData(maskData, 0, 0);

        // Converter o canvas da máscara para data URL
        var mask = canvas.toDataURL("image/png"); // Usar PNG para preservar a transparência
        console.log("Data URL gerado:", img);  // Para a imagem
        console.log("Data URL gerado para a máscara:", mask);  // Para a máscara
        updateProgressBar(30, "Iniciando Pyodide...");
        
        // Processar a imagem com Pyodide e OpenCV
        const result = await processImageWithPyodide(img, mask);
        if (!result) {
            throw new Error("Erro ao processar a imagem com OpenCV.");
        }
        updateProgressBar(95, "Atualizando visualização...");

        // Visualizar a imagem da cena e a máscara
        var imgElement = document.createElement("img");
        imgElement.src = img;
        imgElement.style.width = "400px";
        imgElement.style.height = "auto";

        var maskElement = document.createElement("img");
        maskElement.src = mask;
        maskElement.style.width = "400px";
        maskElement.style.height = "auto";

        // Adicionar as imagens ao corpo do documento para depuração
        document.body.appendChild(imgElement);
        document.body.appendChild(maskElement);

        // Processar os resultados conforme necessário
        var object_center = new THREE.Vector2(result.objectCenter[0], result.objectCenter[1]);
        var shadow_center = new THREE.Vector2(result.shadowCenter[0], result.shadowCenter[1]);
        var proportion = result.proportion;
        console.log("Centro de Massa do Objeto: (" + result.objectCenter[0] + ", " + result.objectCenter[1] + ")");
        console.log("Centro de Massa da Sombra: (" + result.shadowCenter[0] + ", " + result.shadowCenter[1] + ")");
        console.log("Proporção: " + proportion);

        // Reescala os pontos para a altura da cena original
        var originalScaleFactor = window.innerHeight / vh;  // Usar a altura real da imagem processada
        object_center.x *= originalScaleFactor;
        object_center.y *= originalScaleFactor;
        shadow_center.x *= originalScaleFactor;
        shadow_center.y *= originalScaleFactor;

        // Converte os centros de massa para coordenadas normalizadas
        object_center.x = (object_center.x / window.innerWidth) * 2 - 1;
        object_center.y = -(object_center.y / window.innerHeight) * 2 + 1;
        shadow_center.x = (shadow_center.x / window.innerWidth) * 2 - 1;
        shadow_center.y = -(shadow_center.y / window.innerHeight) * 2 + 1;

        // Encontra a posição na tela do centro geométrico do cubo
        var object_geometry_center = vObj.position.clone();

        console.log("Object_geometry_center: " + object_geometry_center.x + " " + object_geometry_center.y + " " + object_geometry_center.z);
        var screenPos = object_geometry_center.clone();
        screenPos.project(camera);
        screenPos.x = (screenPos.x * window.innerWidth / 2) + window.innerWidth / 2;
        screenPos.y = -(screenPos.y * window.innerHeight / 2) + window.innerHeight / 2;

        // Converte a posição em tela para coordenadas normalizadas
        var screenPos2D = new THREE.Vector2(
            (screenPos.x / window.innerWidth) * 2 - 1,
            -(screenPos.y / window.innerHeight) * 2 + 1
        );

        // Calcula a diferença entre a posição em tela do centro geométrico do cubo e o centro de massa do objeto
        var diff = new THREE.Vector2();
        diff.subVectors(screenPos2D, object_center);

        // Aplica essa diferença ao centro de massa da sombra para obter sua posição em tela
        var shadow_screen_center = new THREE.Vector2();
        shadow_screen_center.addVectors(shadow_center, diff);

        // Ajuste a posição do ponto de raycasting considerando a proporção
        let scalee = 1;  // Ajustar conforme necessário
        shadow_screen_center.x *= proportion * scalee;
        shadow_screen_center.y *= proportion * scalee;

        let shadow_center_position;
        // Faz raycasting para obter a posição 3D correspondente à posição da tela do centro de massa da sombra
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(shadow_screen_center, camera);
        var intersects = raycaster.intersectObject(shadowPlane);
        if (intersects.length > 0) {
            var intersect = intersects[0];
            console.log("Interseção do centro de massa da sombra 3D:", intersect.point);

            // Calcular a direção da luz
            var lightDirection = new THREE.Vector3();
            lightDirection.subVectors(intersect.point, object_geometry_center).normalize();
            var lightTarget = object_geometry_center.clone().add(lightDirection.multiplyScalar(2));

            // Definir a posição da luz e seu target
            var lightPosition = object_geometry_center.clone().sub(lightDirection.multiplyScalar(1));

            light.position.copy(lightPosition);
            light.target.position.copy(lightTarget);
            light.target.updateMatrixWorld();

            // Visualizar a luz
            var lightHelper = new THREE.DirectionalLightHelper(light, 6);
            //scene.add(lightHelper);

            // Visualizar a direção da luz com uma flecha
            var arrowHelper = new THREE.ArrowHelper(lightDirection, lightPosition, 10, 0xff0000);
            //scene.add(arrowHelper);

            vObj.castShadow = true;
        } else {
            console.log("Nenhuma interseção encontrada para a sombra.");
        }

        updateProgressBar(100, "Fim...");
        if (AR.source.parameters.sourceType === "video") {
            AR.source.domElement.play(); // Despausar o vídeo após a geração da sombra
        }

        //Salvar imagens de depuração
        const debugImages = result.debugImages;
        Object.keys(debugImages).forEach(key => {
            const base64Image = debugImages[key];
            const imgElement = document.createElement("img");
            imgElement.src = "data:image/png;base64," + base64Image;
            imgElement.style.width = "200px";
            imgElement.style.height = "200px";
            imgElement.style.zIndex = "10002";
            document.body.appendChild(imgElement);
        });

        submitBtn.style.display = "none";
        select3.style.display = "block";
        returnBtn.style.display = "block";
        loaderElement.style.display = "none";
        document.getElementById('progressContainer').style.display = 'none';
    } catch (error) {
        console.error(error);
        loaderElement.style.display = "none";
        document.getElementById('progressContainer').style.display = 'none';
    }
});
*/

// document.getElementById("submitButtonInput").addEventListener("click", async () => {
//     try {
//         //let value = select.value;
//         loaderElement.style.display = "block";
//         select2.style.display = "none";
//         submitBtn.style.display = "none";

//         light.position.set(0, 10, 0);
//         const progressContainer = document.getElementById("progressContainer");
//         progressContainer.style.display = "block";
//         updateProgressBar(0, "Inicializando...");

//         var vw, vh;
//         if (AR.source.parameters.sourceType == "webcam" || AR.source.parameters.sourceType == "video") {
//             vw = AR.source.domElement.videoWidth;
//             vh = AR.source.domElement.videoHeight;
//         } else {
//             vw = AR.source.domElement.naturalWidth;
//             vh = AR.source.domElement.naturalHeight;
//         }
//         var w = renderer.domElement.width;
//         var h = renderer.domElement.height;
//         var cw = renderer.domElement.clientWidth;
//         var ch = renderer.domElement.clientHeight;
//         var pw = (cw > ch) ? Math.floor((cw - ch) / 2.0) : 0;
//         var ph = (ch > cw) ? Math.floor((ch - cw) / 2.0) : 0;
//         var pvw = (vw > vh) ? Math.floor((vw - vh) / 2.0) : 0;
//         var pvh = (vh > vw) ? Math.floor((vh - vw) / 2.0) : 0;
//         // Processar a imagem diretamente no navegador
//         var canvas = document.createElement("canvas");
//         var client = document.createElement("canvas");
//         canvas.width = 256;
//         canvas.height = 256;
//         client.width = cw;
//         client.height = ch;
//         var ctx = canvas.getContext("2d");
//         var aux = client.getContext("2d");
//         ctx.drawImage(AR.source.domElement, pvw, pvh, vw - pvw * 2, vh - pvh * 2, 0, 0, 256, 256);
//         aux.drawImage(renderer.domElement, 0, 0, w, h, 0, 0, cw, ch);
//         ctx.drawImage(client, pw, ph, cw - pw * 2, ch - ph * 2, 0, 0, 256, 256);
//         var img = canvas.toDataURL("image/jpeg");
//         ctx.clearRect(0, 0, 256, 256);
//         ctx.drawImage(client, pw, ph, cw - pw * 2, ch - ph * 2, 0, 0, 256, 256);
//         var data = ctx.getImageData(0, 0, 256, 256);
//         for (var i = 0; i < 256 * 256 * 4; i += 4) {
//             if (data.data[i] > 0 || data.data[i + 1] > 0 || data.data[i + 2] > 0) {
//                 data.data[i] = 255;
//                 data.data[i + 1] = 255;
//                 data.data[i + 2] = 255;
//             }
//             data.data[i + 3] = 255;
//         }
//         ctx.putImageData(data, 0, 0);
//         var mask = canvas.toDataURL("image/jpeg");
        
//         updateProgressBar(30, "Iniciando Pyodide...");
//         const result = await processImageWithPyodide(img, mask);
//         if (!result) {
//             throw new Error("Erro ao processar a imagem com OpenCV.");
//         }
//         updateProgressBar(95, "Atualizando visualização...");

//         // Processar os resultados conforme necessário
//         var object_center = new THREE.Vector2(result.objectCenter[0], result.objectCenter[1]);
//         var shadow_center = new THREE.Vector2(result.shadowCenter[0], result.shadowCenter[1]);
//         var proportion = result.proportion;
//         console.log("Centro de Massa do Objeto: (" + result.objectCenter[0] + ", " + result.objectCenter[1] + ")");
//         console.log("Centro de Massa da Sombra: (" + result.shadowCenter[0] + ", " + result.shadowCenter[1] + ")");
//         console.log("Proporção: " + proportion );

//         // Reescala os pontos para a altura da cena
//         var scaleFactor = window.innerHeight / 256;
//         object_center.x *= scaleFactor;
//         object_center.y *= scaleFactor;
//         shadow_center.x *= scaleFactor;
//         shadow_center.y *= scaleFactor;

//         console.log("Scale Factor: " + scaleFactor);
//         console.log(object_center);
//         console.log(shadow_center);

//         // Converte os centros de massa para coordenadas normalizadas
//         object_center.x = (object_center.x / window.innerWidth) * 2 - 1;
//         object_center.y = -(object_center.y / window.innerHeight) * 2 + 1;
//         shadow_center.x = (shadow_center.x / window.innerWidth) * 2 - 1;
//         shadow_center.y = -(shadow_center.y / window.innerHeight) * 2 + 1;

//         console.log("Object_center: " + object_center);
//         console.log("Shadow_center: " + shadow_center);

//         // Encontra a posição na tela do centro geométrico do cubo
//         var object_geometry_center = vObj.position.clone();

//         console.log("Object_geometry_center: " + object_geometry_center.x + " " + object_geometry_center.y + " " + object_geometry_center.z);
//         var screenPos = object_geometry_center.clone();
//         screenPos.project(camera);
//         screenPos.x = (screenPos.x * window.innerWidth / 2) + window.innerWidth / 2;
//         screenPos.y = -(screenPos.y * window.innerHeight / 2) + window.innerHeight / 2;

//         // Converte a posição em tela para coordenadas normalizadas
//         var screenPos2D = new THREE.Vector2(
//             (screenPos.x / window.innerWidth) * 2 - 1,
//             -(screenPos.y / window.innerHeight) * 2 + 1
//         );

//         console.log("ScreenPos2D: " + screenPos2D.x + " " + screenPos2D.y);

//         // Calcula a diferença entre a posição em tela do centro geométrico do cubo e o centro de massa do objeto
//         var diff = new THREE.Vector2();
//         diff.subVectors(screenPos2D, object_center);

//         console.log("Diff: " + diff.x + " " + diff.y);

//         // Aplica essa diferença ao centro de massa da sombra para obter sua posição em tela
//         var shadow_screen_center = new THREE.Vector2();
//         shadow_screen_center.addVectors(shadow_center, diff);

//         // Ajuste a posição do ponto de raycasting considerando a proporção
//         let scalee = 1;
//         shadow_screen_center.x *= proportion * scalee;
//         shadow_screen_center.y *= proportion * scalee;

//         let shadow_center_position;
//         // Faz raycasting para obter a posição 3D correspondente à posição da tela do centro de massa da sombra
//         var raycaster = new THREE.Raycaster();
//         raycaster.setFromCamera(shadow_screen_center, camera);
//         var intersects = raycaster.intersectObject(shadowPlane);
//         if (intersects.length > 0) {
//             var intersect = intersects[0];
//             console.log("Interseção do centro de massa da sombra 3D:", intersect.point);

//             // Adiciona uma esfera para visualizar o centro de massa da sombra
//             //addSphereAtPoint(intersect.point, 0x0000ff);  // Azul para sombra
//             shadow_center_position = intersect.point;
//             // Adicionar linha visualizando o vetor entre os dois pontos
//             //addLineBetweenPoints(object_geometry_center, intersect.point);

//             // Calcular a direção da luz considerando a proporção
//             var lightDirection = new THREE.Vector3();
//             lightDirection.subVectors(intersect.point, object_geometry_center).normalize();
//             var lightTarget = object_geometry_center.clone().add(lightDirection.multiplyScalar(2)); // multiplicar para colocar o target à frente da luz

//             // Definir a posição da luz e seu target, ajustando a posição da luz para trás do objeto
//             var lightPosition = object_geometry_center.clone().sub(lightDirection.multiplyScalar(1)); // ajustar a posição da luz para trás do objeto

//             light.position.copy(lightPosition);
//             light.target.position.copy(lightTarget);
//             light.target.updateMatrixWorld();
//             updateProgressBar(100, "Fim...");

//             // Visualizar a luz
//             var lightHelper = new THREE.DirectionalLightHelper(light, 6); // 5 pode ser ajustado conforme necessário
//             //scene.add(lightHelper);

//             // Visualizar a direção da luz com uma flecha
//             var arrowHelper = new THREE.ArrowHelper(lightDirection, lightPosition, 10, 0xff0000); // 10 pode ser ajustado conforme necessário, 0xff0000 é a cor vermelha
//             //scene.add(arrowHelper);

//             vObj.castShadow = true;
//         } else {
//             console.log("Nenhuma interseção encontrada para a sombra.");
//         }

//         // Adiciona uma esfera para visualizar o centro de massa do objeto
//         //addSphereAtPoint(object_geometry_center, 0x00ff00);  // Verde para o objeto

//         // Adiciona bounding box
//         //addBoundingBox(vObj);

//         // Debug prints
//         console.log("Centro do Cubo 3D:", object_geometry_center);
//         console.log("Posição de Tela do Centro do Cubo 3D:", screenPos);
//         console.log("Posição de Tela do Centro de Massa da Sombra:", shadow_screen_center);
//         console.log("Posição de Tela do Centro de Massa do Objeto:", object_center);
//         console.log("Direção da Luz:", light.position, light.target.position);

//         //Salvar imagens de depuração
//         const debugImages = result.debugImages;
//         Object.keys(debugImages).forEach(key => {
//             const base64Image = debugImages[key];
//             const imgElement = document.createElement("img");
//             imgElement.src = "data:image/png;base64," + base64Image;
//             //imgElement.style.width = "200px";
//             //imgElement.style.height = "200px";
//             imgElement.style.zIndex = "10002";
//             document.body.appendChild(imgElement);
//         });
        
//         if (AR.source.parameters.sourceType === "video") {
//             AR.source.domElement.play(); // Despausar o vídeo após a geração da sombra
//         }
//         submitBtn.style.display = "none";
//         //select.style.display = "none";
//         select2.style.display = "none";
//         //select3.style.display = "none";
//         select3.style.display = "block";
//         returnBtn.style.display = "block";
//         loaderElement.style.display = "none";
//         document.getElementById('progressContainer').style.display = 'none';
//     } catch (error) {
//         console.error(error);
//         loaderElement.style.display = "none";
//         document.getElementById('progressContainer').style.display = 'none';
//     }
// });

document.getElementById("submitButtonInput").addEventListener("click", async () => {
    try {
      loaderElement.style.display = "block";
      select2.style.display = "none";
      submitBtn.style.display = "none";
  
      light.position.set(0, 10, 0);
      const progressContainer = document.getElementById("progressContainer");
      progressContainer.style.display = "block";
      updateProgressBar(0, "Inicializando...");
  
      //Obtem as dimensões originais da fonte AR (imagem/vídeo)
      let vw, vh;
      if (AR.source.parameters.sourceType === "webcam" || AR.source.parameters.sourceType === "video") {
        vw = AR.source.domElement.videoWidth;
        vh = AR.source.domElement.videoHeight;
      } else {
        vw = AR.source.domElement.naturalWidth;
        vh = AR.source.domElement.naturalHeight;
      }
  
      const maxDim = 440;
  
      // Função para reduzir a imagem só se for maior que maxDim
      function scaleDownOnlyIfLarge(width, height, limit) {
        if (width <= limit && height <= limit) {
          return { width, height };
        }
        const ratio = width / height;
        if (ratio > 1) {
          const newWidth = limit;
          const newHeight = Math.round(newWidth / ratio);
          return { width: newWidth, height: newHeight };
        } else {
          const newHeight = limit;
          const newWidth = Math.round(newHeight * ratio);
          return { width: newWidth, height: newHeight };
        }
      }
  
      const { width: scaledW, height: scaledH } = scaleDownOnlyIfLarge(vw, vh, maxDim);
  
      const canvas = document.createElement("canvas");
      canvas.width = scaledW;
      canvas.height = scaledH;
      const ctx = canvas.getContext("2d");
  
      ctx.drawImage(
        AR.source.domElement,
        0, 0,
        vw, vh,          
        0, 0,
        scaledW, scaledH  
      );
  
      const client = document.createElement("canvas");
      client.width = scaledW;
      client.height = scaledH;
      const aux = client.getContext("2d");
  
      aux.drawImage(
        renderer.domElement,
        0, 0,
        renderer.domElement.width,
        renderer.domElement.height,
        0, 0,
        scaledW,
        scaledH
      );
  
      ctx.drawImage(client, 0, 0, scaledW, scaledH);
  
      const img = canvas.toDataURL("image/jpeg", 1.0);
  
      ctx.clearRect(0, 0, scaledW, scaledH);
  
      ctx.drawImage(client, 0, 0, scaledW, scaledH);
  
      const imageData = ctx.getImageData(0, 0, scaledW, scaledH);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        } else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const mask = canvas.toDataURL("image/png");
  
      updateProgressBar(30, "Iniciando Pyodide...");
      const result = await processImageWithPyodide(img, mask);
      if (!result) {
        throw new Error("Erro ao processar a imagem com OpenCV.");
      }
      updateProgressBar(95, "Atualizando visualização...");
  
      //Exibir imagens (debug)
    //   const imgElement = document.createElement("img");
    //   imgElement.src = img;
    //   imgElement.style.width = "300px";
    //   imgElement.style.height = "auto";
    //   document.body.appendChild(imgElement);
  
    //   const maskElement = document.createElement("img");
    //   maskElement.src = mask;
    //   maskElement.style.width = "300px";
    //   maskElement.style.height = "auto";
    //   document.body.appendChild(maskElement);
  
      //Le resultados do Pyodide
      let object_center = new THREE.Vector2(result.objectCenter[0], result.objectCenter[1]);
      let shadow_center = new THREE.Vector2(result.shadowCenter[0], result.shadowCenter[1]);
      let proportion = result.proportion;
  
      //console.log("Objeto (2D):", object_center);
      //console.log("Sombra (2D):", shadow_center);
      console.log("Proporção Objeto Real:", proportion);
  
      //Ajusta as coordenadas do Pyodide de volta pra tela
      const scaleFactor = window.innerHeight / scaledH;
      object_center.x *= scaleFactor;
      object_center.y *= scaleFactor;
      shadow_center.x *= scaleFactor;
      shadow_center.y *= scaleFactor;
  
      object_center.x = (object_center.x / window.innerWidth) * 2 - 1;
      object_center.y = -(object_center.y / window.innerHeight) * 2 + 1;
      shadow_center.x = (shadow_center.x / window.innerWidth) * 2 - 1;
      shadow_center.y = -(shadow_center.y / window.innerHeight) * 2 + 1;
  
      //Posição do objeto 3D na tela
      const object_geometry_center = vObj.position.clone();
      const screenPos = object_geometry_center.clone();
      screenPos.project(camera);
      screenPos.x = (screenPos.x * window.innerWidth / 2) + window.innerWidth / 2;
      screenPos.y = -(screenPos.y * window.innerHeight / 2) + window.innerHeight / 2;
  
      const screenPos2D = new THREE.Vector2(
        (screenPos.x / window.innerWidth) * 2 - 1,
        -(screenPos.y / window.innerHeight) * 2 + 1
      );
  
      //Diferença entre “centro do cubo 3D” e “centro detectado do objeto”
      const diff = new THREE.Vector2();
      diff.subVectors(screenPos2D, object_center);
  
      //Aplica essa diferença ao centro da sombra
      const shadow_screen_center = new THREE.Vector2();
      shadow_screen_center.addVectors(shadow_center, diff);
      const shadow_screen_center_old = new THREE.Vector2();
      shadow_screen_center_old.addVectors(shadow_center, new THREE.Vector2(0, 0));
      const obj_screen_center = new THREE.Vector2();
      obj_screen_center.addVectors(object_center, diff);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(shadow_screen_center_old, camera);
      const intersects3 = raycaster.intersectObject(shadowPlane);
      if (intersects3.length > 0) {
          const intersect3 = intersects3[0];
          console.log("Interseção do Objeto 3D:", intersect3.point);
          //addSphereAtPoint(intersect3.point, 0xff0000);  // Vermelho para o ponto de clique
      } else {
          console.log("Nenhuma interseção encontrada para o objeto.");
      }

      // Ajuste final pela “proportion” e escala
      //const totalScale = result.proportion;  
      const totalScale = result.totalScaleFactor;  
      //const totalScale = result.totalScaleFactor * 0.7;
      shadow_screen_center.x *= totalScale;
      shadow_screen_center.y *= totalScale;

      console.log("Fator de Escala", result.totalScaleFactor);
  
      raycaster.setFromCamera(shadow_screen_center, camera);
      const intersects = raycaster.intersectObject(shadowPlane);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        console.log("Interseção da Sombra 3D:", intersect.point);

  		//addSphereAtPoint(object_geometry_center, 0x00ff00);  // Verde para o ponto central do obj
  		//addSphereAtPoint(intersect.point, 0x0000ff);  // Azul para o ponto de clique
        //addLineBetweenPoints(object_geometry_center, intersect.point);

        const lightDirection = new THREE.Vector3();
        lightDirection.subVectors(intersect.point, object_geometry_center).normalize();
        console.log("Direção da Luz (lightDirection):", lightDirection); //inverter para compara com groundtruth

        const lightTarget = object_geometry_center.clone().add(lightDirection.multiplyScalar(2));
        const lightPosition = object_geometry_center.clone().sub(lightDirection.multiplyScalar(1));
  
        light.position.copy(lightPosition);
        light.target.position.copy(lightTarget);
        light.target.updateMatrixWorld();
  
        vObj.castShadow = true;
      } else {
        console.log("Nenhuma interseção encontrada para a sombra.");
      }

      raycaster.setFromCamera(object_center, camera);
    const intersects2 = raycaster.intersectObject(shadowPlane);
    if (intersects2.length > 0) {
        const intersect2 = intersects2[0];
        console.log("Interseção do Objeto 3D:", intersect2.point);
        //addSphereAtPoint(intersect2.point, 0xff0000);  // Vermelho para o ponto de clique
    } else {
        console.log("Nenhuma interseção encontrada para o objeto.");
    }

        // Debug prints
        console.log("Centro do Cubo 3D:", object_geometry_center);
        console.log("Posição de Tela do Centro do Cubo 3D:", screenPos);
        console.log("Posição de Tela do Centro de Massa da Sombra:", shadow_screen_center);
        console.log("Posição de Tela do Centro de Massa do Objeto:", object_center);

  
      //Debug images do Pyodide
      const debugImages = result.debugImages;
      if (debugImages) {
        Object.keys(debugImages).forEach(key => {
          const base64Image = debugImages[key];
          const dbgImg = document.createElement("img");
          dbgImg.src = "data:image/png;base64," + base64Image;
          dbgImg.style.width = "300px";
          dbgImg.style.height = "auto";
          document.body.appendChild(dbgImg);
        });
      }

        //Cria canvas para capturar a imagem final (cena + sombras)
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = scaledW;
        finalCanvas.height = scaledH;
        const finalCtx = finalCanvas.getContext("2d");

        //Desenha a imagem original da câmera
        finalCtx.drawImage(AR.source.domElement, 0, 0, vw, vh, 0, 0, scaledW, scaledH);
        const renderCanvas = document.createElement("canvas");
        renderCanvas.width = scaledW;
        renderCanvas.height = scaledH;
        const renderCtx = renderCanvas.getContext("2d");
        renderer.render(scene, camera);
        renderCtx.drawImage(
            renderer.domElement,
            0, 0, renderer.domElement.width, renderer.domElement.height,
            0, 0, scaledW, scaledH
        );
        finalCtx.drawImage(renderCanvas, 0, 0, scaledW, scaledH);
        const finalImageDataURL = finalCanvas.toDataURL("image/png");
        const capturedImage = document.createElement("img");
        capturedImage.src = finalImageDataURL;
        capturedImage.style.width = "auto";
        capturedImage.style.height = "auto";
        capturedImage.style.border = "2px solid #ccc";
        capturedImage.style.display = "block";
        capturedImage.style.margin = "10px auto";
        document.body.appendChild(capturedImage);

        const downloadLink = document.createElement("a");
        downloadLink.href = finalImageDataURL;
        downloadLink.download = "captura_com_sombra.jpg";
        downloadLink.innerText = "Baixar Imagem";
        downloadLink.style.display = "block";
        downloadLink.style.textAlign = "center";
        downloadLink.style.margin = "10px";
        downloadLink.style.zIndex = "20000";
        document.body.appendChild(downloadLink);
        //downloadLink.click();

  
      updateProgressBar(100, "Fim...");
  
      if (AR.source.parameters.sourceType === "video") {
        AR.source.domElement.play();
      }
  
      submitBtn.style.display = "none";
      select3.style.display = "block";
      returnBtn.style.display = "block";
      loaderElement.style.display = "none";
      document.getElementById("progressContainer").style.display = "none";
  
    } catch (error) {
      console.error(error);
      loaderElement.style.display = "none";
      document.getElementById("progressContainer").style.display = "none";
    }
}); 
  

function radianosParaGraus(radianos) {
    return radianos * (180 / Math.PI);
}

function onDocumentMouseClick(event) {
	event.preventDefault();

	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	ray.setFromCamera(mouse, camera);

	var intersects = ray.intersectObjects([shadowPlane, vObj]);

	if (intersects.length > 0) {
		var intersect = intersects[0];
		console.log("Interseção no ponto de clique:", intersect.point);
		addSphereAtPoint(intersect.point, 0xff0000);
	} else {
		console.log("Nenhuma interseção encontrada no ponto de clique.");
	}
}

function addSphereAtPoint(point, color) {
    var geometry = new THREE.SphereGeometry(0.1, 16, 16);
    var material = new THREE.MeshBasicMaterial({ color: color });
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    scene.add(sphere);
}

function addLineBetweenPoints(point1, point2) {
    var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var points = [];
    points.push(point1);
    points.push(point2);
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.Line(geometry, material);
    scene.add(line);
}

function addBoundingBox(object) {
    var box = new THREE.BoxHelper(object, 0xffff00);
    scene.add(box);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funções para carregar objetos GLTF
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var loadedObjects = {};
var currentObject = vObj; // Inicializa com o cubo como objeto padrão
var currentFile = null; // Arquivo GLTF atualmente selecionado
var mixer = new Array();

function onError() { };

function onProgress ( xhr, model ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
    }
}

export function getMaxSize(obj) {
	var maxSize;
	var box = new THREE.Box3().setFromObject(obj);
	var min = box.min;
	var max = box.max;
 
	var size = new THREE.Box3();
	size.x = max.x - min.x;
	size.y = max.y - min.y;
	size.z = max.z - min.z;
 
	if (size.x >= size.y && size.x >= size.z)
	   maxSize = size.x;
	else {
	   if (size.y >= size.z)
		  maxSize = size.y;
	   else {
		  maxSize = size.z;
	   }
	}
	return maxSize;
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale) {
	var scale = getMaxSize(obj);
	obj.scale.set(newScale * (1.0 / scale),
	  newScale * (1.0 / scale),
	  newScale * (1.0 / scale));
	return obj;
}
  
function fixPosition(obj) {
	// Fix position of the object over the ground plane
	var box = new THREE.Box3().setFromObject(obj);
	if (box.min.y > 0)
	  obj.translateY(-box.min.y);
	else
	  obj.translateY(-1 * box.min.y);
	return obj;
}

function loadGLTFFile(file, desiredScale, angle, animated='false') {
    var loader = new THREE.GLTFLoader();
    loader.load(file, function(gltf) {
        var obj = gltf.scene;
        obj.castShadow = true;
        obj.traverse(function(child) {
            if (child) {
                child.castShadow = true;
            }
        });
        obj.traverse(function(node) {
            if (node.material) node.material.side = THREE.DoubleSide;
        });

        obj = normalizeAndRescale(obj, desiredScale);
        obj = fixPosition(obj);
        obj.rotateY(THREE.MathUtils.degToRad(angle));

        loadedObjects[file] = obj; // Armazena o objeto carregado
        if (file === currentFile) { // Verifica se o objeto é o atualmente selecionado
            currentObject = obj;
            scene.add(currentObject);
        }
        if(animated === 'true') {
            // Create animationMixer and push it in the array of mixers
            var mixerLocal = new THREE.AnimationMixer(obj);
            mixerLocal.clipAction( gltf.animations[0] ).play();
            mixer.push(mixerLocal);
        }
    }, onProgress, onError);
}


document.getElementById('select3').addEventListener('change', function() {
    var selectedValue = this.value;
    var file;
    var desiredScale = 1;
    var angle = 0;
    var animated = 'false';

    // Remove o objeto atualmente exibido
    if (currentObject) {
        scene.remove(currentObject);
    }

    // Define o arquivo e parâmetros com base no valor selecionado
    switch (selectedValue) {
        case '0':
            currentObject = vObj;
			desiredScale = 1;
            animated = 'false';
			file = 'cube'; 
            break;
        case '1':
            file = 'assets/objs/basket.glb';
			desiredScale = 1.5;
            animated = 'false';
            break;
        case '2':
			file = 'assets/objs/woodenGoose.glb';
			desiredScale = 2.5;
            animated = 'false';
            break;
        case '3':
            file = 'assets/objs/windmill.glb';
            angle = 270;
			desiredScale = 2;
            animated = 'true';
            break;
		case '4':
			file = 'assets/objs/statueLaRenommee.glb';
			desiredScale = 2.5;
            animated = 'false';
			break;
		case '5':
			file = 'assets/objs/statue2.glb';
			desiredScale = 2.5;
            animated = 'false';
			break;
        default:
            currentObject = vObj; // Valor padrão para o cubo
			desiredScale = 1;
            animated = 'false';
			file = 'cube';
    }

    // Atualiza o arquivo atualmente selecionado
    currentFile = file;

    // Carrega e exibe o objeto selecionado
    if (file !== 'cube') {
        if (loadedObjects[file]) {
            currentObject = loadedObjects[file];
            scene.add(currentObject);
        } else {
            loadGLTFFile(file, desiredScale, angle, animated);
        }
    } else {
        scene.add(currentObject);
    }
});

function render(){
	updateAR(); 
	requestAnimationFrame(render);
	//renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
	
	//virtualCamera.visible = false;
	if(camera.visible){
		// Copia a posição da câmera real
		camera.getWorldPosition(position);
		camera.getWorldQuaternion(quaternion);
		//console.log("Camera position: " + position.x + " " + position.y + " " + position.z);
	}

    let delta = clock.getDelta(); 
    for(var i = 0; i<mixer.length; i++)
        mixer[i].update( delta );
}
		
render();