let camera;
let last_render = Date.now();

// Propriétés des étoiles
let n_stars = 64;
let star_color = [1,1,1,1]
let star_size = 2.0
let stars = {x: [], y: [], z: []}

// Propriété du système solaire
let orbit_angle = 0.0; // theta2
let orbit_duration = 15; // seconds
let orbit_n_segments = 64;

// Propriétés de la planète
let sphereIFS;
let fichier_sphere = "tp2_sphere.obj"
let fichier_texture = "tp2_texture_planete.jpg"
let planete_tx = 0;
let planete_day_duration = 5; // second
let planete_angle = 0; // non utilisée
let sun_color = [1.0, 0.7, 0.0, 1.0];
let earth_color = [1.0, 1.0, 1.0, 1.0];

// Propriétés du satellite
let satelliteIFS;
let fichier_satellite = "tp2_satellite.obj"
let satellite_orbit_duration = 3; // seconds
let satellite_orbit_angle = 0; // theta1
let satellite_color = [0.35, 0.35, 0.35, 1.0];
let solar_pannel_color = [0, 0, 0.2, 1.0];


function generate_randomStars() {
    for(i = 0; i < n_stars; i++) {
        // On génère des coordonnées sphériques (donc un vecteur allant de l'origine jusqu'au point)
        let longueurVecteur = Math.random() + 1; // Longueur du vecteur entre 1 et 2
        let thetaVecteur = Math.random() * Math.PI * 2; // Premier angle entre 0 et 2pi
        let phiVecteur = Math.random() * Math.PI * 2; // Deuxième angle entre 0 et 2pi
        
        // On calcule les coordonnées cartésiennes à partir des coordonnées sphériques
        let starX = longueurVecteur * Math.sin(thetaVecteur) * Math.cos(phiVecteur);
        let starY = longueurVecteur * Math.sin(thetaVecteur) * Math.sin(phiVecteur);
        let starZ = longueurVecteur * Math.cos(thetaVecteur);
       
        // On ajoute une étoile dans la liste, donc dans chacune des coordonnées
        stars["x"].push(starX);
        stars["y"].push(starY);
        stars["z"].push(starZ);
    }
    // stars contient donc toutes nos étoiles à la fin de cette fonction.
}

function generate_pyramid_IFS(){
    // Voir fichier tp2_rapport.pdf pour plus d'informations
    let model = {}
    
    // On stocke les points selon la consigne
    let vertexPositions = [
        Math.sqrt(8.0/9.0), 0, -(1.0/3.0), // A (ou v1)
        -Math.sqrt(2.0/9.0), Math.sqrt(2.0/3.0), -(1.0/3.0), // B (ou v2)
        -Math.sqrt(2.0/9.0), -Math.sqrt(2.0/3.0), -(1.0/3.0), // C (ou v3)
        0, 0, 1 // D (ou v4)
    ]; 
    
    // On stocke chaque face
    let parts = [
        0, 1, 2, // ABC
        0, 1, 3, // ABD
        0, 2, 3, // ACD
        1, 2, 3  // BCD
    ];
    
    // On stocke les vecteurs normaux 
    let vertexNormals = [
        0, 0, -1,
        Math.sqrt(2.0/9.0), Math.sqrt(2.0/3.0), (1.0/3.0),
        Math.sqrt(2.0/9.0), -Math.sqrt(2.0/3.0), (1.0/3.0),
        -Math.sqrt(8.0/9.0), 0, (1.0/3.0),
    ];
    
    model["vertexPositions"] = vertexPositions;
    model["vertexNormals"] = vertexNormals;
    model["parts"] = parts;
    return model
}

function draw_pyramid(model, position, scale, color) {
    // On active ce qu'il nous faut activer
    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_NORMAL_ARRAY);
    
    // On deplace la pyramide
    glTranslatef(position[0], position[1], position[2]);
    
    // On définit les propriétés de la pyramide à dessiner
    glMaterialfv(GL_FRONT, GL_EMISSION, [0.2, 0.2, 0.2, 1.0]); // Faible couleur d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, color); // Couleur ambiante et diffuse
    glMaterialfv(GL_FRONT, GL_SPECULAR, color); // Couleur spéculaire
    glMaterialf(GL_FRONT, GL_SHININESS, 20); // Faible brillance
    glScalef(scale, scale, scale); // On met la pyramide à l'échelle
    
    // Points
    glVertexPointer(3, GL_FLOAT, 0, model["vertexPositions"]);
    
    // Vecteurs normaux
    glNormalPointer(GL_FLOAT, 0, model["vertexNormals"]);
   
    // On dessine avec glDrawElements
    glDrawElements(GL_TRIANGLES, model["parts"].length, GL_UNSIGNED_INT, model["parts"]);    
    
    // On désactive ce qu'on a activé
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
}

