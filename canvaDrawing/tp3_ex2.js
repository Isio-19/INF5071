"use strict";

// Variables globales
let canvas; // Pour la référence au canevas
let gl; // Le contexte graphique WebGL
let uniformAlpha; // Variable uniforme pour alpha
let uniformWidth; // Variable uniforme pour la largeur du canevas
let uniformHeight; // Variable uniforme pour la hauteur du canevas
let uniformColor; // Variable uniforme pour la couleur du pinceau
let uniformPointSize; // Variable uniforme pour la taille du pinceau
let attributeCoords; // Variable attribue pour la coordonnée du pinceau
let bufferCoords; // Référence au VBO des coordonnées
let mouseDown = false; // Pour vérifier si le bouton de la souris est enfoncé
let lastCoordinates; // Dernière coordonnées dessinée
let resolution = 1; // px
let pointSize = 16; // Taille du pinceau en px
let alpha = 1; // alpha
let brushColor = [0.0,0.0,0.0] // couleur du pinceau
let inputSize; // pour la référence au slider inputSize
let inputAlpha; // pour la référence au slider alpha
let inputEffacer; // pour la référence au bouton effacer
let alphaMax = 0.1; // alpha max
let alphaMin = 0.01; // alpha min

/* Shader de sommet */
let vertexShaderSource = 
    "attribute vec2 a_pos;\n" +         //cursor position
    "uniform float u_height;\n" +       //sizes of the screen
    "uniform float u_width;\n" +
    "uniform vec2 u_translation;\n" +   //translation, if any
    "uniform float u_size;\n" +         //size of the paint brush
    "void main() {\n" + 
    "   float x = -1.0 + 2.0*((a_pos.x + u_translation.x) / u_width);\n" +      //absolute coordinates -> [-1, 1]
    "   float y =  1.0 - 2.0*((a_pos.y + u_translation.y) / u_height);\n" +
    "   gl_Position = vec4(x, y, 0.0, 1.0);\n" +
    "   gl_PointSize = u_size;\n" +
    "}\n";
    
/* Shader de fragment */
let fragmentShaderSource = 
    "precision mediump float;\n" +  //so that we can use float
    "uniform vec3 u_color;\n" +     //color of the point, black
    "uniform float u_alpha;\n" +    //transparency of the point
    "void main() {\n" +
    "   float distanceFromCenter = distance(gl_PointCoord, vec2(0.5,0.5));\n" +     //for round points, not square
    "   if (distanceFromCenter >= 0.5) {\n" +
    "       discard;\n" +
    "    }\n" +
    "   gl_FragColor = vec4(u_color, u_alpha);\n" +     //we set the color of the point
    "}\n";
    
/* Fonction de dessin*/
function draw(x, y) {
    let coordinates;
    console.log(inputAlpha.value)
    if (lastCoordinates != null) {
        //we calculate the distance between the current and last coordinates
        var deltaX = x - lastCoordinates[0];         
        var deltaY = y - lastCoordinates[1];
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        //number of points we need to draw so that the stroke looks smooth
        var noPoints = distance*10/inputSize.value;  
        if (noPoints > 1) {
            let newX; let newY; let newCoords;
            for (let t = 1/noPoints; t < 1; t += 1/noPoints) {
                //coordinates of new point
                newX = (1 - t) * lastCoordinates[0] + t * x;       
                newY = (1 - t) * lastCoordinates[1] + t * y;
                newCoords = [newX, newY];
                
                //we draw the new point
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newCoords), gl.STREAM_DRAW);   
                gl.drawArrays(gl.POINTS, 0, 1);
            }
        }
    } else
        coordinates = [x,y];
    
    let mouseCoordinates = new Float32Array(coordinates)
    lastCoordinates = [x, y];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mouseCoordinates), gl.STREAM_DRAW); 
    gl.drawArrays(gl.POINTS, 0, 1);
}

function doMouseDown(event){
    /* Détermine la position (x,y) de la souris,
       en coord. de pixel du canvas.
    */
    if (mouseDown){
        let r = canvas.getBoundingClientRect();
        let x = event.clientX - r.left;
        let y = event.clientY - r.top;
        draw(x,y);
    }
}

/* Création du programme de shader */
function createProgram(gl, vertexShaderSource, fragmentShaderSource){
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Erreur dans le shader de sommet : " + gl.getShaderInfoLog(vsh);
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Erreur dans le shader de fragments : " + gl.getShaderInfoLog(fsh);
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Erreur de liaison dans le programme : " + gl.getProgramInfoLog(prog);
    }
    return prog;
}

