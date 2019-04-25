// 设置模型功能
ThreejsDesk.prototype.setupObject = function () {
    this.opts.$drawRoad.on('click', function(){
        if (this.lineHelper.enable) {
            this.unsetRoadDrawing();
        } else {
            this.setRoadDrawing();
        }
    }.bind(this))
    this.opts.$drawWall.on('click', function(){
        if (this.lineHelper.enable) {
            this.unsetRoadDrawing();
        } else {
            this.setWallDrawing();
        }
    }.bind(this))
    this.opts.$getArea.on('click', function(){
        if (this.lineHelper.enable) {
            return;
        } else {
            if (this.lineHelper.$input.css('display') === 'none') {
                this.lineHelper.$input.show().css({ left: '50%', top: '50%'});
            } else {
                this.lineHelper.$input.hide();
            }
        }
    }.bind(this))

    this.objectControl = {};
    this.objectControl.objectsHide = [];
    this.setDelete();
    this.setCloseObject();
    this.getTransControl();
    this.setTransControl();
}

// 设置删除模型
ThreejsDesk.prototype.setDelete = function () {
    if ( this.opts.$delete === null ) return;
    var that = this; 

    that.opts.$delete.on('click', function () {
        if ( that.activeObjects.length > 0 ) {
            for (var i = 0, il = that.activeObjects.length; i < il; i++) {
                var labelId = that.activeObjects[i].userData.labelId, ele;
                if (labelId) {
                    ele = that.activeObjects[i].getObjectById(labelId).element;
                    $(ele).remove();
                }
                
                that.activeObjects[i].parent.remove( that.activeObjects[i] );
            }

            that.activeObjects = [];
            that.objectActiveLock = false;
            that.showObjectActive();
        }
    })
}

// 模型控制 translate rotate scale
ThreejsDesk.prototype.getTransControl = function () {
    var that = this;
    var control = new THREE.TransformControls( that.camera, that.renderer.domElement );
    control.visible = false;
    that.scene.add( control ); 
    that.transControls.push(control);

    // that.transControl.setTranslationSnap( 10 );  // null, 100
    // that.transControl.setRotationSnap( THREE.Math.degToRad( 15 ) );  // null, 弧度
    // that.transControl.scaleRefer = 1.01;  // null, 1.01, 0 是错误的
    // that.transControl.transformByMove = false;  // 切换移动变换和点击变换，默认是移动变换
}   

// 模型控制 translate rotate scale
ThreejsDesk.prototype.setTransControl = function () {
    var that = this;
    
    if ( that.opts.$transformType !== null ) {
        if (that.transControls[0].transformByMove) {
            that.opts.$transformType.text('移动变换');
        } else {
            that.opts.$transformType.text('点击变换');
        }
    }
    
    if ( that.opts.$transformType !== null ) that.opts.$transformType.on('click', function(){
        var transformByMove = that.transControls[0].transformByMove;
        for (var i = 0, il = that.transControls.length; i < il; i++) {
            that.transControls[i].transformByMove = ! transformByMove;
        }

        if (transformByMove) {
            that.opts.$transformType.text('移动变换');
        } else {
            that.opts.$transformType.text('点击变换');
        }
    })

    if ( that.opts.$translateValue !== null ) that.opts.$translateValue.on('keyup change', function(e){
        e.stopPropagation();
        var val = $(this).val();
        val = parseFloat(val);
        if (isNaN(val)) val = null;
        for (var i = 0, il = that.transControls.length; i < il; i++) {
            that.transControls[i].setTranslationSnap( val );
        }
    })

    if ( that.opts.$rotateValue !== null ) that.opts.$rotateValue.on('keyup change', function(e){
        e.stopPropagation();
        var val = $(this).val();
        val = parseFloat(val);
        if (isNaN(val)) {
            val = null;
        } else {
            val = THREE.Math.degToRad( val );
        }
        for (var i = 0, il = that.transControls.length; i < il; i++) {
            that.transControls[i].setRotationSnap( val ); 
        }
    })

    if ( that.opts.$scaleRefer !== null ) that.opts.$scaleRefer.on('keyup change', function(e){
        e.stopPropagation();
        var val = $(this).val();
        val = parseFloat(val);
        if (isNaN(val) || val === 0) {
            val = null;
        } 
        for (var i = 0, il = that.transControls.length; i < il; i++) {
            that.transControls[i].scaleRefer = val;
        }
    })

    $(window).on( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 81: // Q
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setSpace( that.transControls[i].space === "local" ? "world" : "local" );
                }
                break;
            case 87: // W
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setMode( "translate" );
                }
                break;
            case 69: // E
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setMode( "rotate" );
                }
                break;
            case 82: // R
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setMode( "scale" );
                }
                break;
            case 187:
            case 107: // +, =, num+
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setSize( that.transControls[i].size + 0.1 );
                }
                break;
            case 189:
            case 109: // -, _, num-
                for (var i = 0, il = that.transControls.length; i < il; i++) {
                    that.transControls[i].setSize( Math.max( that.transControls[i].size - 0.1, 0.1 ) );
                }
                break;
        }
    });
}  

