// 设置模型选择功能
ThreejsDesk.prototype.setupPicker = function () {
    this.pickObject();
    this.getSelectionBox();
    this.setPickMore();
}

// 选择对象
ThreejsDesk.prototype.pickObject = function () {
    var that = this;

    if (!this.objectPicker) this.objectPicker = {};
    this.objectPicker.enable = true;
    this.objectPicker.objects = [];
    this.objectPicker.guiFolders = {};

    that.raycaster = new THREE.Raycaster();
    that.mouse = new THREE.Vector2();
    that.intersects = [];

    that.opts.$box.on( 'mousedown', that.onPickObject.bind( that ) );        
}

// 设置可选择的模型
ThreejsDesk.prototype.setPickerObjects = function (obj) {
    this.objectPicker.objects = [];
    for (var i = 0, il = obj.children.length; i < il; i++) {
        if (obj.children[i].userData.enablePick) {
            this.objectPicker.objects.push(obj.children[i]);

            if (obj.children[i].type !== 'Mesh') {
                this.getPickerObjects(obj.children[i], obj.children[i].id);
            }
            
        }
    }
}

// 获取可选择模型的子代
ThreejsDesk.prototype.getPickerObjects = function (obj, pickerId) { 
    for (var i = 0, il = obj.children.length; i < il; i++) {
        if (obj.children[i].type === 'Mesh') {
            this.objectPicker.objects.push(obj.children[i]);
            obj.children[i].userData.pickerId = pickerId;
        } else {
            this.getPickerObjects(obj.children[i], pickerId);
        }
    }  
}

// 选择对象，监听事件
ThreejsDesk.prototype.onPickObject = function ( event ) {
    if (event.buttons !== 1 || event.ctrlKey) return;
    if (!this.objectPicker.enable || this.objectActiveLock) return;  

    this.setPickerObjects(this.scene);
    this.mouse.setX( ( ( event.pageX - this.opts.$box.offset().left ) / this.opts.$box.innerWidth() ) * 2 - 1 );
    this.mouse.setY( - ( ( event.pageY - this.opts.$box.offset().top ) / this.opts.$box.innerHeight() ) * 2 + 1 );             
    
    this.raycaster.setFromCamera( this.mouse, this.camera );
    this.intersects = this.raycaster.intersectObjects( this.objectPicker.objects );  
    
    if ( this.intersects[0] !== undefined ) {
        var obj = this.getPicker(this.intersects[0].object);
        this.pickAndJudge(obj);
        
        if (this.lineHelper.enable === false && this.lineHelper.$input.css('display') === 'block') {
            this.pickObjectFace(this.intersects[0]);
        }
    } else {
        this.pickAndJudge(null);  
    }
}

// 处理单选和多选
ThreejsDesk.prototype.pickAndJudge = function (obj) {
    if ( this.objectActiveLock ) return;

    if ( this.mode === 'pickOne' ) {
        this.activeObjects = [];
        if ( obj ) this.activeObjects.push( obj );
        this.showObjectActive();
    } else if ( this.mode === 'pickMore' ) {
        if ( ! obj ) return;

        var isPicked = false;
        for (var i = 0, il = this.activeObjects.length; i < il; i++) {
            if (this.activeObjects[i].id === obj.id) {
                this.activeObjects.splice(i, 1);
                isPicked = true;
                break;
            }
        }
        if ( ! isPicked ) this.activeObjects.push( obj );
        this.showObjectActive();
    }
}

// 选择对象，根据坐标
ThreejsDesk.prototype.pickObjectByDot = function ( dot ) {
    this.mouse.setX( ( dot.x / this.opts.$box.innerWidth() ) * 2 - 1 );
    this.mouse.setY( - ( dot.y / this.opts.$box.innerHeight() ) * 2 + 1 );             
    
    this.raycaster.setFromCamera( this.mouse, this.camera );
    this.intersects = this.raycaster.intersectObjects( this.objectPicker.objects );  
    // this.activeObjects = [];
    if ( this.intersects[0] !== undefined ) {
        return this.getPicker(this.intersects[0].object);
    }   
    return null;    
}

