// 导入模型，dae/json/... ，格式和官方一致
// 编辑模型，translate/rotate/scale（切换：Q/W/E/R/-/+） delete 
// 导出模型，单个模型导出，场景导出，json

ThreejsDesk = function (opts) {
    var that = this;
    this.opts = {
        boxId: '',
        $box: null,
        importClass: 'import_file', 
        deleteClass: 'delete_obj',
        exportObjClass: 'export_obj',
        exportSceneClass: 'export_scene',
        fullScreenClass: 'full_screen',
        transformTypeClass: 'transform_type',
        translateValueClass: 'translate_value',
        rotateValueClass: 'rotate_value',
        scaleReferClass: 'scale_refer',
        labelValueClass: 'label_value',
        setupDataClass: 'setup_data',
        modeTypeClass: 'mode_type',
        getAreaClass: 'get_area',
        closeObjectClass: 'close_object',
        drawRoadClass: 'draw_road',
        drawWallClass: 'draw_wall',
        pickerBoxClass: 'picker_box',
        labelElementClass: 'threejsdesk-text',
        getLabelHtml: function(val) {
            return '<div class="' + that.opts.labelElementClass + '">'+val+'</div>';
        },

        boxSize: {},
        boxFull: false,
        resizeTimer: null, // 尺寸变化计时器
        filesArr: [],      // 导入的文件信息，导入进度
        numberFixed: 6,    // 导出 json 时，对数字的精度调整
        wheelDeltaY: 0,
        zoomSpeed: 1,   
    }
    $.extend(this.opts, opts);
    if ( this.opts.boxId === '' ) {
        console.error('没有指定容器');
        return null;
    }

    this.camera = null, this.scene = null, this.renderer, this.labelRenderer;

    this.raycaster = null, this.mouse = null, this.intersects = [], this.intersectBack = null;

    this.orbitControls = null, this.transControls = [], 
    this.activeObjects = [], this.objectActiveLock = false, 
    this.mode = 'pickOne'; // 单选，多选 pickMore

    this.axes = null, this.grid = null, this.lights = {}, 
    this.selectionBoxs = [];  
    
    this.$form = null;

    this.daeLoader = null, this.daePath = [
        "./building_dae/building.dae",
        "./building_base_dae/building_base.dae",
        "./elf_dae/elf.dae",
        "./stormtrooper_dae/stormtrooper.dae",
        "./dae/叠拼.dae",
        "./dae/测试1.dae",
        "./dae/高层10.dae",
    ], this.jsonPath = [
        "./dae/9#.dae",
        "./dae/34#.dae",
        "./dae/儿童活动场地.dae.dae",
        "./dae/强排户型-138.dae.dae",
        "./dae/社区主入口.dae.dae",
    ];

    this.gltfExporter = null;
    
    this.init();
}

// 初始化
ThreejsDesk.prototype.init = function () {
    var that = this;

    // 检测浏览器，是否支持 WebGL
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    that.opts.$box = $( '#' + that.opts.boxId );
    
    that.opts.$import = that.opts.$box.find( '.' + that.opts.importClass );
    that.opts.$delete = that.opts.$box.find( '.' + that.opts.deleteClass );
    that.opts.$exportObj = that.opts.$box.find( '.' + that.opts.exportObjClass );
    that.opts.$exportScene = that.opts.$box.find( '.' + that.opts.exportSceneClass );
    that.opts.$fullScreen = that.opts.$box.find( '.' + that.opts.fullScreenClass );
    that.opts.$transformType = that.opts.$box.find( '.' + that.opts.transformTypeClass );
    that.opts.$translateValue = that.opts.$box.find( '.' + that.opts.translateValueClass );
    that.opts.$rotateValue = that.opts.$box.find( '.' + that.opts.rotateValueClass );
    that.opts.$scaleRefer = that.opts.$box.find( '.' + that.opts.scaleReferClass );
    that.opts.$labelValue = that.opts.$box.find( '.' + that.opts.labelValueClass );
    that.opts.$setupData = that.opts.$box.find( '.' + that.opts.setupDataClass );
    that.opts.$modeType = that.opts.$box.find( '.' + that.opts.modeTypeClass );
    that.opts.$getArea = that.opts.$box.find( '.' + that.opts.getAreaClass );
    that.opts.$closeObject = that.opts.$box.find( '.' + that.opts.closeObjectClass );
    that.opts.$drawRoad = that.opts.$box.find( '.' + that.opts.drawRoadClass );
    that.opts.$drawWall = that.opts.$box.find( '.' + that.opts.drawWallClass );
    that.opts.$pickerBox = that.opts.$box.find( '.' + that.opts.pickerBoxClass );

    that.opts.boxSize = {
        width: that.opts.$box.width(),
        height: that.opts.$box.height()
    }

    that.camera = new THREE.PerspectiveCamera(45, that.opts.$box.innerWidth() / that.opts.$box.innerHeight(), 0.1, 2000);
    that.camera.position.set(0, 500, 0);
    
    that.scene = new THREE.Scene();
    that.scene.background = new THREE.Color(0xCCCCCC);

    that.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
    });
    that.renderer.setPixelRatio( window.devicePixelRatio );
    that.renderer.setSize( that.opts.$box.innerWidth(), that.opts.$box.innerHeight() );
    that.renderer.domElement.style.position = 'absolute';
    that.renderer.domElement.style.top = 0;
    that.opts.$box.prepend( that.renderer.domElement );   
    
    this.setupScene();
    this.setLabelLayer();

    this.setupLoader();
    this.setupExporter();

    this.setupObject();
    this.setupPicker();

    this.setLineHelper();

    this.animate();  
}