// 修改名称
ThreejsDesk.prototype.handleGuiName = function ( obj ) {
    var that = this;
    return function ( value ) {
        if ( value !== obj.name ) {
            obj.name = value;
            obj.guiOpen = true;
            that.objectActiveLock = false;
            that.showObjectActive();
        }
    }
}

ThreejsDesk.prototype.handleGuiLock = function(obj){
    var that = this;
    return function ( value ){
        obj.userData.isLock = value;
        if(value){
            that.transControls[0].detach();
        }else{
            that.transControls[0].attach( obj );
        }
    }
}

ThreejsDesk.prototype.handleGuiShowObject = function(obj){
    var that = this;
    return function ( value ){
        obj.visible = value;
        if(!value){
            that.transControls[0].detach();
            that.objectControl.objectsHide.push(obj);
        }else{
            that.transControls[0].attach( obj );
        }
    }
}

// 处理颜色变化
ThreejsDesk.prototype.handleGuiColor = function ( color, i ) {
	return function ( value ){
		if (typeof value === "string") {
			value = value.replace('#', '0x');
		}
        if (color) color.setHex( value ); 
    };
}

// 处理离地变化
ThreejsDesk.prototype.handleGuiGround = function ( obj ) {
    var that = this;
	return function ( value ){
        if ( obj.userData.guiPosYChange ) {
            obj.userData.guiPosYChange = false;
            return;
        }

        var box = new THREE.Box3();
        box.setFromObject(obj);
        obj.position.setY(value + obj.position.y - box.min.y);
        
        obj.userData.guiGroundChange = true;
        that.objectPicker.guiFolders['gui' + obj.id].children.guiPosY.setValue(obj.position.y);
    };
}

// 处理 Y 轴变化
ThreejsDesk.prototype.handleGuiPosY = function ( obj ) {
    var that = this;
	return function ( value ){
        if ( obj.userData.guiGroundChange ) {
            obj.userData.guiGroundChange = false;
            return;
        }

        obj.position.setY(value);
        var box = new THREE.Box3();
        box.setFromObject(obj);
        
        obj.userData.guiPosYChange = true;
        that.objectPicker.guiFolders['gui' + obj.id].children.guiGround.setValue(value - obj.position.y + box.min.y);
    };
}

// 处理 X 轴变化
ThreejsDesk.prototype.handleGuiPosX = function ( obj ) {
	return function ( value ){
		obj.position.setX(value);
    };
}

// 处理 Z 轴变化
ThreejsDesk.prototype.handleGuiPosZ = function ( obj ) {
	return function ( value ){
		obj.position.setZ(value);
    };
}

// 处理角度变化
ThreejsDesk.prototype.handleGuiAngle = function ( obj ) {
	return function ( value ){
        if (obj.userData.type === 'dae') {
            obj.rotation.z = value / 180 * Math.PI;
        } else {
            obj.rotation.y = value / 180 * Math.PI;
        }
    };
}