// 选择对象，根据坐标和物体
ThreejsDesk.prototype.pickObjectByDotObjects = function ( dot, objects ) {
    this.mouse.setX( ( dot.x / this.opts.$box.innerWidth() ) * 2 - 1 );
    this.mouse.setY( - ( dot.y / this.opts.$box.innerHeight() ) * 2 + 1 );             
    
    this.raycaster.setFromCamera( this.mouse, this.camera );
    this.intersects = this.raycaster.intersectObjects( objects );  
    return this.intersects;    
}

// 显示对象的状态
ThreejsDesk.prototype.showObjectActive = function () {
    if (this.objectActiveLock) return;  

    for (var i = 0, il = this.transControls.length; i < il; i++) {
        this.transControls[i].attach( undefined );
        this.transControls[i].visible = false;
    }
    for (var i = 0, il = this.selectionBoxs.length; i < il; i++) {
        this.selectionBoxs[i].visible = false;
    }
        
    $(this.labelRenderer.domElement).find('.active').removeClass('active').attr('contenteditable', false);
    if (this.opts.$labelValue !== null) this.opts.$labelValue.val('');

    for (var item in this.objectPicker.guiFolders) {
        if (this.objectPicker.guiFolders[item]) {
            this.gui.removeFolder(this.objectPicker.guiFolders[item]);  
            this.objectPicker.guiFolders[item] = undefined;
        }
    }
    
    for (var i = 0, il = this.activeObjects.length; i < il; i++) {
        this.showObjectActiveSingle(this.activeObjects[i], i);
    }
}

// 显示单个对象的状态
ThreejsDesk.prototype.showObjectActiveSingle = function (object, index) {
    if (this.objectActiveLock || ! object) return;     

    if ( ! this.selectionBoxs[index] ) this.getSelectionBox();
    this.selectionBoxs[index].setFromObject( object );
    this.selectionBoxs[index].visible = true;

    if ( ! this.transControls[index] ) this.getTransControl();
    this.transControls[index].attach( object );
    this.transControls[index].visible = true;
    
    objectLabel = object.getObjectById(object.userData.labelId); 
    if (objectLabel) $(objectLabel.element).addClass('active');
    if (this.opts.$labelValue !== null && objectLabel) this.opts.$labelValue.val($(objectLabel.element).text());
    
    var box = new THREE.Box3(), boxData = box.setFromObject(object), min = boxData.min, max = boxData.max,
    objColors = [];  

    // color map ; emissive emissiveMap
    object.traverse(function(obj){  
        if ( obj.material && obj.material.color) {
            if (obj.material.emissive) {
                objColors.push(obj.material.emissive)
            } else {
                objColors.push(obj.material.color)
            }
        }
    })
    
    var objectData = {
        '名称': object.name,
        '高度': parseFloat((max.y - min.y).toFixed(4)),
        '角度': object.rotation.y / Math.PI * 180,
        '离地': parseFloat(min.y.toFixed(4)),
        '锁定': object.userData.isLock ? true : false,
        '显示': object.visible,
        '位置 (Y轴)': parseFloat(object.position.y.toFixed(4)),
        '位置 (X轴)': parseFloat(object.position.x.toFixed(4)),
        '位置 (Z轴)': parseFloat(object.position.z.toFixed(4)),
        '移动旋转': false,
        '转为标准层': object.userData.baseLayerEnabled ? true : false,
        '联排数量': 1,
        '开启联排': this.lineHelper.enable,
        // '保存联排': false,
    }
    if ( object.userData.baseLayerEnabled ) {
        objectData['标准层'] = object.userData.baseLayerNum;

        box.setFromObject(object.getObjectByName('baseLayer0'));
        objectData['标准层高度'] = box.max.y - box.min.y;
    }

    this.objectPicker.guiFolders['gui' + object.id] = this.gui.addFolder( object.name + ' (ID: '+ object.id +')' );
    var guiFolder = this.objectPicker.guiFolders['gui' + object.id];
    guiFolder.children = {};

    guiFolder.children.guiName = guiFolder.add(objectData, '名称').onFinishChange( this.handleGuiName.call(this, object) );
    guiFolder.children.guiHeight = guiFolder.add(objectData, '高度', 0.000001, undefined, undefined).onChange( this.handleGuiHeight.call(this, object) );
    guiFolder.children.guiAngle = guiFolder.add(objectData, '角度', 0, 359, 1).onChange( this.handleGuiAngle(object) );
    guiFolder.children.guiGround = guiFolder.add(objectData, '离地').onChange( this.handleGuiGround.call(this, object) );
    guiFolder.add(objectData, '锁定').onChange( this.handleGuiLock(object) );
    guiFolder.add(objectData, '显示').onChange( this.handleGuiShowObject(object) );
    guiFolder.children.guiPosY = guiFolder.add(objectData, '位置 (Y轴)').onChange( this.handleGuiPosY.call(this, object) );
    guiFolder.children.guiPosX = guiFolder.add(objectData, '位置 (X轴)').onChange( this.handleGuiPosX(object) );
    guiFolder.children.guiPosZ = guiFolder.add(objectData, '位置 (Z轴)').onChange( this.handleGuiPosZ(object) );
    guiFolder.children.guiEnableMove = guiFolder.add(objectData, '移动旋转').onChange( this.handleGuiEnableMove.call(this, object) );
    guiFolder.children.guiBaseLayerTurn = guiFolder.add(objectData, '转为标准层').onChange( this.handleGuiBaseLayerTurn.call(this, object) );
    if ( object.userData.baseLayerEnabled ) {
        guiFolder.children.guiBaseLayerControl = guiFolder.add(objectData, '标准层', 1, 30, 1).onChange( this.handleGuiBaseLayerControl.call(this, object) );
        guiFolder.children.guiBaseLayerHeight = guiFolder.add(objectData, '标准层高度', 0.000001, undefined, undefined).onChange( this.handleGuiBaseLayerHeight.call(this, object) );
    } 
    guiFolder.children.guiEnablePlace = guiFolder.add(objectData, '开启联排').onChange( this.handleGuiEnablePlace.call(this, object) );
    guiFolder.children.guiSetPlace = guiFolder.add(objectData, '联排数量', 1, undefined, 1).onChange( this.handleGuiSetPlace.call(this, object) );
    
    for (var i = 0, il = objColors.length; i < il; i++) {
        objectData['颜色' + i] = objColors[i].getHex();
        guiFolder.children['guiColor' + i] = guiFolder.addColor(objectData, '颜色' + i).onChange( this.handleGuiColor(objColors[i], i) );
    }

    if ( object.userData.guiOpen ) guiFolder.open();
    object.userData.guiOpen = false;
}