// 框选后，修改相机位置和观察区域大小，修改渲染的区域大小，获取渲染的物体，就是框选的物体
function test1() {
    var list = threejsDesk.renderer.renderLists.get(threejsDesk.scene, threejsDesk.camera).opaque;
    console.log('start>>>', list);

    var boxWidth = threejsDesk.opts.$box.width(), boxHeight = threejsDesk.opts.$box.height(),
        pickerLeft = parseFloat(threejsDesk.opts.$pickerBox.css('left')),
        pickerTop = parseFloat(threejsDesk.opts.$pickerBox.css('top')),
        pickerWidth = threejsDesk.opts.$pickerBox.width(),
        pickerHeight = threejsDesk.opts.$pickerBox.height(),
        boxCenter = new THREE.Vector2(), pickerCenter = new THREE.Vector2(), distanceCenter = 0,
        boxPos = threejsDesk.camera.position, pickerPos = new THREE.Vector3();

    boxCenter.set(boxWidth / 2, boxHeight / 2);
    pickerCenter.set(pickerLeft + pickerWidth / 2 + 2, pickerTop + pickerHeight / 2 + 2);
    distanceCenter = boxCenter.distanceTo(pickerCenter);

    // distanceCenter *= Math.tan((threejsDesk.camera.fov / 2) * Math.PI / 180.0);
    // panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
    // panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);

    // v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    //         v.multiplyScalar(-distance);
    //         panOffset.add(v);

    // v.setFromMatrixColumn(objectMatrix, 1);
    // v.multiplyScalar(distance);
    //         panOffset.add(v);

    if (pickerWidth > 0 && pickerHeight > 0) {
        // set(coords.x, coords.y, 0.5).unproject(camera)
        pickerPos.set(
            pickerCenter.x / boxWidth * 2 - 1,
            pickerCenter.y / boxHeight * 2 - 1,
            0.1
        ).unproject(threejsDesk.camera);
        
        threejsDesk.camera.position.copy(pickerPos);
        // threejsDesk.camera.lookAt(pickerPos);

        threejsDesk.camera.aspect = pickerWidth / pickerHeight;
        threejsDesk.camera.fov = 75;
        threejsDesk.camera.updateProjectionMatrix();
        threejsDesk.renderer.setSize( pickerWidth, pickerHeight );

        list = threejsDesk.renderer.renderLists.get(threejsDesk.scene, threejsDesk.camera).opaque;
        console.log('end>>>', list);
    }
    
}

