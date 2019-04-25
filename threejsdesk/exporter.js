// 设置导出
ThreejsDesk.prototype.setupExporter = function () {
    this.setExportJson();
    // this.getGltfExporter();
}

// 导出模型， json
ThreejsDesk.prototype.setExportJson = function () {
    var that = this;

    if ( that.opts.$exportObj !== null ) {
        that.opts.$exportObj.on('click', function () {
            if ( that.activeObjects.length < 1 ) {
                console.error('没有选择模型，无法导出模型');
            } else {
                that.exportJson(that.activeObjects);
            }
        })
    }
    
    if ( that.opts.$exportScene !== null ) {
        that.opts.$exportScene.on('click', function () {
            that.exportSceneJson();
        })
    }
}

// 导出 json
ThreejsDesk.prototype.exportJson = function (objs) {
    if (objs.length < 1) {
        console.error('没有选择模型，无法导出模型');
        return;
    }

    var group = new THREE.Group(), name = '', that = this, obj, objl;
    group.userData.type = 'group';

    for (var i = 0, il = objs.length; i < il; i++) {
        if ( objs[i].userData.enableExport ) {
            that.saveLabelData( objs[i] );

            objl = objs[i].getObjectByName(objs[i].name + '_label');
            objs[i].remove(objl);  
            obj = objs[i].clone(true);
            objs[i].add(objl);

            group.add( obj ); 
        }
    }  

    if (group.children.length === 0) {
        name = '空的模型';
    } else if (group.children.length === 1) {
        name = group.children[0].name;
    } else {
        name = group.children[0].name + '等' + group.children.length + '个模型';
    }

    var output = group.toJSON();  
    try {
        output = JSON.stringify( output, that.parseNumber, '\t' );
        output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
    } catch ( e ) {
        output = JSON.stringify( output );
    } 
    that.saveJson( output, name + '.json' );
}

// 导出场景 json
ThreejsDesk.prototype.exportSceneJson = function () {
    var that = this, obj, objl;

    for (var i = 0, il = that.scene.children.length; i < il; i++) {
        obj = that.scene.children[i];
        that.saveLabelData( obj );
    }  
    for (var i = 0, il = that.selectionBoxs.length; i < il; i++) {
        that.scene.remove(that.selectionBoxs[i]);
    }
    that.selectionBoxs = [];
    for (var i = 0, il = that.transControls.length; i < il; i++) {
        that.scene.remove(that.transControls[i]);
    }
    that.transControls = [];
    that.scene.remove(that.axes);
    that.scene.remove(that.grid);

    var output = that.scene.toJSON();  
    that.getAxes();
    that.getGrid();

    try {
        output = JSON.stringify( output, that.parseNumber, '\t' );
        output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
    } catch ( e ) {
        output = JSON.stringify( output );
    } 
    that.saveJson( output, 'scene.json' );
}

// 保存 json 文件
ThreejsDesk.prototype.saveJson = function ( output, name ) {
    var $a = $('<a/>').appendTo($('body'));
    
    $a.attr( 'href', URL.createObjectURL( new Blob( [ output ], { type: 'text/plain' } ) ) );
    $a.attr( 'download', name || 'data.json' );
    $a[0].click();
}

// 导出 gltf ，只支持导出 StandardMaterial ，dae 格式导入的模型无法使用，缺少属性
ThreejsDesk.prototype.getGltfExporter = function () {
    var that = this;

    that.gltfExporter = new THREE.GLTFExporter();
    that.gltfExporter.parse( that.scene, function ( gltf ) {
        console.log( gltf );               
    }, {
        onlyVisible: true,
        truncateDrawRange: true,
        // animations: [AnimationClip],
    } );
}               
