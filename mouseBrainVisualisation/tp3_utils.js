// Le CCF du Allen est en micron. 
// Dimension x : 13200 micron
// Dimension y : 8000 micron
// Dimension z : 11200 micron
var nx = 13200;
var ny = 8000;
var nz = 11200;
var factor = Math.max(nx,ny,nz);

function loadBrain(url){
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }
    
    // Parsing the file
    var lines = result.split("\n"); // Split into lines

    // Split into models
    var faces = [];
    var all_vertices = [];
    var all_normals = [];
    for (var i = 0; i < lines.length; i++){
        var line = lines[i];
        if (line.startsWith("v ")){ // This is a vertex
            var vertex = line.replace("v ", "");
            vertex = vertex.split(" ");
            for (var j = 0; j < vertex.length; j++){
                vertex[j] = parseFloat(vertex[j])
            }
            all_vertices.push(vertex);
        } else if (line.startsWith("vn ")){ // This is a normal vector
            var normal = line.replace("vn ", "");
            normal = normal.split(" ");
            for (var j = 0; j < normal.length; j++){
                normal[j] = parseFloat(normal[j])
            }
            all_normals.push(normal);
        } else if (line.startsWith("f ")){ // This is a face, giving pairs of v/vt/vn for each vertex of the face.
            var face = line.replace("f ", "")
            face = face.trim().split(" ")
            var vertex_indices = [];
            var texture_indices = [];
            var normal_indices = [];
            for (var j =0; j < face.length; j++ ) {
                vertex = face[j].split("/")
                vertex_indices.push(parseInt(vertex[0])-1);
                texture_indices.push(parseInt(vertex[1]));
                normal_indices.push(parseInt(vertex[2])-1);
            }
            faces.push(vertex_indices)
        }
    }

    // Normalize
    for (var i = 0; i < all_vertices.length; i++){
        all_vertices[i][0] = (all_vertices[i][0] - nx / 2) / factor * 2
        all_vertices[i][1] = (all_vertices[i][1] - ny / 2) / factor * 2
        all_vertices[i][2] = (all_vertices[i][2] - nz / 2) / factor * 2
    }

    var modelsIFS = {vertexPositions: all_vertices, faces: faces}
    return modelsIFS;
}

function loadInjection(url){
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }
    
    // Parsing the file
    var lines = result.split("\n"); // Split into lines

    // Split into models
    var faces = [];
    var all_vertices = [];
    var all_normals = [];
    for (var i = 0; i < lines.length; i++){
        var line = lines[i];
        if (line.startsWith("v ")){ // This is a vertex
            var vertex = line.replace("v ", "");
            vertex = vertex.split(" ");
            for (var j = 0; j < vertex.length; j++){
                vertex[j] = parseFloat(vertex[j])
            }
            all_vertices.push(vertex);
        } else if (line.startsWith("vn ")){ // This is a normal vector
            var normal = line.replace("vn ", "");
            normal = normal.split(" ");
            for (var j = 0; j < normal.length; j++){
                normal[j] = parseFloat(normal[j])
            }
            all_normals.push(normal);
        } else if (line.startsWith("f ")){ // This is a face, giving pairs of v/vt/vn for each vertex of the face.
            var face = line.replace("f ", "")
            face = face.trim().split(" ")
            var vertex_indices = [];
            var texture_indices = [];
            var normal_indices = [];
            for (var j =0; j < face.length; j++ ) {
                vertex = face[j].split("/")
                vertex_indices.push(parseInt(vertex[0])-1);
                texture_indices.push(parseInt(vertex[1]));
                normal_indices.push(parseInt(vertex[2])-1);
            }
            faces.push(vertex_indices)
        }
    }

    // Normalize
    for (var i = 0; i < all_vertices.length; i++){
        all_vertices[i][0] = (all_vertices[i][0] - nx/2) / factor * 2
        all_vertices[i][1] = (all_vertices[i][1] - ny/2) / factor * 2
        all_vertices[i][2] = (all_vertices[i][2] - nz/2) / factor * 2
    }

    var modelsIFS = {vertexPositions: all_vertices, faces: faces}
    return modelsIFS;
}

function loadStreamlines(url) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }

    var foo = JSON.parse(result)

    // Normalize the streamline positions
    var cx=0;
    var cy=0;
    var cz=0;
    var pos_min = Infinity;
    var pos_max = -Infinity;
    var xmin = Infinity;
    var ymin = Infinity;
    var zmin = Infinity;
    var xmax = -Infinity;
    var ymax = -Infinity;
    var zmax = -Infinity;

    // Number of points
    var nPoints = 0
    for (var i = 0; i < foo.lines.length; i++){
        nPoints += foo.lines[0].length;
    }

    for (var i = 0; i < foo.lines.length; i++){
        for (var j = 0; j < foo.lines[i].length; j++){
            var x = foo.lines[i][j].x;
            var y = foo.lines[i][j].y;
            var z = foo.lines[i][j].z;

            cx += x/nPoints;
            cy += y/nPoints;
            cz += z/nPoints;

            if (x > xmax){
                xmax = x;
            }
            if (x < xmin){
                xmin = x;
            }
            
            if (y > ymax){
                ymax = y;
            }
            if (y < ymin){
                ymin = y;
            }
            
            if (z > zmax){
                zmax = z;
            }
            if (z < zmin){
                zmin = z;
            }
        }
    }

    cx = (xmin + xmax)/2;
    cy = (ymin + ymax)/2;
    cz = (zmin + zmax)/2;
    var ratio = Math.max(xmax-xmin,ymax-ymin,zmax-zmin);

    var streamlines = []
    for (var i = 0; i < foo.lines.length; i++){
        var line = []
        for (var j=0; j < foo.lines[i].length; j++){
            line.push({x: (foo.lines[i][j].x - nx/2) / factor * 2,
                       y: (foo.lines[i][j].y - ny/2) / factor * 2,
                       z: (foo.lines[i][j].z - nz/2) / factor * 2})
        }
        streamlines.push(line)
    }

    return streamlines
}