// 处理高度变化
ThreejsDesk.prototype.handleGuiHeight = function ( obj ) {
    var that = this;
	return function ( value ) {
        var size = (new THREE.Box3()).setFromObject(obj).getSize(new THREE.Vector3());
        var ratio = value / size.y;
        if (obj.userData.type === 'dae') {
            obj.scale.setZ(obj.scale.z * ratio);
        } else {
            obj.scale.setY(obj.scale.y * ratio);
        }

        // 更新楼栋的标准层高度，楼栋被动更新时不能执行
        if ( obj.userData.baseLayerEnabled && (! obj.userData.baseLayerHeightChange) ) {
            obj.userData.objHeightChange = true;  // 表示标准层是被动更新
            that.objectPicker.guiFolders['gui' + obj.id].children.guiBaseLayerHeight.setValue(value / obj.userData.baseLayerNum);
        }
        if ( obj.userData.baseLayerHeightChange ) obj.userData.baseLayerHeightChange = false;
    };
}

// 移动旋转
ThreejsDesk.prototype.handleGuiEnableMove = function (obj) {
    var that = this;
    return function (val) {
        if (val) {
            that.lineHelper.dotNum = 3;
            that.objectActiveLock = true;
            that.toggleLineHelper.call(that, true);
            
            that.onSureLine = function (line) {
                var dot1 = line.userData.circles[0];
                var dot2 = line.userData.circles[1];
                if (!dot1 || !dot2) return;
                dot1 = new THREE.Vector3(dot1.position.x, dot1.position.y, dot1.position.z);
                dot2 = new THREE.Vector3(dot2.position.x, dot2.position.y, dot2.position.z);
                var normal = dot2.clone();
                normal.sub(dot1);

                if (line.userData.circles.length === 2) {
                    var pos = obj.position, val = that.lineHelper.$input.val();
                    val = parseFloat(val);
                    if ( !isNaN(val) ) normal.setLength(val);
                    pos.set(pos.x+normal.x, pos.y+normal.y, pos.z+normal.z);
                } else {
                    dot2.y = dot1.y;
                    normal = dot2.clone();
                    normal.sub(dot1);

                    var dot3 = line.userData.circles[2];
                    dot3 = new THREE.Vector3(dot3.position.x, dot3.position.y, dot3.position.z);
                    dot3.y = dot1.y;

                    var normal2 = dot3.clone(), axisY = new THREE.Vector3(0, 1, 0), angle, 
                        group = new THREE.Group(), pos, matrix, matrixInverse, val = that.lineHelper.$input.val();

                    normal2.sub(dot1);
                    normal2.normalize();
                    normal.normalize();

                    angle = normal.dot(normal2);
                    angle = Math.acos(angle);
                    normal.applyAxisAngle(axisY, angle);  

                    val = parseFloat(val);
                    if ( !isNaN(val) ) angle = THREE.Math.degToRad(val);
                    if (!this.checkPosition(normal, normal2)) angle = - angle;

                    group.position.set(dot1.x, dot1.y, dot1.z);
                    this.scene.add(group);
                    group.updateMatrixWorld();

                    obj.updateMatrixWorld();
                    pos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
                    group.worldToLocal(pos);
                    group.add(obj);
                    obj.position.set(pos.x, pos.y, pos.z);

                    group.updateMatrixWorld();
                    group.rotateOnWorldAxis(axisY, angle);
                    group.updateMatrixWorld();
                    matrix = obj.matrixWorld.clone();

                    this.scene.add(obj);
                    this.scene.remove(group);
                    obj.updateMatrixWorld();
                    matrixInverse = obj.matrixWorld.clone();
                    matrixInverse.getInverse(matrixInverse);
                    obj.applyMatrix(matrixInverse);
                    obj.applyMatrix(matrix);
                }
            }
        } else {
            that.clearLines();

            that.lineHelper.dotNum = 2000;
            that.objectActiveLock = false;
            that.toggleLineHelper.call(that, false);
            // that.objectPicker.enable = true;
        }
    }
}

// 处理楼栋的标准层
// 分类：标准层 baseLayer ，其它层 otherLayer ；
// 索引：第一个标准层 0 ，从 0 开始；其它层不加索引；
// 名称：标准层分类加索引；其它层为分类；
// 标准层数量：楼栋上 baseLayerNum
ThreejsDesk.prototype.handleGuiBaseLayerControl = function ( obj ) {
    var that = this;
    return function ( value ) {
        clearTimeout(that.objectControl.timerBaseLayerControl);
        that.objectControl.timerBaseLayerControl = setTimeout(function(){
            that.handleBaseLayerControl.call(that, obj, value);
        }, 30);
    }
}