// 框选后，把矩形框的顶点投影到相机，创建椎体，判断物体的网格是否在里面
function test3() {
    var boxWidth = threejsDesk.opts.$box.width(), boxHeight = threejsDesk.opts.$box.height(),
        pickerLeft = parseFloat(threejsDesk.opts.$pickerBox.css('left')),
        pickerTop = parseFloat(threejsDesk.opts.$pickerBox.css('top')),
        pickerWidth = threejsDesk.opts.$pickerBox.width(),
        pickerHeight = threejsDesk.opts.$pickerBox.height(),
        boxCenter = new THREE.Vector2(), pickerCenter = new THREE.Vector2(), distanceCenter = 0,
        boxPos = threejsDesk.camera.position, pickerPos = new THREE.Vector3();

    boxCenter.set(boxWidth / 2, boxHeight / 2);
    pickerCenter.set(pickerLeft + pickerWidth / 2 + 2, pickerTop + pickerHeight / 2 + 2);
    distanceCenter = boxCenter.distanceTo(pickerCenter);

    if (pickerWidth > 0 && pickerHeight > 0) {
        var dotTopLeft = ( new THREE.Vector3() ).set(
            pickerLeft / boxWidth * 2 - 1,
            - pickerTop / boxHeight * 2 + 1,
            0.5
        ).unproject(threejsDesk.camera);

        var dotTopRight = ( new THREE.Vector3() ).set(
            ( pickerLeft + pickerWidth ) / boxWidth * 2 - 1,
            - pickerTop / boxHeight * 2 + 1,
            0.5
        ).unproject(threejsDesk.camera);

        var dotBottomLeft = ( new THREE.Vector3() ).set(
            pickerLeft / boxWidth * 2 - 1,
            - ( pickerTop + pickerHeight ) / boxHeight * 2 + 1,
            0.5
        ).unproject(threejsDesk.camera);

        var dotCamera = threejsDesk.camera.position; 
        var dotOrigin = new THREE.Vector3(0, 0, 0);

        createBox(dotTopLeft.x, dotTopLeft.y, dotTopLeft.z, 0xff0000);
        // createBox(dotTopRight.x, dotTopRight.y, dotTopRight.z, 0x00ff00);
        // createBox(dotBottomLeft.x, dotBottomLeft.y, dotBottomLeft.z, 0x0000ff);
        createBox(dotCamera.x, dotCamera.y, dotCamera.z, 0x000000);

        var normalFront = dotTopLeft.sub(dotCamera).normalize();
        var normalTop = dotBottomLeft.sub(dotTopLeft).normalize();
        var normalLeft = dotTopRight.sub(dotTopLeft).normalize();

        // createArrow(normalFront, dotCamera, 0xff0000);
        // createArrow(normalTop, dotOrigin, 0xff0000);

        var planeFront = new THREE.Plane( normalFront, dotCamera.distanceTo(dotTopLeft) );
        var planeBack = new THREE.Plane( normalFront, -dotCamera.distanceTo(dotTopLeft) );

        var planeTop = new THREE.Plane( normalTop, dotCamera.distanceTo(dotTopLeft) );
        var planeBottom = new THREE.Plane( normalTop, dotBottomLeft.distanceTo(dotTopLeft) );

        var planeLeft = new THREE.Plane( normalLeft, 0 );
        var planeRight = new THREE.Plane( normalLeft, dotTopRight.distanceTo(dotTopLeft) );

        var helper = new THREE.PlaneHelper( planeFront, 11, 0xffff00 );
        threejsDesk.scene.add( helper );
        // var helper = new THREE.PlaneHelper( planeBack, 11, 0xffff00 );
        // threejsDesk.scene.add( helper );
        // var helper = new THREE.PlaneHelper( planeTop, 11, 0xffff00 );
        // threejsDesk.scene.add( helper );
        // var helper = new THREE.PlaneHelper( planeBottom, 11, 0xffff00 );
        // threejsDesk.scene.add( helper );
        // var helper = new THREE.PlaneHelper( planeLeft, 11, 0xffff00 );
        // threejsDesk.scene.add( helper );
        // var helper = new THREE.PlaneHelper( planeRight, 11, 0xffff00 );
        // threejsDesk.scene.add( helper );
    }
}