function draw_sun(model, scale) {
    // On active ce qu'il nous faut activer
    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_NORMAL_ARRAY);

    // On définit les propriétés de la sphère à dessiner
    glMaterialfv(GL_FRONT, GL_EMISSION, sun_color); // Couleur jaune/orange d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur ambiante ou diffuse
    glMaterialfv(GL_FRONT, GL_SPECULAR, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur spéculaire
    glScalef(scale, scale, scale); // On met la sphère à l'échelle

    // Points
    glVertexPointer(3, GL_FLOAT, 0, model.vertexPositions);

    // Vecteurs normaux
    glNormalPointer(GL_FLOAT, 0, model.vertexNormals);

    // On dessine avec glDrawElements
    glDrawElements(GL_TRIANGLES, model.parts["Sphere_Sphere.001"].length, GL_UNSIGNED_INT, model.parts["Sphere_Sphere.001"]);  

    // On désactive ce qu'on a activé
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
}

function draw_earth(model, scale) {
    // On active ce qu'il nous faut activer
    glEnable(GL_TEXTURE_2D);
    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_NORMAL_ARRAY);
    glEnableClientState(GL_TEXTURE_COORD_ARRAY);

    // On définit les informations de texture
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 512, 256, 0, GL_RGBA, GL_UNSIGNED_BYTE, image);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glMatrixMode(GL_TEXTURE);
    glLoadIdentity();
    glTranslatef(-planete_tx, 0.0, 0.0); // Rotation de la texture de la terre pour simuler la rotation de cette dernière, - pour avoir le bon sens de rotation
    glMatrixMode(GL_MODELVIEW);

    // On définit les propriétés de la sphère à dessiner
    glMaterialfv(GL_FRONT, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, earth_color); // Couleur blanche ambiante
    glMaterialfv(GL_FRONT, GL_SPECULAR, earth_color); // Couleur blanche spéculaire
    glMaterialf(GL_FRONT, GL_SHININESS, 20); // Faible brillance
    glScalef(scale, scale, scale); // On met la sphère à l'échelle

    // Points
    glVertexPointer(3, GL_FLOAT, 0, model.vertexPositions);

    // Vecteurs normaux
    glNormalPointer(GL_FLOAT, 0, model.vertexNormals);

    // Points de texture
    glTexCoordPointer(2, GL_FLOAT, 0, model.texturePositions);

    // On dessine avec glDrawElements
    glDrawElements(GL_TRIANGLES, model.parts["Sphere_Sphere.001"].length, GL_UNSIGNED_INT, model.parts["Sphere_Sphere.001"]);  

    // On désactive ce qu'on a activé
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
    glDisableClientState(GL_TEXTURE_COORD_ARRAY);
    glDisable(GL_TEXTURE_2D);
}

