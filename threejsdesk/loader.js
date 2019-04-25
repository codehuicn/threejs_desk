// 设置导入功能
ThreejsDesk.prototype.setupLoader = function () {
    this.loader = {};

    this.setImport();

    var point = new THREE.Vector3(-40, 0, 0);
    this.getDaeLoader( this.daePath[0], point );

    var point = new THREE.Vector3(-20, 0, 20);
    this.getDaeLoader( this.daePath[1], point );
    
    var point = new THREE.Vector3(10, 0, 0);
    this.getDaeLoader( this.daePath[2], point );

    var point = new THREE.Vector3(30, 0, 0);
    this.getDaeLoader( this.daePath[3], point );

    var point = new THREE.Vector3(50, 0, 0);
    this.getDaeLoader( this.daePath[4], point );

    var point = new THREE.Vector3(70, 0, 0);
    this.getDaeLoader( this.daePath[5], point );

    var point = new THREE.Vector3(90, 0, 0);
    this.getDaeLoader( this.daePath[6], point );

    var point = new THREE.Vector3(0, 0, 10);
    this.getBox(point);

}

// 设置导入文件
ThreejsDesk.prototype.setImport = function () {
    if ( this.opts.$import === null ) return;

    var that = this;
    that.$form = $('<form/>').hide();
    $('body').append(that.$form);

    var $input = $('<input/>').attr('type', 'file');
    $input.on('change', function (e) {
        that.loadFile( $input[0].files[0] );
        that.$form[0].reset();
    })
   
    that.$form.append( $input );

    that.opts.$import.on('click', function () {
        that.$form.find('input').trigger('click');
    }).parent().hover(function(){
        that.objectActiveLock = true;
    }, function(){
        that.objectActiveLock = false;
    })
}