ThreejsDesk.prototype.handleBaseLayerControl = function (obj, value) {
    var that = this;
    if ( ! obj || value < 1 ) {
        console.log('处理楼栋标准层数量：数据有误，obj.name ==> ' + obj.name + '，传入的数据 ==> ' + value);
        return false;
    }
    if ( ! obj.userData.baseLayerEnabled || obj.userData.lockBaseLayerControl ) return;
    obj.userData.lockBaseLayerControl = true;

    value = parseInt(value);
    if ( isNaN(value) ) value = 1;

    var baseObj, yBase, yData, valueOld = 0,
        box, baseTarget, baseDel;

    baseObj = obj.getObjectByName('baseLayer0');
    box = new THREE.Box3();
    box.setFromObject( baseObj );
    yBase = box.max.y - box.min.y;   

    for (var i = 0, il = obj.children.length; i < il; i++) {  
        if (obj.children[i].userData.class === 'baseLayer' && obj.children[i].visible === true) valueOld += 1;
    }
    
    baseTarget = obj.getObjectByName( 'baseLayer' + (valueOld - 1) );
    baseObj = baseTarget;  
    yData = baseTarget.position.y;
    
    // 增加标准层
    if ( value > valueOld ) {
        for (var i = 0, il = value - valueOld; i < il; i++) {
            baseObj = baseObj.clone(true);
            baseObj.visible = true;
            obj.add(baseObj);
            obj.userData.baseLayerNum += 1;
            baseObj.name = 'baseLayer' + (valueOld + i);
            baseObj.userData.index = (valueOld + i);
            if (obj.userData.type === 'dae') {
                baseObj.translateZ(yBase / obj.scale.z);
            } else {
                baseObj.translateY(yBase / obj.scale.z);  
            }
            baseObj.updateMatrixWorld();
        }
        
        // 调整其它层的高度，在目标标准层之上的其它层
        for (var i = 0, il = obj.children.length; i < il; i++) {
            if ( 
                obj.children[i].userData.class === 'otherLayer' && 
                obj.children[i].position.y > yData
            ) {
                if (obj.userData.type === 'dae') {
                    obj.children[i].translateZ( yBase * (value - valueOld) );
                } else {
                    obj.children[i].translateY( yBase * (value - valueOld) );
                }
            }
        }

    } else if ( value < valueOld ) {  // 减少标准层
        for (var i = value; i < valueOld; i++) {
            baseDel = obj.getObjectByName('baseLayer' + i);
            obj.remove(baseDel);
            obj.userData.baseLayerNum -= 1;
        }

        // 调整其它层的高度，在目标标准层之上的其它层
        for (var i = 0, il = obj.children.length; i < il; i++) {
            if ( 
                obj.children[i].userData.class === 'otherLayer' && 
                obj.children[i].position.y > yData
            ) {
                if (obj.userData.type === 'dae') {
                    obj.children[i].translateZ( yBase * (value - valueOld) );
                } else {
                    obj.children[i].translateY( yBase * (value - valueOld) );
                }
            }
        }

    }

    // 更新楼栋的高度
    box.setFromObject( obj );
    var objHeight = box.max.y - box.min.y;
    that.objectPicker.guiFolders['gui' + obj.id].children.guiHeight.setValue(objHeight);

    obj.userData.lockBaseLayerControl = false;
}

ThreejsDesk.prototype.handleGuiBaseLayerHeight = function ( obj ) {
    var that = this;
    return function ( value ) {
        clearTimeout(that.objectControl.timerBaseLayerHeight);
        that.objectControl.timerBaseLayerHeight = setTimeout(function(){
            that.handleBaseLayerHeight.call(that, obj, value);
        }, 30);
    }
}