function draw_stars() {
    // On donne les spécificités de toutes les étoiles
    glMaterialfv(GL_FRONT, GL_EMISSION, [1.0, 1.0, 1.0, 1.0]); // Couleur d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur ambiante ou diffuse
    glMaterialfv(GL_FRONT, GL_SPECULAR, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur spéculaire
    glPointSize(star_size);
    glBegin(GL_POINTS);
    for(i = 0; i < n_stars; i++) {
        glVertex3f(stars["x"][i], stars["y"][i], stars["z"][i]);
    }
    glEnd();
}

function draw_orbit(color){
    // L'orbite doit être illuminé même sans lumière, on lui donne donc une couleur d'émission
    glMaterialfv(GL_FRONT, GL_EMISSION, color); // Couleur d'émission blanche
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur ambiante ou diffuse
    glMaterialfv(GL_FRONT, GL_SPECULAR, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur spéculaire
    glBegin(GL_LINE_LOOP);
    for (var i = 0; i <= orbit_n_segments; i++) {
        var angle = 2*Math.PI/orbit_n_segments * i; // i 16ième d'une cercle
        var x = Math.cos(angle);
        var y = Math.sin(angle);
        glVertex3f(x, y, 0); // Sommet sur le contour supérieur
    }
    glEnd();

}

function draw_satellite(position, scale){
    // On active ce qu'il nous faut activer
    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_NORMAL_ARRAY);
    
    // Différentes valeurs utilisées pour la translation et rotation du satellite
    let TranslateSatelliteX = position[0] + 1/8 * Math.cos(satellite_orbit_angle); 
    let TranslateSatelliteY = position[1] + 1/8 * Math.sin(satellite_orbit_angle); 
    let TranslateSatelliteZ = position[2]; 
    let rotateSatellite = satellite_orbit_angle*360/(2*Math.PI);

    // On effectue la translation, la rotation, ainsi que la mise à l'échelle du satellite
    glTranslatef(TranslateSatelliteX, TranslateSatelliteY, TranslateSatelliteZ);
    glScalef(scale, scale, scale);
    glRotatef(rotateSatellite, 0.0, 0.0, 1.0);

    // Points du satellite
    glVertexPointer(3, GL_FLOAT, 0, satelliteIFS.vertexPositions);

    // Vecteurs normaux du satellite
    glNormalPointer(GL_FLOAT, 0, satelliteIFS.vertexNormals);  

    // On définit les propriétés des parties du satellite à dessiner (corps, antenne, coupole et joints)
    glMaterialfv(GL_FRONT, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, satellite_color); // Couleur du satellite, gris métallique
    glMaterialfv(GL_FRONT, GL_SPECULAR, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur speculaire pour ses composants du satellite
    glMaterialf(GL_FRONT, GL_SHININESS, 50); // Faible/Moyenne brillance pour ses composants du satellite     

    // On dessine tout sauf les panneaux solaires avec glDrawElements
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts["Antenne"].length, GL_UNSIGNED_INT, satelliteIFS.parts["Antenne"]);    
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts["Coupole"].length, GL_UNSIGNED_INT, satelliteIFS.parts["Coupole"]);    
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts["Joints"].length, GL_UNSIGNED_INT, satelliteIFS.parts["Joints"]);    
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts["Corps"].length, GL_UNSIGNED_INT, satelliteIFS.parts["Corps"]);    
    
    // On définit les propriétés des parties du satellite à dessiner (panneaux solaires)
    glMaterialfv(GL_FRONT, GL_EMISSION, [0.0, 0.0, 0.0, 1.0]); // Aucune couleur d'émission
    glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, solar_pannel_color); // Couleur des panneaux solaires, bleu foncé
    glMaterialfv(GL_FRONT, GL_SPECULAR, [1.0, 1.0, 1.0, 1.0]); // Effet spéculaire blanche des panneaux
    glMaterialf(GL_FRONT, GL_SHININESS, 255); // Haute brillance des panneaux solaires
    
    // On dessine les panneaux solaires avec glDrawElements
    glDrawElements(GL_TRIANGLES, satelliteIFS.parts["PanneauxSolaires"].length, GL_UNSIGNED_INT, satelliteIFS.parts["PanneauxSolaires"]);    
    
    // On désactive ce qu'on a activé
    glDisableClientState(GL_VERTEX_ARRAY);
    glDisableClientState(GL_NORMAL_ARRAY);
}

