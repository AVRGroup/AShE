var arToolkitSource, arToolkitContext;
var camera, renderer, rend, mainScene, scene;
var emptyObj, vObj, vObjMask, light, origLight, shadowPlane, wPlane, dPlane;
var adjustX, adjustZ;

var ray    = new THREE.Raycaster();
var point  = new THREE.Vector2();
var loader = new THREE.TextureLoader();

var planeSize      = 150.00;
var sPlaneSize     =  15.00;
var sPlaneSegments = 300.00;
var vObjHeight     =   1.20;
var vObjRatio      =   1.00;
var adjustX        =   0.00;
var adjustZ        =   0.00;
var done           =  false;

var objLoader = new THREE.OBJLoader();
var mtlLoader = new THREE.MTLLoader();
var GLTFLoader = new THREE.GLTFLoader();
var objObject = null;

const loaderElement = document.createElement("div");
loaderElement.setAttribute("class", "loader");	
loaderElement.setAttribute("id", "loader");
document.body.appendChild(loaderElement);
const select = document.getElementById("select");
const submitBtn = document.getElementById("submitButton");
const returnBtn = document.getElementById("returnButton");
returnBtn.style.display = "none";
const select2 = document.getElementById("select2");
const select3 = document.getElementById("select3");
select3.style.display = "none";
loaderElement.style.display = "none";

initialize();
animate();


function onResize()
{
	arToolkitSource.onResizeElement()	
	arToolkitSource.copyElementSizeTo(renderer.domElement)	
	if ( arToolkitContext.arController !== null )
	{
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
	}
}

function setSource(type, url)
{
   if(arToolkitSource) arToolkitSource = null

   arToolkitSource = new THREEx.ArToolkitSource({	
	   sourceType : type,
	  sourceUrl : url,

   })
   arToolkitSource.init(function onReady(){
	   onResize()    
   })
}

function initialize()
{
	// let vec1 = new THREE.Vector3(-0.15, 0.77, -0.62)
	// let vec2 = new THREE.Vector3(-5.25, 17.21, -14.58)
	// //let vec1 = v;
	// //let vec2 = new THREE.Vector3(-3, 5, -6);
	// var ang = vec1.angleTo(vec2); // calcula dif angular
	// console.log("Diferença angular entre vetores: " + radianosParaGraus(ang));
	// vec2 = vec2.normalize();
	// console.log("(" + vec2.x.toFixed(2) + ", " + vec2.y.toFixed(2) + ", "  + vec2.z.toFixed(2) + ")");
	/**********************************************************************************************
	 *
	 * Cenas e iluminação
	 *
	 *********************************************************************************************/

	mainScene = new THREE.Scene();

	// fov (degrees), aspect, near, far
	//camera = new THREE.PerspectiveCamera(32, 16.0 / 9.0, 1, 1000);
	camera = new THREE.PerspectiveCamera(45,  window.innerWidth / window.innerHeight, 0.1, 1000);
	mainScene.add(camera);

	/**********************************************************************************************
	 *
	 * Renderers e canvas
	 *
	 *********************************************************************************************/

	renderer = new THREE.WebGLRenderer({
		preserveDrawingBuffer: true,
		antialias: true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0);
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	renderer.shadowMap.enabled = true;
	//renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
	//renderer.setSize(640, 640);
	renderer.setSize(window.innerWidth, window.innerHeight); // Change here to render in low resolution (for example 640 x 480)
	document.body.appendChild(renderer.domElement);

	var clock = new THREE.Clock();
	var deltaTime = 0;
	var totalTime = 0;
	
	/**********************************************************************************************
	 *
	 * AR Toolkit
	 *
	 *********************************************************************************************/

	arToolkitSource = new THREEx.ArToolkitSource({
		//sourceType: "webcam",
		//sourceType: "video", sourceUrl: "my-videos/video5.MOV",
		sourceType: "image", sourceUrl: "my-images/img_extobj_2.jpeg",
	});
	
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init(function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
		//camera.aspect = 1.0;
		//camera.updateProjectionMatrix();
	});
	
	//setSource("webcam", null)
	arToolkitSource.init(function onReady(){
		onResize()
	});

	/**********************************************************************************************
	 *
	 * Materiais e texturas
	 *
	 *********************************************************************************************/

	var wood = new THREE.MeshLambertMaterial({map: loader.load("my-textures/face/wood.png")});

	var shadowMat = new THREE.ShadowMaterial({
		opacity: 0.75,
		side: THREE.DoubleSide,
	});

	var emptyMat = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0,
		side: THREE.DoubleSide,
	});

	/**********************************************************************************************
	 *
	 * Cenas
	 *
	 *********************************************************************************************/

	scene = new THREE.Group();
	mainScene.add(scene);
	var markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, scene, {
		type: "pattern", patternUrl: "data/kanji.patt",
	});

	/**********************************************************************************************
	 *
	 * Iluminação
	 *
	 *********************************************************************************************/

	var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
	origLight = new THREE.DirectionalLight(0xffffff);
	origLight.castShadow = true;
	var d = vObjRatio * vObjHeight * 10;
	origLight.shadow.camera.left   = -d;
	origLight.shadow.camera.right  =  d;
	origLight.shadow.camera.top    =  d;
	origLight.shadow.camera.bottom = -d;

	origLight.shadow.mapSize.width  = 4096;
	origLight.shadow.mapSize.height = 4096;

	light = origLight.clone();

