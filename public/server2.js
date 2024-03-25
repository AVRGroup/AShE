const https = require('https');
const { performance } = require('perf_hooks');
const spawn = require("child_process").spawn;
const { exec } = require('child_process');
const { promisify } = require('util');
const THREE = require("three-canvas-renderer");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
//const multer = require("multer");
const fs = require("fs");
const gl = require("gl");
const {createCanvas, loadImage} = require("canvas");
const execPromise = promisify(exec);
const app = express();

var globalID = 1;

var camera, mainScene, scene;
var vObj, fakeShadow, plane;
var adjustX, adjustZ;
var preset, done = false;
var rendW, rendH, renderer, output;
var vObjHeight, vObjRatio, planeSize;

const port = 3000;

var options = {
	index: "index.html"
}

app.use(express.urlencoded({limit: "1mb", extended: true}));
app.engine("html", require("ejs").renderFile);
app.use(express.static('public'));
app.use(cors({origin: "*", optionsSuccessStatus: 200}));

const host = "0.0.0.0";
const openSSL = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
  };
const server = https.createServer(openSSL, app);
server.listen(port, host, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let ipAddress;

    // Encontre o endereço IP da máquina local (geralmente o primeiro na lista)
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      for (const interfaceDetails of networkInterface) {
        if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
          ipAddress = interfaceDetails.address;
          break;
        }
      }
      if (ipAddress) break;
    }
    console.log(`Servidor rodando em https://${ipAddress}:${port}`);
});

async function verificarPython() {
  try {
    await execPromise('python3 --version');
    return 'python3';
  } catch (errorPython3) {
    try {
      await execPromise('python --version');
      return 'python';
    } catch (errorPython2) {
      throw new Error('Python não encontrado no sistema.');
    }
  }
}

app.post("/threejs", async (req, res) =>
{
	const start = performance.now();

	const id = globalID++;
	if (globalID > 99)
		globalID = 1;
	console.log((id < 10 ? "0" : "") + id + ": received request");
	fs.writeFileSync(__dirname + "/arshadowgan/data/noshadow/01.jpg", Buffer.from(req.body.img.replace(/^data:image\/\w+;base64,/, ""), "base64"));
	fs.writeFileSync(__dirname + "/arshadowgan/data/mask/01.jpg", Buffer.from(req.body.mask.replace(/^data:image\/\w+;base64,/, ""), "base64"));
	const comando = await verificarPython();
	var py = spawn(comando, ["-u", __dirname + "/arshadowgan/test2.py"]);
	console.log((id < 10 ? "0" : "") + id + ": started python");
	py.stdout.on("data", (pyData) =>
	{
		console.log((id < 10 ? "0" : "") + id + ": got python output");
		pyData = pyData.toString();
		var contour = pyData.split(" ");
		if (isNaN(contour[0]))
			res.send("0 1 0");
		else
		{
			console.log((id < 10 ? "0" : "") + id + ": started js")
			var result = "vazio";
			console.log({__dirname});
			var child = spawn("node", [__dirname + "/child.js", pyData, req.body.scene]);
			console.log("node child.js " + pyData + " " + req.body.scene);
			child.stdout.on("data", (data) =>
			{
				const end = performance.now();
				const tempoDecorridoMs = end - start;
				const horas = Math.floor(tempoDecorridoMs / (1000 * 60 * 60));
				const minutos = Math.floor((tempoDecorridoMs % (1000 * 60 * 60)) / (1000 * 60));
				const segundos = Math.floor((tempoDecorridoMs % (1000 * 60)) / 1000);
				const milissegundos = Math.floor(tempoDecorridoMs % 1000);
				
				console.log(`Tempo de processamento: ${horas}h:${minutos}m:${segundos}s:${milissegundos}ms`);
				console.log(result)
				result = data.toString();
				result = result.replace(/(\r\n|\n|\r)/gm, "");
				console.log((id < 10 ? "0" : "") + id + ": returned (" + result + ")");
				res.send(result);
				child.kill();
			});
		}
		py.kill();
	});
});