ThreejsDesk.prototype.handleBaseLayerHeight = function ( obj, value ) {
    var that = this;
    if ( ! obj || value <= 0 ) {
        console.log('处理楼栋标准层高度：数据有误，obj.name ==> ' + obj.name + '，传入的数据 ==> ' + value);
        return false;
    }
    if ( ! obj.userData.baseLayerEnabled || obj.userData.lockBaseLayerHeight ) return;
    obj.userData.lockBaseLayerHeight = true;

    var box = new THREE.Box3(), valueOld, ratio;

    box.setFromObject( obj.getObjectByName('baseLayer0') );
    valueOld = box.max.y - box.min.y;
    ratio = value / valueOld;

    var child = null;
    for (var i = 0, il = obj.children.length; i < il; i++) {
        if ( obj.children[i].userData.class === 'baseLayer' ) {
            child = obj.children[i];
            if (obj.userData.type === 'dae') {
                child.scale.setZ(child.scale.z * ratio);
                child.position.setZ( value * child.userData.index / obj.scale.z );
            } else {
                child.scale.setY(child.scale.y * ratio);
                child.position.setY( value * child.userData.index / obj.scale.z );
            }
        }
    }
    
    // 更新楼栋的高度，标准层被动更新时不能执行
    if ( ! obj.userData.objHeightChange ) {
        obj.userData.baseLayerHeightChange = true;  // 表示楼栋是被动更新
        that.objectPicker.guiFolders['gui' + obj.id].children.guiHeight.setValue(value * obj.userData.baseLayerNum);
    }
    if ( obj.userData.objHeightChange ) obj.userData.objHeightChange = false;

    obj.userData.lockBaseLayerHeight = false;
}

// 标准层叠加功能开关，初始化，更新选中对象
ThreejsDesk.prototype.handleGuiBaseLayerTurn = function ( obj ) {
    var that = this;
    return function ( value ) {  
        obj.userData.baseLayerEnabled = value;  

        if ( value && ( ! obj.userData.baseLayerInit ) ) {
            var group = new THREE.Group(), matrix = new THREE.Matrix4();
            group.name = obj.name;
            
            that.removeObjectLabel( obj );
            $.extend(group.userData, obj.userData);
            group.userData.baseLayerNum = 1;
            obj.name = 'baseLayer0';
            obj.userData = {};
            obj.userData.class = 'baseLayer';
            obj.userData.index = 0;
            obj.updateMatrixWorld();
            group.applyMatrix( obj.matrixWorld );
            obj.applyMatrix( matrix.getInverse(obj.matrixWorld) );

            group.add(obj);
            that.addObjectLabel(group, group.userData.label);
            that.scene.add(group);

            group.userData.baseLayerInit = true;

            for (var i = 0, il = that.activeObjects.length; i < il; i++) {
                if (that.activeObjects[i].id = obj.id) that.activeObjects.splice(i, 1);
            }
            that.activeObjects.push(group);
            group.userData.guiOpen = true;
        } else {
            obj.userData.guiOpen = true;
        }

        that.objectActiveLock = false;
        that.showObjectActive();  
    }
}

// 靠近多个物体
// 第一个物体是参照物，变换更新到后面的物体，第一个物体的 x 轴正向依次移动后面的物体
ThreejsDesk.prototype.setCloseObject = function () {
    if ( !this.opts.$closeObject ) return;

    var that = this;
    this.opts.$closeObject.on('click', function(){
        if (that.activeObjects.length < 2) {
            console.log('联排功能：需要两个以上的模型');
            return false;
        }

        that.activeObjects[0].updateMatrixWorld();
        var matrix = that.activeObjects[0].matrixWorld, box = new THREE.Box3();

        var matrixTemp = new THREE.Matrix4();
        for (var i = 1, il = that.activeObjects.length; i < il; i++) {
            that.activeObjects[i].updateMatrixWorld();
            matrixTemp.getInverse( that.activeObjects[i].matrixWorld );
            that.activeObjects[i].applyMatrix( matrixTemp );

            that.activeObjects[i].applyMatrix( matrix );
        }

        var dir = new THREE.Vector3(1, 0, 0);
        if ( that.activeObjects[0].userData.type === 'dae' ) {
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), that.activeObjects[0].rotation.z);
        } else {
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), that.activeObjects[0].rotation.y);
        }

        var len1 = 0, len2 = 0;
        for (var i = 1, il = that.activeObjects.length; i < il; i++) {
            box.setFromObject( that.activeObjects[i - 1] );
            len1 += box.max.projectOnVector(dir).distanceTo( that.activeObjects[i - 1].position.projectOnVector(dir) ); 
            box.setFromObject( that.activeObjects[i] );
            len2 += that.activeObjects[i].position.projectOnVector(dir).distanceTo( box.min.projectOnVector(dir) ); 

            dir.normalize();
            dir.setLength(len1 + len2);
            that.activeObjects[i].translateX(dir.x);
            if ( that.activeObjects[i].userData.type === 'dae' ) {
                that.activeObjects[i].translateY(dir.z);
            } else {
                that.activeObjects[i].translateZ(dir.z);
            }
        }

    })
}