// 选框
ThreejsDesk.prototype.getSelectionBox = function () {
    var box = new THREE.BoxHelper();
    box.material.depthTest = false;
    box.material.transparent = true;
    box.visible = false;
    this.scene.add( box );
    this.selectionBoxs.push(box);
}

// 获取选择对象的可选模型
ThreejsDesk.prototype.getPicker = function (object) {
    if (object.userData.pickerId === undefined) return object;
    for ( var i = 0, il = this.objectPicker.objects.length; i < il; i++ ) {
        if ( this.objectPicker.objects[i].id === parseInt(object.userData.pickerId) ) {
            return this.objectPicker.objects[i];
        }
    }
    return object;
}

// 设置多选的框
ThreejsDesk.prototype.setPickMore = function () {
    var that = this;

    // 方向：右下角和左上角；边界限制
    this.opts.$box.drag({
        callDown: function (e) {
            if (that.mode !== 'pickMore' || that.objectActiveLock || !that.objectPicker.enable) return;
            e.stopPropagation();  

            var boxOffset = $(this).offset(), leftVal = 0, topVal = 0;
            leftVal = e.pageX - boxOffset.left;
            topVal = e.pageY - boxOffset.top;
            $(this).find('.picker_box').css({
                display: 'block',
                left: leftVal + 'px',
                top: topVal + 'px',
            }).data({'dirY': 'bottom', 'dirX': 'right'});
        },
        callUp: function () {
            if (that.mode !== 'pickMore' || that.objectActiveLock || !that.objectPicker.enable) return;
            $(document).off('mouseup')  // 必须清除事件，否则会被其它元素调用
            that.pickMoreObject();
            $(this).find('.picker_box').css({
                display: 'none',
                left: 0,
                top: 0,
                width: 0,
                height: 0
            })
        },
        callMove: function (dx, dy, e) {
            if (that.mode !== 'pickMore' || that.objectActiveLock || !that.objectPicker.enable) return;
            e.stopPropagation();
            e.preventDefault();

            var $box = $(this).find('.picker_box'),
                heightVal = parseFloat($box.css('height')),
                widthVal = parseFloat($box.css('width')),
                topVal = parseFloat($box.css('top')),
                leftVal = parseFloat($box.css('left')),
                dirY = $box.data('dirY'), dirX = $box.data('dirX'),
                maxX = $(this).width() - 4,
                maxY = $(this).height() - 4;

            if (dirY === 'bottom') {
                if (heightVal + dy < 0) {
                    $box.data('dirY', 'top');

                    if (topVal + dy + heightVal < 0) dy = - topVal - heightVal;
                    $box.css({
                        'height': - (heightVal + dy) + 'px',
                        'top': topVal - (- dy - heightVal) + 'px',
                    });
                } else {
                    if (topVal + heightVal + dy > maxY) dy = maxY - topVal -heightVal;
                    $box.css({
                        'height': (heightVal + dy) + 'px',
                    });
                }
            }

            if (dirY === 'top') {
                if (heightVal - dy < 0) {
                    $box.data('dirY', 'bottom');

                    if ( dy + topVal  > maxY ) dy = maxY - topVal;
                    $box.css({
                        'height': - (heightVal - dy) + 'px',
                        'top': topVal + heightVal + 'px',
                    });
                } else {
                    if ( topVal + dy < 0 ) dy = - topVal;
                    $box.css({
                        'height': (heightVal - dy) + 'px',
                        'top': topVal + dy + 'px',
                    });
                }
            }

            if (dirX === 'right') {
                if (widthVal + dx < 0) {
                    $box.data('dirX', 'left');

                    if ( leftVal + dx + widthVal < 0 ) dx = - leftVal - widthVal;
                    $box.css({
                        'width': - (widthVal + dx) + 'px',
                        'left': leftVal - (- dx - widthVal) + 'px',
                    });
                } else {
                    if ( leftVal + widthVal + dx > maxX ) dx = maxX - leftVal - widthVal;
                    $box.css({
                        'width': (widthVal + dx) + 'px',
                    });
                }
            }

            if (dirX === 'left') {
                if (widthVal - dx < 0) {
                    $box.data('dirX', 'right');

                    if ( dx + leftVal > maxX ) dx = maxX - leftVal;
                    $box.css({
                        'width': - (widthVal - dx) + 'px',
                        'left': leftVal + widthVal + 'px',
                    });
                } else {
                    if ( leftVal + dx < 0 ) dx = - leftVal;
                    $box.css({
                        'width': (widthVal - dx) + 'px',
                        'left': leftVal + dx + 'px',
                    });
                }
            }

        }
    })
}

// 框选后，获取点的范围，获取点的合适间隔，获取射线下相交的物体集合
// 框选范围越大越影响性能，可以正常使用
ThreejsDesk.prototype.pickMoreObject = function () {
    var pickerLeft = parseFloat(this.opts.$pickerBox.css('left')),
        pickerTop = parseFloat(this.opts.$pickerBox.css('top')),
        pickerWidth = this.opts.$pickerBox.width(),
        pickerHeight = this.opts.$pickerBox.height(), 
        interval = 12, dots = [], objects = [], objectBack = {}, obj;

    for (var i = pickerLeft; i < pickerLeft + pickerWidth + interval; i += interval) {
        for (var j = pickerTop; j < pickerTop + pickerHeight + interval; j += interval) {
            dots.push({x: i, y: j});
        }
    }

    if (dots.length > 4) {
        this.setPickerObjects(this.scene);
        for (var i = 0, il = dots.length; i < il; i++) {
            obj = this.pickObjectByDot(dots[i]);
            if ( obj !== null ) objectBack['id' + obj.id] = obj;
        }
        for (var item in objectBack) {
            objects.push(objectBack[item]);
        }
        // console.log(objects)
        this.activeObjects = objects;
        this.showObjectActive();
    }
}