// 创建一个大的盒子，框选后，根据矩形框的顶点缩小盒子，获取物体
// 误差比较大，不建议使用
function test4() {
    var pickerLeft = parseFloat(threejsDesk.opts.$pickerBox.css('left')),
        pickerTop = parseFloat(threejsDesk.opts.$pickerBox.css('top')),
        pickerWidth = threejsDesk.opts.$pickerBox.width(),
        pickerHeight = threejsDesk.opts.$pickerBox.height();

    if (pickerWidth > 0 && pickerHeight > 0) {
        var dotTopLeft = {
            x: pickerLeft,
            y: pickerTop,
        }
        var dotTopRight = {
            x: pickerLeft + pickerWidth,
            y: pickerTop,
        }
        var dotBottomLeft = {
            x: pickerLeft,
            y: pickerTop + pickerHeight,
        }
        var dotBottomRight = {
            x: pickerLeft + pickerWidth,
            y: pickerTop + pickerHeight,
        }

        var box = new THREE.Box3();
        box.setFromObject(threejsDesk.scene);
        var helper = new THREE.Box3Helper( box, 0xffff00 );
        threejsDesk.scene.add( helper );

        var panel0 = threejsDesk.createPanel(
            1, box.max.y - box.min.y, box.max.z - box.min.z, 
            { x: box.max.x, y: box.max.y/2 + box.min.y/2, z: box.max.z/2 + box.min.z/2 },
            'panel0'
        );
        var panel1 = threejsDesk.createPanel(
            1, box.max.y - box.min.y, box.max.z - box.min.z, 
            { x: box.min.x, y: box.max.y/2 + box.min.y/2, z: box.max.z/2 + box.min.z/2 },
            'panel1'
        );
        var panel2 = threejsDesk.createPanel(
            box.max.x - box.min.x, 1, box.max.z - box.min.z, 
            { x: box.max.x/2 + box.min.x/2, y: box.max.y, z: box.max.z/2 + box.min.z/2 },
            'panel2'
        );
        var panel3 = threejsDesk.createPanel(
            box.max.x - box.min.x, 1, box.max.z - box.min.z, 
            { x: box.max.x/2 + box.min.x/2, y: box.min.y, z: box.max.z/2 + box.min.z/2 },
            'panel3'
        );
        var panel4 = threejsDesk.createPanel(
            box.max.x - box.min.x, box.max.y - box.min.y, 1, 
            { x: box.max.x/2 + box.min.x/2, y: box.max.y/2 + box.min.y/2, z: box.max.z },
            'panel4'
        );
        var panel5 = threejsDesk.createPanel(
            box.max.x - box.min.x, box.max.y - box.min.y, 1, 
            { x: box.max.x/2 + box.min.x/2, y: box.max.y/2 + box.min.y/2, z: box.min.z },
            'panel5'
        );
        var panels = [panel0, panel1, panel2, panel3, panel4, panel5];

        var intersects0 = threejsDesk.pickObjectByDotObjects(dotTopLeft, panels);
        var intersects1 = threejsDesk.pickObjectByDotObjects(dotTopRight, panels);
        var intersects2 = threejsDesk.pickObjectByDotObjects(dotBottomLeft, panels);
        var intersects3 = threejsDesk.pickObjectByDotObjects(dotBottomRight, panels);
        var intersects = [intersects0, intersects1, intersects2, intersects3];
        var points = [], distance = 0;
        // console.log(intersects);
        for (var i = 0, il = panels.length; i < il; i++) {
            // threejsDesk.scene.remove(panels[i]);
        }
        
        var box = new THREE.Box3();
        box.makeEmpty();

        for (var i = 0, il = intersects.length; i < il; i++) {
            for (var j = 0, jl = intersects[i].length; j < jl; j++) {
                if ( intersects[i][j].distance !== distance && (
                    ( i < il && j < 3 ) || ( i > il && j < 2 )
                ) ) {
                    points.push(intersects[i][j].point);
                    distance = intersects[i][j].distance;

                    box.expandByPoint(intersects[i][j].point);
                    threejsDesk.createBox(intersects[i][j].point.x, intersects[i][j].point.y, intersects[i][j].point.z, 0xff0000)
                }
            }
        }
        var pickerHelper = new THREE.Box3Helper( box, 0xff0000 );
        threejsDesk.scene.add( pickerHelper );

        // 正方向好像和坐标轴相反
        var p0 = new THREE.Plane(new THREE.Vector3(-1, 0, 0), box.max.x);
        var p1 = new THREE.Plane(new THREE.Vector3(1, 0, 0), - box.min.x);
        var p2 = new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y);
        var p3 = new THREE.Plane(new THREE.Vector3(0, 1, 0), - box.min.y);
        var p4 = new THREE.Plane(new THREE.Vector3(0, 0, -1), box.max.z);
        var p5 = new THREE.Plane(new THREE.Vector3(0, 0, 1), - box.min.z);
        var frustum = new THREE.Frustum(p0, p1, p2, p3, p4, p5);
        // 只能传入 Mesh
        threejsDesk.setPickerObjects(threejsDesk.scene);
        var objects = threejsDesk.objectPicker.objects;
        var pickers = [];
        for (var i = 0, il = objects.length; i < il; i++) {
            if( objects[i].type === 'Mesh' && frustum.intersectsObject(objects[i]) ) {
                pickers.push( threejsDesk.getPicker(objects[i]) );
            }
        }
        threejsDesk.activeObjects = pickers;
        threejsDesk.showObjectActive();
    }
}

// 拉伸标准层
function test5() {
    var building = threejsDesk.scene.getObjectByName('building.dae');
    var buildingLabel = building.getObjectByName(building.name + '_label');
    var baseObj, obj, box, yData, yBase;
    
    building.remove(buildingLabel);
    baseObj = building.clone(true);
    building.add(buildingLabel);
    
    obj = new THREE.Group();
    obj.add(baseObj);
    threejsDesk.scene.add(obj);
    yData = baseObj.position.y;
    baseObj = baseObj.clone(true);
    obj.add(baseObj);

    box = new THREE.Box3();  
    box.setFromObject(baseObj);
    yBase = box.max.y - box.min.y;
    baseObj.position.y = yData + yBase;
}

function test() {
    var v1 = new THREE.Vector3( 10, 0, 0 );
    var v2 = new THREE.Vector3( 0, 1, 0 );
    var angle = v1.angleTo(v2);
    console.log(angle / Math.PI * 180);
}