//	var helper = new THREE.CameraHelper(light.shadow.camera);
//	scene.add(helper);

	/**********************************************************************************************
	 *
	 * Geometrias
	 *
	 *********************************************************************************************/

	var cube   = new THREE.BoxBufferGeometry(vObjHeight, vObjHeight * vObjRatio, vObjHeight);
	//var cube   = new THREE.BoxGeometry(1.2, 1.2, 1.2);
	var plane  = new THREE.PlaneGeometry(planeSize, planeSize);
	var splane = new THREE.PlaneGeometry(sPlaneSize, sPlaneSize, sPlaneSegments, sPlaneSegments);

	/**********************************************************************************************
	 *
	 * Objetos 3D presentes nas cenas
	 *
	 *********************************************************************************************/

	vObj        = new THREE.Mesh(cube,   wood);
	emptyObj    = new THREE.Mesh(cube,   emptyMat);
	shadowPlane = new THREE.Mesh(splane, shadowMat);
	var emptyPlane  = new THREE.Mesh(plane,  emptyMat);

	/**********************************************************************************************
	 *
	 * Ajustes de posição, rotação, etc.
	 *
	 *********************************************************************************************/

	origLight.position.set(10 * vObjHeight, vObjRatio * vObjHeight / 2, vObjHeight / 2);
	light.position.set    (10 * vObjHeight, vObjRatio * vObjHeight / 2, vObjHeight / 2);
	vObj.position.set     (adjustX, vObjRatio * vObjHeight / 2, adjustZ);
	//camera.position.set   (0, 9, 12);

	camera.lookAt(new THREE.Vector3(0, 0, 0));

	shadowPlane.receiveShadow = true;
	vObj.castShadow           = false;

	shadowPlane.rotation.x = -Math.PI / 2;
	shadowPlane.position.y = -0.05;
	emptyPlane.rotation.x  = -Math.PI / 2;
	emptyPlane.position.y  = -0.05;

	/**********************************************************************************************
	 *
	 * Ajustes de posição e rotação
	 *
	 *********************************************************************************************/

	scene.add(ambientLight.clone());

	scene.add(vObj);
	scene.add(shadowPlane);
	scene.add(emptyPlane);
	scene.add(emptyObj);
	scene.add(light);

	light.target = emptyObj;

	scene.updateMatrixWorld(true);
	camera.updateMatrixWorld(true);

	light.position.set(0, 10, 0);
	light.target = emptyObj;
}

var selectValue = "0";

document.getElementById("select2").addEventListener("click", async () => {
	const select = document.getElementById("select2");
	let value = select.value;
	if(selectValue != value) {
		selectValue = value;
		switch (value)
        {
        	case '0':
              	setSource('webcam',null)
              	break;
        	case '1':
              	setSource('image','my-images/frame_1.jpg')         
              	break;
        	case '2':
              	setSource('image', 'my-images/frame2.jpg')                     
              	break;
			case '3':
				setSource('image','my-images/foto1.png')         
				break;
        }
	}
})