/* Initialisation du contexte graphique WebGL */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(prog);

    // On doit récupérer la position des variables attributes et uniform
    // Creation of the VBO
    let attributePos = gl.getAttribLocation(prog, "a_pos");
    bufferCoords = gl.createBuffer();
    gl.enableVertexAttribArray(attributePos);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributePos, 2, gl.FLOAT, false, 0, 0);   

    // Get uniform variables
    uniformColor = gl.getUniformLocation(prog, "u_color");
    uniformAlpha = gl.getUniformLocation(prog, "u_alpha");
    uniformPointSize = gl.getUniformLocation(prog, "u_size");
    uniformWidth = gl.getUniformLocation(prog, "u_width");
    uniformHeight = gl.getUniformLocation(prog, "u_height");

    // Assign values to uniform variables
    gl.uniform3iv(uniformColor, brushColor);
    gl.uniform1f(uniformAlpha, (inputAlpha.value * 3.33) + 0.01);
    gl.uniform1f(uniformPointSize, inputSize.value);
    gl.uniform1f(uniformWidth, canvas.width);
    gl.uniform1f(uniformHeight, canvas.height);

    // Activation of alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear the background
    gl.clearColor(1,1,1,1); // Color of background, white
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear background
}

/* Initialisation du programme */
function init() {
    try {
        canvas = document.getElementById("webglcanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let options = {
            alpha: false,
            depth: false,
            preserveDrawingBuffer: true
        };
        gl = canvas.getContext("webgl", options) ||
             canvas.getContext("experimental-webgl", options);
        console.log(gl)
        if ( ! gl ){
            throw "Le fureteur ne supporte pas WebGL"
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML = 
        "<p>Désolé, problème avec le contexte graphique WebGL</p>"<
        console.log(e)
    }

    // Initialisation des inputs
    inputAlpha = document.getElementById("brushAlpha");
    inputAlpha.value = alpha;
    inputAlpha.min = alphaMin;
    inputAlpha.max = alphaMax;
    inputSize = document.getElementById("brushSize");
    inputEffacer = document.getElementById("eraseCanvas");

    /* Initialisation du contexte graphique */
    try {
        initGL();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = 
        "<p>Désolé, impossible d'initialiser le contexte graphique WebGL:" + e + "</p>;"
    }

    /* Ajout des event listener */
    // La fonction `doMouseDown` est appelée lorsque la souris bouge
    canvas.addEventListener("mousemove", doMouseDown, false);
    
    // Pour indiquer que le bouton de la souris est enfoncé
    document.body.onmousedown = function(){
        mouseDown = true;
    }

    // Pour indiquer que le bouton de la souris n'est plus enfoncé
    document.body.onmouseup = function(){
        mouseDown = false;
        lastCoordinates = null;
    }

    // Pour ajuster la taille du pinceau lorsque la roulette
    // de la souris est utilisée (scrollwheel)
    canvas.addEventListener("wheel", event => {
        const delta = Math.sign(event.deltaY);
        pointSize += delta;
        if (pointSize > 64){
            pointSize = 64;
        } else if (pointSize < 1) {
            pointSize = 1;
        }

        // Mise à jours du slider
        inputSize.value = pointSize;

        // Change size of the paintbrush
        pointSize = Number(document.getElementById("brushSize").value);
        gl.uniform1f(uniformPointSize, inputSize.value);

    })
    
    // Pour ajuster le alpha du pinceau lorsque le slider
    // est déplacé
    inputAlpha.onchange = function(){
        alpha = this.valueAsNumber;
        
        // Change transparency of the paintbrush
        inputAlpha.value = Number(document.getElementById("brushAlpha").value);
        gl.uniform1f(uniformAlpha, (inputAlpha.value * 3.33) + 0.01);
    }

    // Pour ajuster la taille du pinceau lorsque le slider
    // est déplacé
    inputSize.onchange = function(){
        pointSize = this.valueAsNumber;

        // Change size of the paintbrush
        pointSize = Number(document.getElementById("brushSize").value);
        gl.uniform1f(uniformPointSize, inputSize.value);
    }

    // Pour effacer le canevas
    inputEffacer.onclick = function(){
        // Clear the background
        gl.clearColor(1,1,1,1); // Color of background, white
        gl.clear(gl.COLOR_BUFFER_BIT); // Clear background
    }
}