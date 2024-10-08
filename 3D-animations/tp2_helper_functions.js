function loadOBJFile(url){
    let result = null;
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }

    // Parsing the file
    lines = result.split("\n"); // Split into lines

    // Split into models
    let models = [];
    let name = null;
    let faces = [];
    let smoothShading;
    let all_vertices = [];
    let all_textures = [];
    let all_normals = [];

    // Process all lines of the .obj file
    for (let i = 0; i < lines.length; i++){
        line = lines[i];
        if (line.startsWith("#") || line.startsWith("mtllib")) {
            continue;
        } else if (line.startsWith("o")) { // This is a new objects
            // First check if an object already exists
            if (name !== null ) { // Adding to the model
                model = {
                    name: name,
                    faces: faces,
                    smoothShading: smoothShading
                }
                models.push(model);
            }

            // adding a custom fourth point if a triangle is given.
            // in face, the values vertex, texture, normal are given

            name = line.replace("o ", "");
            name = name.trim();
            name = name.replace("\r", "");
            faces = [];
        } else if (line.startsWith("v ")){ // This is a vertex
            vertex = line.replace("v ", "");
            vertex = vertex.split(" ");
            for (let j = 0; j < vertex.length; j++){
                vertex[j] = parseFloat(vertex[j])
            }
            all_vertices.push(vertex);
        }
        else if (line.startsWith("vt ")){ // This is a texture coordinates
            texture = line.replace("vt ", "");
            texture = texture.split(" ");
            for (let j = 0; j < texture.length; j++){
                texture[j] = parseFloat(texture[j])
            }
            all_textures.push(texture);
        } else if (line.startsWith("vn ")){ // This is a normal vector
            normal = line.replace("vn ", "");
            normal = normal.split(" ");
            for (let j = 0; j < normal.length; j++){
                normal[j] = parseFloat(normal[j])
            }
            all_normals.push(normal);
        } else if (line.startsWith("f ")){ // This is a face, giving pairs of v/vt/vn for each vertex of the face.
            face = line.replace("f ", "")
            face = face.split(" ")
            let vertex_indices = [];
            let texture_indices = [];
            let normal_indices = [];
            for (let j =0; j < face.length; j++ ) {
                vertex = face[j].split("/")
                vertex_indices.push(parseInt(vertex[0]));
                texture_indices.push(parseInt(vertex[1]));
                normal_indices.push(parseInt(vertex[2]));
            }
            faces.push({vertex: vertex_indices, texture: texture_indices, normal: normal_indices})
        }
        else if (line.startsWith("s ")) { // smooth shading flag
            smoothShading = line.replace("s ", "");
        }
    }

    // add the last objet
    if (name !== null ) { // Adding to the model
        model = {
            name: name,
            faces: faces,
            smoothShading: smoothShading
        }
        models.push(model);
    }

    models.all_vertices = all_vertices;
    models.all_textures = all_textures;
    models.all_normals = all_normals;

    // Convert flat shading models to smooth shading, by duplicating vertices per face.
    let index_list = [];
    for (let i = 0; i < models.length; i++){
        let model = models[i]
        for (let j = 0; j < model.faces.length; j++){
            let v = model.faces[j].vertex;
            let n = model.faces[j].normal;
            let t = model.faces[j].texture;
            for (let k = 0; k < v.length; k++){
                let index = [v[k], n[k], t[k]];
                let foo = index_list.findIndex(e => (e[0] === index[0] && e[1] === index[1] && e[2] === index[2]));
                if (foo === -1){ // Not found, adding to the list
                    index_list.push(index)
                }
            }
        }
    }

    // Adding missing vertices and normals
    let new_vertices = [];
    let new_normals = [];
    let new_textures = [];

    for (let j=0; j < index_list.length; j++){
        new_vertices.push(models.all_vertices[index_list[j][0]-1]);
        new_normals.push(models.all_normals[index_list[j][1]-1]);
        new_textures.push(models.all_textures[index_list[j][2]-1]);
    }

    // Generating new faces ids
    let new_models = [];
    for (let i=0; i < models.length; i++) {
        let new_faces = [];
        let model = models[i];
        for (let j = 0; j < model.faces.length; j++) {
            let vertex = model.faces[j].vertex;
            let normal = model.faces[j].normal;
            let texture = model.faces[j].texture;
            let new_vertex = []
            let new_normal = []
            let new_texture = []
            for (let k = 0; k < vertex.length; k++) {
                let index = [vertex[k], normal[k], texture[k]];
                let foo = index_list.findIndex(e => (e[0] === index[0] && e[1] === index[1] && e[2] === index[2]));
                new_vertex.push(foo + 1)
                new_normal.push(foo + 1)
                new_texture.push(foo + 1)
            }
            new_faces.push({vertex: new_vertex, normal: new_normal, texture: new_texture})
        }
        model.faces = new_faces;
        new_models.push(model);
    }
    new_models.all_vertices = new_vertices;
    new_models.all_normals = new_normals;
    new_models.all_textures = new_textures

    // Convert models to IFS

    // Create vertex position array
    vertexPositions = [];
    for (let i = 0; i < new_models.all_vertices.length; i++){
        vertexPositions.push(...new_models.all_vertices[i])
    }

    // Create normal position array
    vertexNormals = [];
    for (let i = 0; i < new_models.all_normals.length; i++){
        vertexNormals.push(...new_models.all_normals[i])
    }

    // Create texture position array
    texturePositions = [];
    for (let i = 0; i < new_models.all_textures.length; i++){
        texturePositions.push(...new_models.all_textures[i])
    }

    // Create parts indices list
    parts = {};
    for (let i = 0; i < new_models.length; i++) {
        model = new_models[i];
        face_list = []
        for (let j = 0; j < model.faces.length; j++){
            vertex = model.faces[j].vertex;
            for (let k = 0; k < vertex.length; k++){
                vertex[k] = vertex[k] - 1;
            }
            face_list.push(...vertex)
        }
        parts[model.name] = face_list;
    }

    modelsIFS = {vertexPositions: vertexPositions,
                 vertexNormals: vertexNormals,
                 texturePositions: texturePositions,
                 parts: parts,
                 loaded: true}
    return modelsIFS;
}