returnBtn.addEventListener('click', async () => {
	let value = select2.value;
		switch (value)
        {
        	case '0':
              	setSource('webcam',null)
              	break;
        	case '1':
              	setSource('image','my-images/frame_1.jpg')         
              	break;
        	case '2':
              	setSource('image', 'my-images/frame2.jpg')                     
              	break;
			case '3':
				console.log('entrou 3')	
				setSource('image','my-images/foto1.png')         
				break;
        }
	select.style.display = "block";
	select2.style.display = "block";
	submitBtn.style.display = "block";
	select3.style.display = "none";
	returnBtn.style.display = "none";
	light.position.set(0, 10, 0);
});

document.getElementById("submitButtonInput").addEventListener("click", async () => {
	let value = select.value;
	loaderElement.style.display = "block";

	light.position.set(0, 10, 0);
	renderer.render(mainScene, camera);

	var $form = $("#submitButton");
	var params = "";
	var inv = camera.projectionMatrix.clone();
	inv.getInverse(inv);

	for (var i = 0; i < 16; i++)
		params += scene.matrix.elements[i] + " ";
	for (var i = 0; i < 16; i++)
		params += camera.projectionMatrix.elements[i] + " ";
	for (var i = 0; i < 16; i++)
		params += inv.elements[i] + " ";
	params += renderer.domElement.clientWidth.toString() + " ";
	params += renderer.domElement.clientHeight.toString() + " ";
	params += value; // preset, pode ser alterado eventualmente. pode ser 0, 1 ou 2

	var vw, vh;
	if (arToolkitSource.parameters.sourceType == "webcam" || arToolkitSource.parameters.sourceType == "video")
	{
		vw = arToolkitSource.domElement.videoWidth;
		vh = arToolkitSource.domElement.videoHeight;
	}
	else
	{
		vw = arToolkitSource.domElement.naturalWidth;
		vh = arToolkitSource.domElement.naturalHeight;
	}
	var w   = renderer.domElement.width;
	var h   = renderer.domElement.height;
	var cw  = renderer.domElement.clientWidth;
	var ch  = renderer.domElement.clientHeight;
	var pw  = (cw > ch) ? Math.floor((cw - ch) / 2.0) : 0;
	var ph  = (ch > cw) ? Math.floor((ch - cw) / 2.0) : 0;
	var pvw = (vw > vh) ? Math.floor((vw - vh) / 2.0) : 0;
	var pvh = (vh > vw) ? Math.floor((vh - vw) / 2.0) : 0;
	var canvas = document.createElement("canvas");
	var client = document.createElement("canvas");
	canvas.width  = 256;
	canvas.height = 256;
	client.width  = cw;
	client.height = ch;
	var ctx = canvas.getContext("2d");
	var aux = client.getContext("2d");
	ctx.drawImage(arToolkitSource.domElement, pvw, pvh, vw - pvw * 2, vh - pvh * 2, 0, 0, 256, 256);
	aux.drawImage(renderer.domElement, 0, 0, w, h, 0, 0, cw, ch);
	ctx.drawImage(client, pw, ph, cw - pw * 2, ch - ph * 2, 0, 0, 256, 256);
	var img = canvas.toDataURL("image/jpeg");
	ctx.clearRect(0, 0, 256, 256);
	ctx.drawImage(client, pw, ph, cw - pw * 2, ch - ph * 2, 0, 0, 256, 256);
	var data = ctx.getImageData(0, 0, 256, 256);
	for (var i = 0; i < 256 * 256 * 4; i += 4)
	{
		if (data.data[i] > 0 || data.data[i + 1] > 0 || data.data[i + 2] > 0)
		{
			data.data[i]     = 255;
			data.data[i + 1] = 255;
			data.data[i + 2] = 255;
		}
		data.data[i + 3] = 255;
	}
	ctx.putImageData(data, 0, 0);
	var mask = canvas.toDataURL("image/jpeg");
	var url = $form.attr("action");
	const start = performance.now();
	var posting = $.post(url, {scene: params, img: img, mask: mask});
	posting.done(function(data)
	{
		returnBtn.style.display = "block";
		select3.style.display = "block";
		loaderElement.style.display = "none";
		const end = performance.now();
		const tempoDecorridoMs = end - start;
		const horas = Math.floor(tempoDecorridoMs / (1000 * 60 * 60));
		const minutos = Math.floor((tempoDecorridoMs % (1000 * 60 * 60)) / (1000 * 60));
		const segundos = Math.floor((tempoDecorridoMs % (1000 * 60)) / 1000);
		const milissegundos = Math.floor(tempoDecorridoMs % 1000);
		
		console.log(`Tempo de processamento: ${horas}h:${minutos}m:${segundos}s:${milissegundos}ms`);
	  
		data = data.split(" ");
		var v = new THREE.Vector3(parseFloat(data[0]), parseFloat(data[1]), parseFloat(data[2]));
		v.multiplyScalar(5);
		v.add(vObj.position.clone());
		vObj.castShadow = true;
		//let vec1 = v;
		//let vec2 = new THREE.Vector3(-3, 5, -6);
		//var ang = vec1.angleTo(vec2); // calcula dif angular
		//console.log("Diferença angular entre vetores: " + radianosParaGraus(ang));
		console.log("(" + v.x.toFixed(2) + ", " + v.y.toFixed(2) + ", " + v.z.toFixed(2) + ")");
		light.position.set(v.x, v.y, v.z);
		console.log(light.position)
		switch (selectValue)
        {
        	case '0':
              	//setSource('webcam',null)
              	break;
        	case '1':
              	//setSource('image','my-images/imagem_1.jpg')         
              	break;
        	case '2':
              	//setSource('image', 'my-images/frame2.jpg')                     
              	break;
			case '3':
				setSource("video", "my-videos/video4.MOV")    

			  	break;
        }
	});
	submitBtn.style.display = "none";
	select.style.display = "none";
	select2.style.display = "none";
	select3.style.display = "none";

	posting.fail(function(response) {
		returnBtn.style.display = "block";
		loaderElement.style.display = "none";
		alert('Error: ' + response.responseText);
	})
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funções para carregar objetos GLTF
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var loadedObjects = {};
var currentObject = vObj; // Inicializa com o cubo como objeto padrão
var currentFile = null; // Arquivo GLTF atualmente selecionado

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


function loadGLTFFile(file, desiredScale, angle) {
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
    }, onProgress, onError);
}