function draw() {
    // Fonction principale pour dessiner la scène complète
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    camera.apply();
    
    // On gère la lumière
    glEnable(GL_LIGHT0);
    glLightfv(GL_LIGHT0, GL_AMBIENT, [1.0, 1.0, 1.0, 1.0]);
    glLightfv(GL_LIGHT0, GL_DIFFUSE, [1.0, 1.0, 1.0, 1.0]);
    glLightfv(GL_LIGHT0, GL_SPECULAR, [1.0, 1.0, 1.0, 1.0]);
    
    // On veut une lumière directionnelle qui éclaire le côté de la terre face au soleil
    glLightfv(GL_LIGHT0, GL_POSITION, [-1.0, 0.0, 0.0]);

    // ===============
    // DESSIN
    // ===============
    // Enfin, on dessiner les étoiles
    glPushMatrix();
    draw_stars();
    glPopMatrix();
    
    // On commence par l'orbite de la Terre
    glPushMatrix();
    draw_orbit([1.0, 1.0, 1.0, 1.0]);
    glPopMatrix();
    
    // On dessine le soleil
    glPushMatrix();
    draw_sun(sphereIFS, 0.2);
    glPopMatrix();
    
    // On dessine la terre
    glPushMatrix();
    glTranslatef(Math.cos(orbit_angle), Math.sin(orbit_angle), 0.0);
    glRotatef(90.0, 1.0, 0.0, 0.0);
    draw_earth(sphereIFS, 0.1);
    glPopMatrix();
    
    // On dessine le satellite
    glPushMatrix();
    draw_satellite([1.3 * Math.cos(orbit_angle), 1.3 * Math.sin(orbit_angle), 0.0], 0.025);
    glPopMatrix();

    // On dessine les points de Lagrange
    // Rouge : 0°, distance de 0.5 du soleil
    glPushMatrix();

    draw_pyramid(pyramidIFS, [0.7 * Math.cos(orbit_angle), 0.7 * Math.sin(orbit_angle), 0.0], 1.0 / 50.0, [1.0, 0.0, 0.0, 1.0]);
    glPopMatrix();
    
    // Vert : 0°, distance de 1.5 du soleil
    glPushMatrix();
    draw_pyramid(pyramidIFS, [1.3 * Math.cos(orbit_angle), 1.3 * Math.sin(orbit_angle), 0.0], 1.0 / 50.0, [0.0, 1.0, 0.0, 1.0]);
    glPopMatrix();
    
    // Bleu : 180°, distance de 1 du soleil
    glPushMatrix();
    draw_pyramid(pyramidIFS, [-1.0 * Math.cos(orbit_angle), -Math.sin(orbit_angle) , 0.0], 1.0 / 50.0, [0.0, 0.0, 1.0, 1.0]);
    glPopMatrix();
    
    // Jaune : 60°, distance de 1 du soleil
    glPushMatrix();
    draw_pyramid(pyramidIFS, [Math.cos(orbit_angle + Math.PI / 3), Math.sin(orbit_angle + Math.PI / 3), 0.0], 1.0 / 50.0, [1.0, 1.0, 0.0, 1.0]);
    glPopMatrix();
    
    // Cyan : -60° distance de 1 du soleil
    glPushMatrix();
    draw_pyramid(pyramidIFS, [Math.cos(orbit_angle - Math.PI / 3), Math.sin(orbit_angle - Math.PI / 3), 0.0], 1.0 / 50.0, [0.0, 1.0, 1.0, 1.0]);
    glPopMatrix();
    
    // On dessine l'orbite du point de Lagrange L2
    glPushMatrix();
    glTranslatef(1.3 * Math.cos(orbit_angle), 1.3 * Math.sin(orbit_angle), 0.0);
    glScalef(1.0/8.0, 1.0/8.0, 1.0/8.0);
    draw_orbit([0.0, 1.0, 0.0, 0.0]);
    glPopMatrix();
    
    last_render = Date.now();
}

function update() {
    // Fonction pour animer la scène 3D

    // Temps depuis le dernier dessin
    let dt = Date.now() - last_render; // ms

    orbit_angle += (dt*0.001 * 2 * Math.PI)/orbit_duration; // rotation de la terre et des points de lagrange autour du soleil
    satellite_orbit_angle += (dt*0.001 * 2 * Math.PI)/satellite_orbit_duration; // rotation sur satellite
    planete_tx += dt*0.001/planete_day_duration; // translation de la texture de la terre pour simuler la rotation

    draw();
    requestAnimationFrame(update);
}

function init() {
    try {
        glsimUse("canvas");
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML="<p><b>Sorry, an error occurred:<br>" +
            e + "</b></p>";
        return;
    }

    // États d'OpenGL à activer
    glEnable(GL_POINT_SMOOTH);
    glEnable(GL_LIGHTING);
    glEnable(GL_NORMALIZE);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_COLOR_MATERIAL);

    glClearColor(0,0,0,1);
    
    // Caméra
    camera = new Camera();
    camera.setScale(0.75);
    camera.lookAt(0,1,5);

    // Création d'une pyramide
    pyramidIFS = generate_pyramid_IFS();

    // Création du modèle IFS pour la planète et le soleil (sphère).
    sphereIFS = loadOBJFile(fichier_sphere);

    // Création du modèle pour le télescope James-Webbs
    satelliteIFS = loadOBJFile(fichier_satellite); 
    
    // Génération d'étoiles
    generate_randomStars();

    // Importation de la texture pour la Terre
    image = new Image();
    image.src = fichier_texture;

    // Pour l'interactivité avec la souris.
    camera.installTrackball(draw);

    // Premier appel de update()
    update();
}