// 加载文件
ThreejsDesk.prototype.loadFile = function (file) {
    var that = this, filesArr = this.opts.filesArr, fileCurrent = filesArr[filesArr.length];
    
    fileCurrent = {};
    fileCurrent.filename = file.name;
    fileCurrent.extension = fileCurrent.filename.split( '.' ).pop().toLowerCase();
    var filename = fileCurrent.filename,
        extension = fileCurrent.extension;

    var reader = new FileReader();
    reader.addEventListener( 'progress', function ( event ) {
        fileCurrent.size = '(' + Math.floor( event.total / 1000 ).toFixed(2) + ' KB)';
        fileCurrent.progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';
        console.log( 'Loading', fileCurrent.filename, fileCurrent.size, fileCurrent.progress );
    } );

    switch ( extension ) {
        case '3ds':
            reader.addEventListener( 'load', function ( event ) {
                var loader = new THREE.TDSLoader();
                var object = loader.parse( event.target.result );
                that.loadObject(object, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'amf':
            reader.addEventListener( 'load', function ( event ) {
                var loader = new THREE.AMFLoader();
                var amfobject = loader.parse( event.target.result );
                that.loadObject(amfobject, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'awd':
            reader.addEventListener( 'load', function ( event ) {
                var loader = new THREE.AWDLoader();
                var scene = loader.parse( event.target.result );
                that.loadObject(scene, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'babylon':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var json = JSON.parse( contents );
                var loader = new THREE.BabylonLoader();
                var scene = loader.parse( json );
                that.loadObject(scene, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'babylonmeshdata':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var json = JSON.parse( contents );

                var loader = new THREE.BabylonLoader();

                var geometry = loader.parseGeometry( json );
                var material = new THREE.MeshStandardMaterial();

                var mesh = new THREE.Mesh( geometry, material );
                that.loadObject(mesh, filename);                        
            }, false );
            reader.readAsText( file );
            break;
        case 'ctm':
            reader.addEventListener( 'load', function ( event ) {
                var data = new Uint8Array( event.target.result );
                var stream = new CTM.Stream( data );
                stream.offset = 0;
                var loader = new THREE.CTMLoader();
                loader.createModel( new CTM.File( stream ), function( geometry ) {
                    geometry.sourceType = "ctm";
                    geometry.sourceFile = file.name;
                    var material = new THREE.MeshStandardMaterial();
                    var mesh = new THREE.Mesh( geometry, material );
                    that.loadObject(mesh, filename);
                } );
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'dae':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var loader = new THREE.ColladaLoader();
                var collada = loader.parse( contents );
                that.loadObject(collada.scene, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'fbx':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var loader = new THREE.FBXLoader();
                var object = loader.parse( contents );
                that.loadObject(object, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'glb':
        case 'gltf':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var loader = new THREE.GLTFLoader();
                loader.parse( contents, '', function ( result ) {
                    that.loadObject(result.scene, filename);
                } );
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'js':
        case 'json':
        case '3geo':
        case '3mat':
        case '3obj':
        case '3scn':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;

                // 2.0
                if ( contents.indexOf( 'postMessage' ) !== - 1 ) {
                    var blob = new Blob( [ contents ], { type: 'text/javascript' } );
                    var url = URL.createObjectURL( blob );
                    var worker = new Worker( url );
                    worker.onmessage = function ( event ) {
                        event.data.metadata = { version: 2 };
                        that.handleJSON( event.data, file, filename );
                    };
                    worker.postMessage( Date.now() );
                    return;
                }

                // >= 3.0
                var data;
                try {
                    data = JSON.parse( contents );
                } catch ( error ) {
                    alert( error );
                    return;
                }
                that.handleJSON( data, file, filename );
            }, false );
            reader.readAsText( file );
            break;
        case 'kmz':
            reader.addEventListener( 'load', function ( event ) {
                var loader = new THREE.KMZLoader();
                var collada = loader.parse( event.target.result );
                that.loadObject(collada.scene, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'md2':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var geometry = new THREE.MD2Loader().parse( contents );
                var material = new THREE.MeshStandardMaterial( {
                    morphTargets: true,
                    morphNormals: true
                } );

                var mesh = new THREE.Mesh( geometry, material );
                mesh.mixer = new THREE.AnimationMixer( mesh );
                that.loadObject(mesh, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'obj':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var object = new THREE.OBJLoader().parse( contents );
                that.loadObject(object, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'playcanvas':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var json = JSON.parse( contents );

                var loader = new THREE.PlayCanvasLoader();
                var object = loader.parse( json );
                that.loadObject(object, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'ply':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;

                var geometry = new THREE.PLYLoader().parse( contents );
                geometry.sourceType = "ply";
                geometry.sourceFile = file.name;

                var material = new THREE.MeshStandardMaterial();
                var mesh = new THREE.Mesh( geometry, material );
                that.loadObject(mesh, filename);
            }, false );
            reader.readAsArrayBuffer( file );
            break;
        case 'stl':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;

                var geometry = new THREE.STLLoader().parse( contents );
                geometry.sourceType = "stl";
                geometry.sourceFile = file.name;

                var material = new THREE.MeshStandardMaterial();
                var mesh = new THREE.Mesh( geometry, material );
                that.loadObject(mesh, filename);
            }, false );
            if ( reader.readAsBinaryString !== undefined ) {
                reader.readAsBinaryString( file );
            } else {
                reader.readAsArrayBuffer( file );
            }
            break;
        case 'vtk':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;

                var geometry = new THREE.VTKLoader().parse( contents );
                geometry.sourceType = "vtk";
                geometry.sourceFile = file.name;

                var material = new THREE.MeshStandardMaterial();
                var mesh = new THREE.Mesh( geometry, material );
                that.loadObject(mesh, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'wrl':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var result = new THREE.VRMLLoader().parse( contents );
                that.loadObject(result, filename);
            }, false );
            reader.readAsText( file );
            break;
        case 'zip':
            reader.addEventListener( 'load', function ( event ) {
                var contents = event.target.result;
                var zip = new JSZip( contents );

                // BLOCKS
                if ( zip.files[ 'model.obj' ] && zip.files[ 'materials.mtl' ] ) {
                    var materials = new THREE.MTLLoader().parse( zip.file( 'materials.mtl' ).asText() );
                    var object = new THREE.OBJLoader().setMaterials( materials ).parse( zip.file( 'model.obj' ).asText() );
                    that.loadObject(object, filename);
                }
            }, false );
            reader.readAsBinaryString( file );
            break;
        default:
            alert( 'Unsupported file format (' + extension +  ').' );
            break;
    }
}

// 加载一个模型
ThreejsDesk.prototype.loadOne = function ( obj ) {
    var objNew;

    if (obj.children.length > 0 && obj.userData.merge) {
        if (obj.userData.baseLayerInit) {
            var objChild, objChildNew, pos;
            for (var j = 0, jl = obj.children.length; j < jl; j++) {
                objChild = obj.children[0];
                objChildNew = this.mergeByBufferGeometry([objChild]);
                if ( objChildNew ) {
                    objChildNew.name = objChild.name;
                    $.extend(objChildNew.userData, objChild.userData);
                    objChildNew.material.color.setHex(0xffffff);
                    objChildNew.userData.type = 'mesh';
    
                    pos = objChildNew.position;
                    pos = new THREE.Vector3(pos.x, pos.y, pos.z);
                    obj.worldToLocal(pos);
                    obj.add(objChildNew);
                    objChildNew.position.set(pos.x, pos.y, pos.z);
                    obj.remove(objChild);
                }
            }
        } else {
            objNew = this.mergeByBufferGeometry([obj]);
            if ( objNew ) {
                objNew.name = obj.name;
                $.extend(objNew.userData, obj.userData);
                objNew.material.color.setHex(0xffffff);
                this.resetObjCenter(objNew);
                obj = objNew;
                obj.userData.type = 'mesh';
            }
        }
    }

    this.setObjData( obj );
    this.resetLabelObject( obj );
    this.setUserData( obj );

    this.scene.add( obj ); 
    // this.activeObjects.push(obj); 

    if (obj.userData.objsMatrix) {
        this.createObjByMatrix(obj);
    }
}

// 加载对象
ThreejsDesk.prototype.loadObject = function (object, name) {  
    if ( object.userData.type === 'group' ) { 
        var obj;
        this.activeObjects = []; 
        for ( var i = 0, il = object.children.length; i < il; i++ ) {
            obj = object.children[i].clone(true);
            this.loadOne(obj);
        }
        this.objectActiveLock = false;
        this.showObjectActive();
        object = undefined;
    } else if (object.type === 'Scene') {
        this.scene = object;
        $('.' + this.opts.labelElementClass).parent().html('');
        for ( var i = 0, il = object.children.length; i < il; i++ ) {
            this.resetLabelObject( object.children[i] );
            this.setUserData( object.children[i] );
        }
        
        // 重新创建，在导入后已经丢失
        this.selectionBoxs = [];
        this.transControls = [];
        this.getAxes();
        this.getGrid();
    } else {
        if ( name ) object.name = name;  
        if ( object.name !== 'elf.dae' && object.name !== 'stormtrooper.dae' ) object.userData.merge = true;
        
        this.loadOne(object);
        // this.objectActiveLock = false;
        // this.showObjectActive();
    }
}

// 加载文件，处理 json 
ThreejsDesk.prototype.handleJSON = function ( data, file, filename ) {
    var that = this;
    if ( data.metadata === undefined ) { // 2.0
        data.metadata = { type: 'Geometry' };
    }
    if ( data.metadata.type === undefined ) { // 3.0
        data.metadata.type = 'Geometry';
    }
    if ( data.metadata.formatVersion !== undefined ) {
        data.metadata.version = data.metadata.formatVersion;
    }

    switch ( data.metadata.type.toLowerCase() ) {
        case 'buffergeometry':
            var loader = new THREE.BufferGeometryLoader();
            var result = loader.parse( data );
            var mesh = new THREE.Mesh( result );
            that.loadObject(mesh, filename);
            break;
        case 'geometry':
            var loader = new THREE.JSONLoader();
            var result = loader.parse( data );

            var geometry = result.geometry;
            var material;

            if ( result.materials !== undefined ) {
                if ( result.materials.length > 1 ) {
                    material = new THREE.MultiMaterial( result.materials );
                } else {
                    material = result.materials[ 0 ];
                }
            } else {
                material = new THREE.MeshStandardMaterial();
            }

            geometry.sourceType = "ascii";
            geometry.sourceFile = file.name;

            var mesh;
            if ( geometry.animation && geometry.animation.hierarchy ) {
                mesh = new THREE.SkinnedMesh( geometry, material );
            } else {
                mesh = new THREE.Mesh( geometry, material );
            }

            that.loadObject(mesh, filename);
            break;
        case 'object':
            var loader = new THREE.ObjectLoader();
            var result = loader.parse( data );
            that.loadObject(result, filename);
            break;
        case 'app':
            break;
    }
}

// 加载 dae 文件
ThreejsDesk.prototype.getDaeLoader = function (path, point) {
    var that = this;

    that.daeLoader = new THREE.ColladaLoader();
    that.daeLoader.load( path, function ( collada ) {
        if ( point ) {
            collada.scene.position.x = point.x; 
            collada.scene.position.y = point.y; 
            collada.scene.position.z = point.z; 
        }
        collada.scene.name = path.match(/\/[^\/]+\.\w+/g)[0].slice(1);

        // that.scene.add( collada.scene ); 
        // that.setUserData( collada.scene );

        // that.addObjectLabel( collada.scene, that.opts.getLabelHtml(
        //     collada.scene.name
        // ) );

        that.loadObject( collada.scene );

        // that.addSpriteText( collada.scene, collada.scene.name );        
    }, function (xhr) {
        // console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    }, function (error) {
        console.error( error );
    });         
}

// 创建盒子
ThreejsDesk.prototype.getBox = function (point) {
    var texture = new THREE.TextureLoader().load( './elf_dae/Body_tex_003.jpg' );

    var boxGeometry = new THREE.BoxGeometry(4, 4, 4);
    var boxMaterial = new THREE.MeshLambertMaterial({
        color: 0x339933,
        // colorWrite: false,
        map: texture,
        // emissive: 0xff9999,
        // emissiveIntensity: 1,
        // emissiveMap: texture,
        // transparent: true,
        // opacity: 0.6
    });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);

    if (point) {
        box.position.x = point.x;
        box.position.y = point.y;
        box.position.z = point.z;
    }
    box.name = 'box';
    
    this.scene.add(box);
    this.setUserData(box, {type: 'mesh'});

    // this.addObjectLabel( box, this.opts.getLabelHtml('box') );
}

// 设置模型信息
ThreejsDesk.prototype.setUserData = function (obj, opt) {
    obj.userData.enablePick = true;
    obj.userData.enableExport = true;
    if ( ! obj.userData.type && obj.type === 'Group' ) obj.userData.type = 'dae';
    if ( opt ) $.extend(obj.userData, opt);
}

// 获取一个有标准层的楼栋
// 分类：标准层 baseLayer ，其它层 otherLayer ；
// 索引：第一个标准层 0 ，从 0 开始；其它层不加索引；
// 名称：标准层分类加索引；其它层为分类；
// 标准层数量：楼栋上 baseLayerNum
// 标准层备份：索引为空；
ThreejsDesk.prototype.getBuildingWithBase = function ( name, num ) {
    var obj = this.scene.getObjectByName(name), objLabel, 
        baseObj, buildingObj, yBase, yData, box;

    objLabel = obj.getObjectByName(obj.name + '_label');
    obj.remove(objLabel);
    baseObj = obj.clone(true);
    this.scene.remove(obj);  // 删除原始标准层

    buildingObj = new THREE.Group();
    buildingObj.add(baseObj);
    baseObj.visible = false;
    baseObj.name = 'baseLayer';
    baseObj.userData.class = 'baseLayer';
    baseObj.userData.index = '';
    buildingObj.userData.baseLayerNum = 0;

    this.setUserData( buildingObj, {type: 'dae'} );
    this.addObjectLabel( buildingObj, this.opts.getLabelHtml('我有标准层') );
    buildingObj.name = '我有标准层';
    this.scene.add( buildingObj );

    if (num < 1) return;
    box = new THREE.Box3();
    box.setFromObject(baseObj);
    yBase = box.max.y - box.min.y;
    yData = 0;

    for (var i = 0; i < num; i++) {
        baseObj = baseObj.clone(true);
        buildingObj.add(baseObj);
        buildingObj.userData.baseLayerNum += 1;
        baseObj.visible = true;
        baseObj.translateZ(i === 0 ? 0 : yBase);
        baseObj.name = 'baseLayer' + i;
        baseObj.userData.index = i;
    }
}