document.getElementById('select3').addEventListener('change', function() {
    var selectedValue = this.value;
    var file;
    var desiredScale = 1;
    var angle = 0;

    // Remove o objeto atualmente exibido
    if (currentObject) {
        scene.remove(currentObject);
    }

    // Define o arquivo e parâmetros com base no valor selecionado
    switch (selectedValue) {
        case '0':
            currentObject = vObj;
			desiredScale = 1;
			file = 'cube'; // Valor especial para o cubo
            break;
        case '1':
            file = 'assets/objs/basket.glb';
			desiredScale = 1.5;
            break;
        case '2':
            file = 'assets/objs/cubwooden.glb';
			desiredScale = 2;
            break;
        case '3':
            file = 'assets/objs/dog.glb';
			desiredScale = 3;
            break;
		case '4':
			file = 'assets/objs/house.glb';
			desiredScale = 2;
			break;
		case '5':
			file = 'assets/objs/statueLaRenommee.glb';
			desiredScale = 2.5;
			break;
		case '6':
			file = 'assets/objs/woodenGoose.glb';
			desiredScale = 2.5;
			break;
        default:
            currentObject = vObj; // Valor padrão para o cubo
			desiredScale = 1;
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
            loadGLTFFile(file, desiredScale, angle);
        }
    } else {
        scene.add(currentObject);
    }
});

function radianosParaGraus(radianos) {
    return radianos * (180 / Math.PI);
}

function update()
{
	// update artoolkit every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);
}


function render()
{
	renderer.render(mainScene, camera);
}


function animate()
{
	requestAnimationFrame(animate);
	update();
	render();
}
