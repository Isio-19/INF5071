"use strict";

let scene, camera, renderer;  // Bases pour le rendu Three.js
let controls; // Pour l'interaction avec la souris
let canvas;  // Le canevas où est dessinée la scène
let brainMaterial; // Matériau pour la surface du cerveau

/* Création de la scène 3D */
function createScene() {
    scene = new THREE.Scene();

    // Ajout d'une caméra
    camera = new THREE.PerspectiveCamera(45, canvas.width/canvas.height, 0.1, 100);
	camera.position.set(-1, 2, 2);

    // Ajout d'une lumière liée à la caméra
    var light = new THREE.DirectionalLight("white", 0.8); // Lumière blanche d'intensité 0.8
    light.position.set(0, 0, -1); // On pointe la lumière vers l'axe Z positif

    camera.add(light);
    scene.add(camera);

    // Ajout d'une lumière ambiante
    scene.add(new THREE.AmbientLight("white", 0.2));

    // Modélisation du cerveau
    add_brainMesh("./allenMouseBrain.obj");

    // Modelisation du volume d'injection
    add_injectionVolumeMesh("./volumeInjection.obj");

    // Modélisation des streamlines
    add_streamlines("./streamlines_100149109.json");
}

function add_brainMesh(url){
    // Importation de la surface du cerveau
    let brainIFS = loadBrain(url)
    var cerveauGeom = new THREE.BufferGeometry();
    
    // Ajout des sommets
    var arraySommets = new Float32Array(brainIFS.vertexPositions.flat(1));
    var cerveauSommets = new THREE.BufferAttribute(arraySommets, 3);
    cerveauGeom.setAttribute("position", cerveauSommets);
    
    // Ajout des faces
    cerveauGeom.setIndex(brainIFS.faces.flat(1));
    
    // Calcul des normales
    cerveauGeom.computeVertexNormals();
    
    // Création du matériau
    brainMaterial = new THREE.MeshPhongMaterial({
        color: "gray",
        flatShading: false, // Ombrage lisse
        transparent: true,
        opacity: 0.25,
        reflectivity: 1.0,
        refractionRatio: 0.25,
    });
        
    // Création du maillage
    var cerveau = new THREE.Mesh(
        cerveauGeom,
        brainMaterial
    );

    // Rotation pour s'assurer que le dessus du cerveau est vers le haut.
    cerveau.rotateX(Math.PI)

    // Ajout du modèle à la scène.
    scene.add(cerveau);
}

function add_injectionVolumeMesh(url){
    // Importation du volume d'injection
    let injectionIFS = loadInjection(url);
    var injectionGeom = new THREE.BufferGeometry();

    // Ajout des sommets
    var arraySommets = new Float32Array(injectionIFS.vertexPositions.flat(1));
    var injectionSommets = new THREE.BufferAttribute(arraySommets, 3);
    injectionGeom.setAttribute("position", injectionSommets);

    // Ajout des faces
    injectionGeom.setIndex(injectionIFS.faces.flat(1));

    // Calcul des normales
    injectionGeom.computeVertexNormals();

    // Création du matériau
    var injectionMaterial = new THREE.MeshPhongMaterial({
        color: "green",
        flatShading: false, // Ombrage lisse
        shininess: 30
    });

    // Création du maillage
    var injection = new THREE.Mesh(
        injectionGeom,
        injectionMaterial
    );

    // Rotation pour s'assurer que le dessus du cerveau est vers le haut.
    injection.rotateX(Math.PI);

    // Ajout du modèle à la scène.
    scene.add(injection);
}

/* Fonction ajoutant à la scène 3D toutes les streamlines 
   contenues dans le fichier fourni */
function add_streamlines(url){
    let streamlines = loadStreamlines(url)

    for (let i=0; i < streamlines.length; i++){
        add_singleStreamline(streamlines[i]);
    }
}

/* Fonction permettant d'ajouter un seul streamline à la scène 3D */
function add_singleStreamline(line){
    // line est un array dont chaque élément est un object JavaScript ayant les 
    // propriété x, y et z pour la position d'un point de ce streamline.
    const points = new Float32Array(line.length * 3);
    const colors = new Float32Array(line.length * 3);
    let r, g, b;
    for (let i = 0; i < line.length; i++){
        // Ajout d'un point dans l'array points.
        points[3*i] = line[i].x; points[3*i+1] = line[i].y; points[3*i+2] = line[i].z;
        
    }
    for (let i = 0; i < line.length; i++){
        // Calcul de la couleur du point
        var colorVector = new THREE.Vector3(0, 0, 0); // x = rouge, y = vert, z = bleu
        colorVector.x = Math.abs(points[3*(i+1)+2] - points[3*(i-1)+2]); // Différence des z
        colorVector.y = Math.abs(points[3*(i+1)+1] - points[3*(i-1)+1]); // Différence des y
        colorVector.z = Math.abs(points[3*(i+1)] - points[3*(i-1)]); // Différence des x
        colorVector.normalize(); // On normalise le vecteur
        colors[3*i] = colorVector.x; colors[3*i+1] = colorVector.y; colors[3*i+2] = colorVector.z;
    }
    
    // Pour s'assurer que le 1er point utilise une bonne couleur
    colors[0] = colors[3];
    colors[1] = colors[4];
    colors[2] = colors[5];
    // Pour s'assurer que le dernier point utilise une bonne couleur
    colors[colors.length-1] = colors[colors.length-4];
    colors[colors.length-2] = colors[colors.length-5];
    colors[colors.length-3] = colors[colors.length-6];

    // Création d'une géométrie pour contenir les sommets et les couleurs
    var streamlineGeom = new THREE.BufferGeometry();
    streamlineGeom.setAttribute("position", new THREE.BufferAttribute(points, 3));
    streamlineGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    
    // Création d'un matériau de type LineBasicMaterial
    var streamlineMaterial = new THREE.LineBasicMaterial({
        linewidth: 3,
        vertexColors: true
    });

    // Création d'un modèle
    var model = new THREE.Line(
        streamlineGeom,
        streamlineMaterial
    )
    
    // Rotation pour s'assurer que le dessus du cerveau est vers le haut.
    model.rotateX(Math.PI); // TODO: Décommentez cette ligne

    // Ajout du modèle à la scène.
    scene.add(model);
}

// Fontion d'initialisation. Elle est appelée lors du chargement du body html.
function init() {
    try {
        canvas = document.getElementById("glcanvas");
        renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<h3><b>Sorry, WebGL is required but is not available.</b><h3>";
        return;
    }

    // Création de la scène 3D
    createScene();

    // Texture cubemap
    var textureURLs = [
        "posx.png",
        "negx.png",
        "posy.png",
        "negy.png",
        "posz.png",
        "negz.png"];
    var loader = new THREE.CubeTextureLoader();
    var cubeTexture = loader.load(textureURLs);

    scene.background = cubeTexture;

    // Ajout de l'interactivité avec la souris
    controls = new THREE.TrackballControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    
    // Animation de la scène (appelée toute les 30 millisecondes)
    animate();
}

/* Animation de la scène */
function animate()
{
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