// 排列模型
ThreejsDesk.prototype.handleGuiSetPlace = function (obj) {
    var that = this;
    return function (val) {
        if (!that.lineHelper.lines.length) return;
        var line = that.lineHelper.lines[that.lineHelper.lines.length-1];
        var v1 = line.geometry.vertices[0].clone();
        var v2 = line.geometry.vertices[1].clone();
        v2.sub(v1);
        if (!obj.userData['setPlace,x,'+v2.x+',y,'+v2.y+',z,'+v2.z]) {
            obj.userData['setPlace,x,'+v2.x+',y,'+v2.y+',z,'+v2.z] = [];
        }

        var objCopy = obj.clone(true);
        val = parseInt(val);
        if (isNaN(val)) val = 1;
        for (var i = 0; i < val; i++) {
            if (!obj.userData['setPlace,x,'+v2.x+',y,'+v2.y+',z,'+v2.z][i+1]) {
                objCopy.position.set(objCopy.position.x + v2.x * (i+1), 
                    objCopy.position.y + v2.y * (i+1), objCopy.position.z + v2.z * (i+1));
                that.scene.add(objCopy);
                obj.userData['setPlace,x,'+v2.x+',y,'+v2.y+',z,'+v2.z][i+1] = true;
                objCopy = obj.clone(true);
            }
        }
    }
}

// 排列模型
ThreejsDesk.prototype.handleGuiEnablePlace = function (obj) {
    var that = this;
    return function (val) {
        that.lineHelper.enable = val;        
        that.objectPicker.enable = !val;

        if (val) {
            that.lineHelper.dotNum = 2;
            that.toggleLineHelper(true);
        } else {
            that.toggleLineHelper(false);
        }
    }
}

// 重置模型的原点
ThreejsDesk.prototype.resetObjCenter = function ( obj ) {
    if(obj.type === "Mesh"){
        var box = new THREE.Box3().setFromObject(obj),
            max = box.max, min = box.min;

        obj.geometry.computeBoundingBox();
        obj.geometry.center();

        var xVal = (max.x + min.x) / 2,
            zVal = (max.z + min.z) / 2;

        obj.position.set(xVal, (max.y - min.y) / 2, zVal);
        obj.updateMatrixWorld();
    }
}

// 设置模型的几何属性和材质双面可见
ThreejsDesk.prototype.setObjData = function ( object ) {
    object.traverse(function ( mesh ) {
        if(mesh.type === "Mesh"){
            mesh.geometry.dynamic = true;
            mesh.geometry.__dirtyVertices = true;
            mesh.geometry.__dirtyNormals = true;

            mesh.flipSided = true;
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeFaceNormals();
            mesh.material.side = THREE.DoubleSide;
        }
    })
}

// 模型的面，计算面积  data = { face: {}, object: {} }
ThreejsDesk.prototype.pickObjectFace = function ( data ) { 
    if ( !data ) return;
    var obj, objGeometry, objFaces, objVertices, dataFace, facesNormal, facesPlane, facePro;

    obj = data.object;
    if ( !obj.geometry.vertices ) {
        objGeometry = new THREE.Geometry();
        objGeometry.fromBufferGeometry( obj.geometry );
    } else {
        objGeometry = obj.geometry.clone();
    }
    objFaces = objGeometry.faces;
    objVertices = objGeometry.vertices;
    dataFace = data.face;
    facesNormal = [];
    facesPlane = [];
    facePro = objVertices[dataFace.a].dot(dataFace.normal);

    for (var i = 0, il = objFaces.length; i < il; i++) {
        if ( this.checkPosition(objFaces[i].normal, dataFace.normal) ) facesNormal.push( objFaces[i] )
    }
    for (var i = 0, il = facesNormal.length; i < il; i++) {
        if ( objVertices[facesNormal[i].a].dot(dataFace.normal).toFixed(4) === facePro.toFixed(4) ) {
            facesPlane.push( facesNormal[i] );
        }
    }

    var geometry = new THREE.Geometry();
    geometry.vertices = objVertices;
    geometry.faces = facesPlane;

    obj.updateMatrixWorld();
    geometry.applyMatrix( obj.matrixWorld );
    geometry.computeBoundingSphere();

    var material = new THREE.MeshLambertMaterial( { color: 0xff0000, side: THREE.DoubleSide, 
        opacity: .5, transparent: true } );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.userData.areaValue = this.getAreaValue( geometry.vertices, geometry.faces );

    this.scene.add( mesh );
    this.setUserData(mesh);
    // mesh.visible = false;
    this.lineHelper.$input.val( mesh.userData.areaValue ).css({top: '50%', left: '50%'});

    return mesh;
}

// 合并几何体
ThreejsDesk.prototype.mergeByGeometry = function ( objs ) {
    if ( !objs && !objs.length ) return;
    var geometry = new THREE.Geometry(), objsArr = [objs], 
        geometry2 = new THREE.Geometry();

    while (objsArr.length > 0) {
        objs = objsArr.shift();
        for (var i = 0, il = objs.length; i < il; i++) {
            if ( objs[i].type === 'Mesh' ) {
                objs[i].updateMatrixWorld();
                if ( !objs[i].geometry.vertices ) {
                    geometry2.fromBufferGeometry( objs[i].geometry );
                    geometry.merge( geometry2, objs[i].matrixWorld );
                } else {  
                    geometry.mergeMesh( objs[i] );
                }
            }
            if ( objs[i].children.length > 0 ) objsArr.push( objs[i].children );
        }
    }

    var material = new THREE.MeshLambertMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( geometry, material );

    // this.scene.add( mesh );
    // mesh.name = 'mergeByGeometry';
    // this.initUserData(mesh);
    // this.fixedMirrorModel( mesh );

    return mesh;
}

ThreejsDesk.prototype.mergeByBufferGeometry = function ( objs ) {
    if ( !objs && !objs.length ) return;
    var geometry = new THREE.BufferGeometry(), objsArr = [objs], vertices, count = 0, objs2 = objs,
        geometry2 = new THREE.BufferGeometry();

    while (objsArr.length > 0) {
        objs = objsArr.shift();
        for (var i = 0, il = objs.length; i < il; i++) {
            if ( objs[i].type === 'Mesh' ) {
                if ( objs[i].geometry.vertices ) {
                    count += objs[i].geometry.vertices.length;
                } else {  
                    count += objs[i].geometry.attributes.position.count;
                }
            }
            if ( objs[i].children.length > 0 ) objsArr.push( objs[i].children );
        }
    }
    if (count < 1) {
        console.log('无法合并模型的几何体：', objs2);
        return null;
    }

    vertices = new Float32Array( count * 3 );
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry2 = geometry.clone();
    geometry.computeVertexNormals();
    geometry2.computeVertexNormals();
    count = 0;
    objsArr = [objs2];

    while (objsArr.length > 0) {
        objs = objsArr.shift();
        for (var i = 0, il = objs.length; i < il; i++) {
            objs[i].updateMatrixWorld();
            if ( objs[i].type === 'Mesh' ) {
                if ( objs[i].geometry.vertices ) {
                    geometry2.fromGeometry( objs[i].geometry );
                    geometry2.applyMatrix( objs[i].matrixWorld.clone() );
                    geometry.merge( geometry2, count );
                    count += objs[i].geometry.vertices.length;
                } else {  
                    geometry2 = objs[i].geometry.clone();
                    geometry2.applyMatrix( objs[i].matrixWorld.clone() );
                    geometry.merge( geometry2, count );
                    count += objs[i].geometry.attributes.position.count;
                }
            }
            if ( objs[i].children.length > 0 ) objsArr.push( objs[i].children );
        }
    }

    var material = new THREE.MeshLambertMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( geometry, material );

    // this.scene.add( mesh );
    // mesh.name = 'mergeByBufferGeometry';
    // this.initUserData(mesh);
    // this.fixedMirrorModel( mesh );

    return mesh;
}
