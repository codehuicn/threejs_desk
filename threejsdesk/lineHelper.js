// 初始设置 划线功能  
ThreejsDesk.prototype.setLineHelper = function() {
    var that = this;
    this.lineHelper = {};
    this.lineHelper.enable = false;  // 是否启用划线

    this.lineHelper.dotNow = null;  // 鼠标移动的点 点坐标 
    this.lineHelper.dots = [];      // 正在划线 点坐标数组
    this.lineHelper.dotsSelect = [];// 选择的点 点坐标数组
    this.lineHelper.dotNum = 2000;  // 一条线  点坐标数量上限

    this.lineHelper.circleNow = null;  // 鼠标移动的点 点模型
    this.lineHelper.circles = [];      // 正在划线 点模型数组
    this.lineHelper.circleSelected = null;  // 修改线的点模型 要移动的点模型
    this.lineHelper.circleFind = null;    // 找到的点模型
    this.lineHelper.lineSelected = [];    // 选择的线段
    this.lineHelper.lineFind = null       // 找到的线段

    this.lineHelper.lineNow = null;  // 正在划线 线段模型
    this.lineHelper.lines = [];      // 划线功能的线段集合

    this.lineHelper.colors = {       // 默认的颜色配置
        line: 0x00ff00,   // 实线
        dashedLine: 0x00ff00,  // 虚线
        lineActive: 0xffff00,
        dot: 0xff0000,               // 线上的点
        dotControl: 0xff0000,        // 控制点
        dotActive: 0x0000ff,         // 激活的点
    }
    this.lineHelper.errorLen = 0.5;

    this.lineHelper.key = {};  // 键盘和鼠标的状态 按下 true ；没按 false undefined
    this.lineHelper.$input = $('<input type="text" style="display:none;width:60px;height:20px;position:absolute;background:rgba(200, 200, 200, 0.6);" class="threejs-lineHelper" />');
    this.opts.$box.append(this.lineHelper.$input);

    this.opts.$box.on( 'mousedown', that.pickMouseDown.bind( that ) );  
    this.opts.$box.on( 'mousemove', that.pickMouseMove.bind( that ) );  
    this.opts.$box.on( 'mouseup', that.pickMouseUp.bind( that ) );  
    $(window).on( 'keydown', that.pickKeyDown.bind( that ) );  
    $(window).on( 'keyup', that.pickKeyUp.bind( that ) );  

    this.onSaveLine = null;   // 保存线段回调，保存的线段
    this.onSureLine = null;   // 确定线段回调，确定的线段
    this.onDeleteLine = null; // 删除线段回调，删除的线段
    this.onUpdateLine = null; // 更新线段回调，旧的线段删除的，新的线段新建的
    this.onMoveLine = null;   // 偏移线段位置 回调，旧的线段被复制，新的线段被建立

    // this.objectPicker.enable = false;  // 模型选择功能 禁用
    // this.lineHelper.enable = true;   // 划线功能 启用    
}

// 切换划线功能
ThreejsDesk.prototype.toggleLineHelper = function ( control ) {  
    if ( control ) {
        this.lineHelper.enable = true;
        this.renderer.domElement.style.cursor = 'url("./image/icon-pen.png"), default';
        // this.toggleCirclesVisible(true);
        this.objectPicker.enable = false;
    } else {
        this.lineHelper.enable = false;
        this.renderer.domElement.style.cursor = 'default';
        this.objectPicker.enable = true;

        this.lineHelper.dotNow = null;
        this.scene.remove( this.lineHelper.circleNow );
        this.lineHelper.circleNow = null;
        this.saveLine();
        this.lineHelper.$input.val('').hide();

        this.onSaveLine = null;   // 保存线段回调，保存的线段
        this.onSureLine = null;   // 确定线段回调，确定的线段
        this.onDeleteLine = null; // 删除线段回调，删除的线段
        this.onUpdateLine = null; // 更新线段回调，旧的线段删除的，新的线段新建的
        this.onMoveLine = null;  // 偏移线段位置 回调，旧的线段被复制，新的线段被建立
    }
}

// 清空划线
ThreejsDesk.prototype.clearLines = function () {
    var lines = this.lineHelper.lines, circles;
    if (lines.length > 0) {
        for (var i = 0, il = lines.length; i < il; i++) {
            circles = lines[i].userData.circles;
            for (var j = 0, jl = circles.length; j < jl; j++) {
                this.scene.remove(circles[j]);
            }
            this.scene.remove(lines[i]);
        }
        this.lineHelper.lines = []; 
    }
}


// 键盘按下
ThreejsDesk.prototype.pickKeyDown = function ( event ) {
    // console.log(event.keyCode)
    if (event.keyCode === 17) {
        this.lineHelper.key.ctrl = true;
    }
    if (event.keyCode === 16) {
        this.lineHelper.key.shift = true;  
        if (this.lineHelper.enable) {
            this.orbitControls.enabled = false;  // 禁用 orbitControls ；会冲突

            if (this.lineHelper.circleNow && this.lineHelper.lineNow) {  
                this.lineHelper.dotNow = null;
                this.scene.remove(this.lineHelper.circleNow);
                this.lineHelper.circleNow = null;
                
                this.scene.remove(this.lineHelper.lineNow);
                if (this.lineHelper.lineNow.userData.subtype === 'line') {
                    this.createLine();
                } else {
                    this.createDashedLine();
                }
                this.saveLine();
            } else {
                this.saveLine();
            }
        }
    }
    if (event.keyCode === 18) this.lineHelper.key.alt = true;
}

// 键盘松开
ThreejsDesk.prototype.pickKeyUp = function ( event ) {
    // console.log(event.keyCode)
    if (this.lineHelper.enable) {        
        if (event.keyCode === 13) {    // enter ；显示输入框
            this.lineHelper.$input.val('').show().trigger('focus');
        }

        if (event.keyCode === 17) {    // ctrl ；重置误差范围
            // this.lineHelper.errorLen = 0;
        }

        if (event.keyCode === 27) {    // esc ；隐藏输入框
            this.lineHelper.$input.val('').hide().trigger('blur');
        }

        if (event.keyCode === 32) {       // 空格 ；确定线，把正在划线清空
            this.saveLine();
            if (event.shiftKey) {       // shift + 空格 ；隐藏或显示点模型
                this.toggleCirclesVisible();
            } 
        }

        if (event.keyCode === 46) {    // delete ；删除线段
            if (this.lineHelper.lineSelected.length > 0) {
                for (var i = 0, il = this.lineHelper.lineSelected.length; i < il; i++) {
                    this.deleteLine(this.lineHelper.lineSelected[i]);
                }
                this.lineHelper.lineSelected = [];
            } else {
                this.deleteLine();
            }
        }

        if (event.shiftKey && event.keyCode === 65) {    // shift + a ；显示线段信息
            this.showLineData();
        }

        if (event.ctrlKey && event.keyCode === 66) {    // ctrl + b ；画圆弧曲线
            this.createCircleCurve();
        }

        if (event.altKey && event.keyCode === 66) {    // alt + b ；实线和虚线切换
            if (this.lineHelper.lineNow) {
                if (this.lineHelper.lineNow.userData.subtype === 'line') {
                    this.createDashedLine();
                } else if (this.lineHelper.lineNow.userData.subtype === 'dashedLine') {
                    this.createLine();
                }
            } else {
                this.toggleDashedType();
            }
        }

        if (event.ctrlKey && event.keyCode === 81) {    // ctrl + q ；保存线段 回调，保存的线段
            if (this.onSaveLine) this.onSaveLine(this.lineHelper.lines[this.lineHelper.lines.length - 1]);
        }

        if (event.ctrlKey && event.keyCode === 90) {    // ctrl + z ； 撤销一个点
            this.lineHelper.dots.pop();
            this.scene.remove( this.lineHelper.circles.pop() );
            this.createLine();
        }

        if (event.shiftKey && event.keyCode === 90) {    // shift + z ； 生成体块
            this.getAreaLines();  // 获取线段包围的区域，补充成闭合路径
            this.getAreaDots();  // 按照顺序获取点，生成面积和几何体
        }
    }

    if (event.keyCode === 17) {
        this.lineHelper.key.ctrl = false;
    }

    if (event.keyCode === 16) {
        this.lineHelper.key.shift = false;
        if (this.lineHelper.enable) this.orbitControls.enabled = true;
    }
    if (event.keyCode === 18) this.lineHelper.key.alt = false;
}

// 鼠标松开
ThreejsDesk.prototype.pickMouseDown = function ( event ) { 
    this.lineHelper.key.pageX = event.pageX+5;
    this.lineHelper.key.pageY = event.pageY+30;
    this.lineHelper.key.mouseLeft = false;
    this.lineHelper.key.mouseMove = false;
    if (event.buttons === 1 && !event.ctrlKey) this.lineHelper.key.mouseLeft = true;
}

// 鼠标按下，鼠标左键功能，不能按下 ctrl
ThreejsDesk.prototype.pickMouseUp = function ( event ) {   
    if ( 
        Math.abs(event.pageX+5 - this.lineHelper.key.pageX) > 5 ||
        Math.abs(event.pageY+30 - this.lineHelper.key.pageY) > 5 
     ) {
        this.lineHelper.key.mouseLeft = false;
        this.lineHelper.key.mouseMove = true;
        this.lineHelper.key.pageX = event.pageX+5;
        this.lineHelper.key.pageY = event.pageY+30;
    }
    if (!this.lineHelper.key.mouseLeft) return;
    this.lineHelper.key.mouseLeft = false;

    if (!this.lineHelper.enable) return;
    this.objectPicker.enable = false;    

    this.mouse.setX( ( ( event.pageX+5 - this.opts.$box.offset().left ) / this.opts.$box.innerWidth() ) * 2 - 1 );
    this.mouse.setY( - ( ( event.pageY+30 - this.opts.$box.offset().top ) / this.opts.$box.innerHeight() ) * 2 + 1 );             
    this.raycaster.setFromCamera( this.mouse, this.camera );

    this.lineHelper.$input.css({
        left: (this.mouse.x + 1) / 2 * 100 + '%',
        top: - (this.mouse.y - 1) / 2 * 100 + '%',
        marginTop: '10px'
    });

    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
    var dot = new THREE.Vector3();
    this.raycaster.ray.intersectPlane( plane, dot );
    if (this.lineHelper.dotNow) dot = this.lineHelper.dotNow;

    // 没有按下 shift ；画点，划线
    if (!event.shiftKey && this.lineHelper.dots.length < this.lineHelper.dotNum) {
        if (this.lineHelper.lineNow) {

            var val = this.lineHelper.$input.val();
            if (val) {
                val = parseFloat(val);
                if (!isNaN(val)) {
                    var dot1 = this.lineHelper.dots[this.lineHelper.dots.length-1].clone();
                    var dot2 = dot.clone();
                    var normal = dot2.clone();
                    normal.sub(dot1);
                    normal.setLength(val);
                    normal.add(dot1);
                    dot.set(normal.x, normal.y, normal.z);
                    this.lineHelper.$input.val('').hide();
                }
            }

            if (this.lineHelper.lineNow.userData.subtype === 'line') {
                this.lineHelper.dots.push(dot);
                this.lineHelper.circles.push(this.createDot(dot));
                this.createLine();
            } else if (this.lineHelper.lineNow.userData.subtype === 'dashedLine') {
                this.lineHelper.dots.push(dot);
                this.lineHelper.circles.push(this.createDot(dot));
                this.createDashedLine();
            } else if (this.lineHelper.lineNow.userData.subtype === 'curve') {
                var lineType = this.lineHelper.lineNow.type;
                var dot0 = this.lineHelper.dots[0].clone();
                var circle0 = this.lineHelper.circles[0].clone(true);
                this.saveLine();

                this.lineHelper.dots.push(dot0);
                this.lineHelper.circles.push(circle0);
                this.scene.add(circle0);

                this.lineHelper.dots.push(dot);
                this.lineHelper.circles.push(this.createDot(dot));
                if (lineType === 'Line') {
                    this.createLine();
                } else {
                    this.createDashedLine();
                }
            }
            this.lineHelper.dotsSelect = [];
        } else {
            this.lineHelper.dots.push(dot);
            this.lineHelper.circles.push(this.createDot(dot));
            this.createLine();
        }
    } 

    // 按下 shift ；选择划线功能的线数组上的 最近点模型
    if (event.shiftKey) {  
        this.lineHelper.circleSelected = this.lineHelper.circleFind;  
        if (this.lineHelper.circleSelected) {
            this.lineHelper.dotsSelect.push(new THREE.Vector3(this.lineHelper.circleSelected.position.x, this.lineHelper.circleSelected.position.y, this.lineHelper.circleSelected.position.z))
            if (event.altKey) {
                this.deleteLine(this.lineHelper.circleSelected.userData.line);
                this.lineHelper.circleSelected = null;
            } else if (this.lineHelper.circleSelected.userData.line) {
                var val = this.lineHelper.$input.val();
                val = parseFloat(val);
                if (!isNaN(val)) {
                    this.moveLine(this.lineHelper.circleSelected.userData.line, val);
                    this.lineHelper.$input.val('').hide();
                }
            }
        } else if (this.lineHelper.lineFind) {  
            this.lineHelper.dotsSelect.push(this.lineHelper.dotNow);
            if (event.altKey) {
                this.deleteLine(this.lineHelper.lineFind);
                this.lineHelper.lineFind = null;
            } else {
                this.lineHelper.lineFind.material.color.setHex(this.lineHelper.colors.lineActive);
                this.lineHelper.lineSelected.push(this.lineHelper.lineFind);
    
                var val = this.lineHelper.$input.val();
                val = parseFloat(val);
                if (!isNaN(val)) {
                    this.moveLine(this.lineHelper.lineFind, val);
                    this.lineHelper.$input.val('').hide();
                }
            }
        }

        if (this.lineHelper.lineFind) {
            if (this.lineHelper.lineFind.userData.buildId) {
                // getObjectInfo(this.lineHelper.lineFind.userData.buildId, 1);
                this.setSelectedLines( this.lineHelper.lineFind.userData.buildId );
            }
            
            this.lineHelper.lineFind = null;
        } else {
            // getObjectInfo(0, 0);
            var color = this.lineHelper.colors.line;        
            for (var i = 0, il = this.lineHelper.lineSelected.length; i < il; i++) {
                if (this.lineHelper.lineSelected[i].userData.subtype === 'dashedLine') color = this.lineHelper.colors.dashedLine;
                else color = this.lineHelper.colors.line;
                this.lineHelper.lineSelected[i].material.color.setHex(color);
            }
            this.lineHelper.lineSelected = [];
        }
        
    }
}

// 设置选择的线段到后台
ThreejsDesk.prototype.setSelectedLines = function ( buildId ) {
    this.activeObjects = [];
    var circles = [], lineNow;
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.buildId === buildId) {
            lineNow = this.scene.children[i];
            circles = lineNow.userData.circles;

            if (circles) {
                for (var j = 0, jl = circles.length; j < jl; j++) {
                    circles[j].userData.line = null;
                }
                this.activeObjects.push(lineNow.clone(true));
                for (var j = 0, jl = circles.length; j < jl; j++) {
                    circles[j].userData.line = lineNow;
                }
            } else {
                this.activeObjects.push(lineNow);
            }
        }
    }
    for (var i = 0, il = this.lineHelper.lines.length; i < il; i++) {
        if (!this.lineHelper.lines[i].userData.buildId) {
            lineNow = this.lineHelper.lines[i];
            circles = lineNow.userData.circles;
            lineNow.userData.buildId = buildId;
            lineNow.userData.enableExport = true;

            for (var j = 0, jl = circles.length; j < jl; j++) {
                circles[j].userData.line = null;
            }
            this.activeObjects.push(lineNow.clone(true));
            for (var j = 0, jl = circles.length; j < jl; j++) {
                circles[j].userData.line = lineNow;
            }
        }
    }
}

// 鼠标移动
ThreejsDesk.prototype.pickMouseMove = function ( event ) {
    if (!this.lineHelper.enable) return;

    this.mouse.setX( ( ( event.pageX+5 - this.opts.$box.offset().left ) / this.opts.$box.innerWidth() ) * 2 - 1 );
    this.mouse.setY( - ( ( event.pageY+30 - this.opts.$box.offset().top ) / this.opts.$box.innerHeight() ) * 2 + 1 );             
    this.raycaster.setFromCamera( this.mouse, this.camera );

    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
    var dot = new THREE.Vector3(), active = false;
    this.raycaster.ray.intersectPlane( plane, dot );    

    var dotMin = this.getObjMinDot(), circleMin;  // 模型的点
    if (dotMin && !event.shiftKey) {
        dot = dotMin;
        active = true;
    } else {
        circleMin = this.selectDot(dot);  // 已确定的线的点
        if (circleMin) {
            dot.set(circleMin.position.x, circleMin.position.y, circleMin.position.z);
            active = true;
        } else {
            if (this.lineHelper.dots.length > 0) {
                dotMin = this.getMinDot(dot, this.lineHelper.dots);  // 当前线的点
                if (dotMin) {
                    dot = dotMin;
                    active = true;
                } else {  
                    dotMin = this.getLineDot(dot, this.lineHelper.dots);  // 平行当前线段、垂直当前线段，平行坐标轴
                    if (dotMin) {
                        dot = dotMin;
                        active = true;
                    } 
                }
            }
        }
    }
    this.lineHelper.dotNow = dot;

    // 没有按下 shift ；添加鼠标移动的点
    if (!event.shiftKey) {
        var color = this.lineHelper.colors.line;
        if (this.lineHelper.lineFind) {
            if (this.lineHelper.lineFind.userData.subtype === 'dashedLine') color = this.lineHelper.colors.dashedLine;
            this.lineHelper.lineFind.material.color.setHex(color);
        }
        this.lineHelper.lineFind = null;
        this.lineHelper.circleFind = null;  
        
        if (this.lineHelper.circleNow) {
            this.lineHelper.circleNow.position.set(dot.x, dot.y, dot.z);
            if (active) {
                this.lineHelper.circleNow.material.color.setHex(this.lineHelper.colors.dotActive);
            } else {
                this.lineHelper.circleNow.material.color.setHex(this.lineHelper.colors.dot);
            }
        } else {
            this.lineHelper.circleNow = this.createDot(dot, active);
        }
        
        if (this.lineHelper.lineNow) {
            if (this.lineHelper.lineNow.userData.subtype === 'line') {
                this.createLine();
            } else if (this.lineHelper.lineNow.userData.subtype === 'dashedLine') {
                this.createDashedLine();
            }
        } else {
            this.createLine();
        }

        if (this.lineHelper.circleSelected) {
            var color = this.lineHelper.colors.dot;
            if (this.lineHelper.circleSelected.userData.dotControl) color = this.lineHelper.colors.dotControl;
            this.lineHelper.circleSelected.material.color.setHex(color);
            this.lineHelper.circleSelected = null;
        }
    } else {  // 按下 shift ；鼠标移动的点 查找最近的点模型；保存正在划线
        var color = this.lineHelper.colors.line;
        if (this.lineHelper.lineFind) {
            if (this.lineHelper.lineFind.userData.subtype === 'dashedLine') color = this.lineHelper.colors.dashedLine;
            this.lineHelper.lineFind.material.color.setHex(color);
        }
        
        if (this.lineHelper.key.mouseLeft) {   // 按下鼠标左键
            if (this.lineHelper.circleSelected && !this.lineHelper.circleSelected.userData.fixPos) {
                this.lineHelper.circleSelected.position.set(dot.x, dot.y, dot.z);  
                if (active) {
                    this.lineHelper.circleSelected.material.color.setHex(this.lineHelper.colors.dotActive);
                } else {
                    this.lineHelper.circleSelected.material.color.setHex(this.lineHelper.colors.dot);
                }
                this.lineHelper.circleSelected.visible = true;
                this.updateLine();
            }
        } else {
            if (this.lineHelper.circleNow) {
                this.scene.remove(this.lineHelper.circleNow);
                this.lineHelper.circleNow = null;
            }
    
            if (circleMin) {
                circleMin.material.color.setHex(this.lineHelper.colors.dotActive);
                circleMin.visible = true;
                this.lineHelper.circleFind = circleMin;
            } else {
                var lineData = this.getMinLine(dot, this.scene.children);
                if (lineData) {
                    this.lineHelper.dotNow = lineData.dot;
                    this.lineHelper.circleNow = this.createDot(this.lineHelper.dotNow);
    
                    if ( !this.checkSelectedLine(lineData.line) ) {  
                        this.lineHelper.lineFind = lineData.line;  
                        this.lineHelper.lineFind.material.color.setHex(this.lineHelper.colors.lineActive);
                    }
                }
            }
        }
    }
}

// 检查线是否已经选择
ThreejsDesk.prototype.checkSelectedLine = function ( line ) {
    for (var i = 0, il = this.lineHelper.lineSelected.length; i < il; i++) {
        if (this.lineHelper.lineSelected[i].id === line.id) return true;
    }
    return false;
}

// 创建一个点模型
ThreejsDesk.prototype.createDot = function (dot, active) {
    var geometry = new THREE.SphereBufferGeometry( 1 );
    var material = new THREE.MeshBasicMaterial( { color: active ? this.lineHelper.colors.dotActive : this.lineHelper.colors.dot, opacity: 0.5 } );
    var circle = new THREE.Mesh( geometry, material );

    // var geometry = new THREE.CircleGeometry( 0.3, 32 );
    // var material = new THREE.MeshLambertMaterial( { color: active ? this.lineHelper.colors.dotActive : this.lineHelper.colors.dot } );
    // var circle = new THREE.Mesh( geometry, material );

    circle.position.set(dot.x, dot.y, dot.z);
    circle.rotateX(- Math.PI/2);
    circle.material.transparent = true;
    circle.material.opacity = 0.6;
    this.scene.add( circle );
    // this.objectAutoResize([circle]);
    circle.userData.type = 'lineHelper';
    circle.userData.subtype = 'dot';
    circle.userData.scaleValue = 1;    
    this.setObjectScale([circle]);
    return circle;
}

// 查找最近的点模型
ThreejsDesk.prototype.selectDot = function ( dot ) {
    var circles = [];
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.circles) circles = circles.concat(this.scene.children[i].userData.circles);
    }
    if (circles.length < 1) return;

    var circle = circles[0];  
    var dotMin = new THREE.Vector3(circle.position.x, circle.position.y, circle.position.z);
    var dotTurn = new THREE.Vector3();
    var pos = null, color = this.lineHelper.colors.dot;
    for (var i = 0, il = circles.length; i < il; i++) {
        if (circles[i].userData.dotControl) {
            color = this.lineHelper.colors.dotControl;
        } else {
            color = this.lineHelper.colors.dot;
        }
        circles[i].material.color.setHex(color);
        pos = circles[i].position;
        dotTurn.set(pos.x, pos.y, pos.z);
        if (dotTurn.distanceTo(dot) < dotMin.distanceTo(dot)) {
            dotMin.set(dotTurn.x, dotTurn.y, dotTurn.z);
            circle = circles[i];
        }
    }
    
    if (dotMin.distanceTo(dot) < this.lineHelper.errorLen) {  
        return circle;
    } else {
        return null;
    }
}

// 平行当前线段、垂直当前线段，平行坐标轴，获取误差范围内的点
ThreejsDesk.prototype.getLineDot = function (dot, dots) {
    if (dots.length > 1) {  // 平行当前线段、垂直当前线段
        var len = dots.length, dot1 = dots[len-2].clone(), dot2 = dots[len-1].clone(),
            direction1 = dot2.clone(), direction2, dotPublic, dotPro1, dotPro2, dotProDir1, dotProDir2;

        direction1.sub(dot1);
        direction1.normalize();
        direction2 = direction1.clone();
        direction2.applyAxisAngle( new THREE.Vector3(0, 1, 0), Math.PI/2 );
        
        dotPro1 = dot.clone();
        dotPro1.projectOnPlane(direction2);
        dotProDir1 = dotPro1.clone();
        dotProDir1.sub(dot);
        dotPro2 = dot.clone();
        dotPro2.projectOnPlane(direction1);
        dotProDir2 = dotPro2.clone();
        dotProDir2.sub(dot);
        
        dotPublic = this.getPublicDot(dot, dotProDir1, dot2, direction1);

        if (dotPublic && dotPublic.distanceTo(dot) < this.lineHelper.errorLen) {
            return dotPublic;
        } else {
            dotPublic = this.getPublicDot(dot, dotProDir2, dot2, direction2);
            if (dotPublic && dotPublic.distanceTo(dot) < this.lineHelper.errorLen) { 
                return dotPublic;
            }
        }
    } 
    
    // 平行坐标轴
    var dot0 = this.lineHelper.dots[this.lineHelper.dots.length-1];
    var len0 = this.lineHelper.errorLen;
    if ( Math.abs(dot0.z - dot.z) < len0 ) {
        return dot.setZ(dot0.z);
    } 
    if ( Math.abs(dot0.x - dot.x) < len0 ) {
        return dot.setX(dot0.x);
    }  
    return null;
}

// 确定划线，保存到 划线功能的线数组；点模型和线模型的信息保存到对应的 userData
ThreejsDesk.prototype.saveLine = function () {
    if (! this.lineHelper.lineNow) return;
    
    if (this.lineHelper.circleNow) {  
        this.scene.remove( this.lineHelper.circleNow );
        this.lineHelper.circleNow = null;
        this.lineHelper.dotNow = null;  
        if (this.lineHelper.lineNow.userData.subtype === 'line') {
            this.createLine();
        } else if (this.lineHelper.lineNow.userData.subtype === 'dashedLine') {
            this.createDashedLine();
        }
    }

    if (!this.lineHelper.lineNow) return false;
    this.lineHelper.lines.push(this.lineHelper.lineNow);   
    this.lineHelper.lineNow.userData.circles = this.lineHelper.circles;
    for (var i = 0, il = this.lineHelper.circles.length; i < il; i++) {
        this.lineHelper.circles[i].userData.line = this.lineHelper.lineNow;
    }
    var lenAll = 0, lens = [];
    for (var i = 0, il = this.lineHelper.dots.length; i < il-1; i++) {
        lens.push( this.lineHelper.dots[i].distanceTo(this.lineHelper.dots[i+1]) );
        lenAll += lens[i];
    }
    this.lineHelper.lineNow.userData.lens = lens;
    this.lineHelper.lineNow.userData.lenAll = lenAll;

    this.lineHelper.dots = [];
    this.lineHelper.circleNow = null;
    this.lineHelper.circles = [];
    this.lineHelper.lineNow = null;
    this.toggleCirclesVisible(false);

    // 确定线段回调，确定的线段
    if (this.onSureLine) this.onSureLine(this.lineHelper.lines[this.lineHelper.lines.length - 1]);
}

// 删除线模型
ThreejsDesk.prototype.deleteLine = function (line) { 
    if (line) {
        var circles = line.userData.circles;
        for (var i = 0, il = circles.length; i < il; i++) {
            this.scene.remove(circles[i]);
        }
        this.scene.remove(line);

        // 删除线段 回调，删除的线段
        if (this.onDeleteLine) this.onDeleteLine(line);
    } else {
        if (this.lineHelper.lineNow) {
            this.lineHelper.dotNow = null;
            this.scene.remove( this.lineHelper.circleNow );

            for (var i = 0, il = this.lineHelper.circles.length; i < il; i++) {
                this.scene.remove(this.lineHelper.circles[i])
            }
            this.scene.remove(this.lineHelper.lineNow)

            this.lineHelper.dots = [];
            this.lineHelper.circleNow = null;
            this.lineHelper.circles = [];
            this.lineHelper.lineNow = null;
        } else if (this.lineHelper.lines.length > 0) {
            line = this.lineHelper.lines.pop();
            var circles = line.userData.circles;
            for (var i = 0, il = circles.length; i < il; i++) {
                this.scene.remove(circles[i]);
            }
            this.scene.remove(line);
        }
    }
}

// 创建实线
ThreejsDesk.prototype.createLine = function (lineOld) {   
    if ( this.lineHelper.dotNow ) this.lineHelper.dots.push( this.lineHelper.dotNow );

    if (this.lineHelper.dots.length > 1) { 
        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial( {
            color: this.lineHelper.colors.line,
            linewidth: 1,
            linecap: 'round', 
            linejoin: 'round' 
        } );

        for (var i = 0, il = this.lineHelper.dots.length; i < il; i++) {
            geometry.vertices.push( this.lineHelper.dots[i] );
        }

        var line = new THREE.Line(geometry, material);
        this.scene.add(line);
        if (lineOld) { 
            $.extend(line.userData, lineOld.userData);  
        } else {
            line.userData.type = 'lineHelper';
            line.userData.subtype = 'line';
            line.userData.timeId = (new Date()).getTime() + '_' + line.id;
        }
        if (this.lineHelper.lineNow) this.scene.remove(this.lineHelper.lineNow);
        this.lineHelper.lineNow = line;
    } else {
        if (this.lineHelper.lineNow) {
            this.lineHelper.dots = [];
            for (var i = 0, il = this.lineHelper.circles.length; i < il; i++) {
                this.scene.remove(this.lineHelper.circles[i]);
            }
            this.lineHelper.circles = [];
            this.scene.remove(this.lineHelper.lineNow);
            this.lineHelper.lineNow = null;
        }
    }

    if ( this.lineHelper.dotNow ) this.lineHelper.dots.pop();
}

// 实线和虚线转换
ThreejsDesk.prototype.toggleDashedType = function () {
    if (this.lineHelper.lineSelected.length < 1) return;

    var lineNow, circles, lines = [];
    for (var i = 0, il = this.lineHelper.lineSelected.length; i < il; i++) {
        lineNow = this.lineHelper.lineSelected[i];
        circles = lineNow.userData.circles;

        this.lineHelper.dotNow = null;
        this.lineHelper.dots = [];
        this.lineHelper.circles = [];
        this.scene.remove(this.lineHelper.circleNow);
        this.lineHelper.circleNow = null;
        for (var j = 0, jl = circles.length; j < jl; j++) {
            this.lineHelper.dots.push( new THREE.Vector3(circles[j].position.x, circles[j].position.y, circles[j].position.z) );
            this.lineHelper.circles.push( this.createDot(this.lineHelper.dots[j]) );
        }
        
        if (lineNow.userData.subtype === 'line') {
            this.createDashedLine(lineNow);
            this.lineHelper.lineNow.userData.subtype = 'dashedLine';
        } else {
            this.createLine(lineNow);
            this.lineHelper.lineNow.userData.subtype = 'line';
        }
        lines.push(this.lineHelper.lineNow);
        this.lineHelper.lineNow.material.color.setHex(this.lineHelper.colors.lineActive);
        this.saveLine();
        this.deleteLine(lineNow);
        if (lineNow.userData.buildId) this.setSelectedLines(lineNow.userData.buildId);
    }
    this.lineHelper.lineSelected = lines;
}

// 更新线模型
ThreejsDesk.prototype.updateLine = function () {  
    var circle = this.lineHelper.circleSelected;
    if (!circle) return;  
    var line = circle.userData.line;  
    var circles = line.userData.circles;

    this.lineHelper.dots = [];
    var pos;
    for (var i = 0, il = line.userData.circles.length; i < il; i++) {
        pos = line.userData.circles[i].position;
        this.lineHelper.dots.push( new THREE.Vector3(pos.x, pos.y, pos.z) );
    }
    this.lineHelper.dotNow = null;

    this.lineHelper.circles = circles;
    this.lineHelper.circleNow = null;
    
    this.lineHelper.lineNow = line;
    for (var i = 0, il = this.lineHelper.lines.length; i < il; i++) {  
        if (this.lineHelper.lines[i].userData.timeId === line.userData.timeId) {   
            this.scene.remove(this.lineHelper.lines[i]);
            this.lineHelper.lines.splice(i, 1);
            break;
        }
    }
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.timeId === line.userData.timeId) {   
            this.scene.remove(this.scene.children[i]);
            i--; 
            il--;
        }
    }

    if (line.userData.type === 'lineHelper' && line.userData.subtype === 'line') {
        this.createLine(line);
        this.updateMoveArea(line);
    }
    if (line.userData.type === 'lineHelper' && line.userData.subtype === 'dashedLine') {
        this.createDashedLine(line);
        this.updateMoveArea(line);
    }
    if (line.userData.type === 'lineHelper' && line.userData.subtype === 'curve') {
        this.createCurve(line);
    }

    // 更新线段位置 回调，旧的线段被删除，新的线段被建立
    if (this.onUpdateLine) this.onUpdateLine(line, this.lineHelper.lines[this.lineHelper.lines.length - 1]);
}

// 偏移线模型，复制选择的线段，移动选择的线段
ThreejsDesk.prototype.moveLine = function (line, val) {
    if ( !line ) {
        return;
    }
    if ( line.userData.subtype === 'circleCurve' ) {
        var circleData = {};
        $.extend(circleData, line.userData.circleCurve);
        
        var area1 = circleData.angleCircle * circleData.radius * circleData.radius;
        circleData.radius += val;
        if (circleData.radius <= 0) {
            console.log('曲线半径不能小于0');
            return;
        }
        var area2 = circleData.angleCircle * circleData.radius * circleData.radius;

        var circle = this.createCircleCurveFromData(circleData);
        circle.userData.moveLen = val;
        circle.userData.moveArea = Math.abs(area2 - area1).toFixed(4);
        circle.userData.moveLine = line.userData.timeId;
        return;
    }
    if ( line.userData.subtype !== 'line' && line.userData.subtype !== 'dashedLine' ) {
        console.log('直线或者虚线才能偏移');
        return;
    }

    this.lineHelper.dots = [];
    var pos;
    for (var i = 0, il = line.userData.circles.length; i < il; i++) {
        pos = line.userData.circles[i].position;
        this.lineHelper.dots.push( new THREE.Vector3(pos.x, pos.y, pos.z) );
    }
    this.lineHelper.dotNow = null;

    var dots = this.lineHelper.dots, dotDirection = [], dotVertical = [], dotTemp, dotNew, dotsNew = [];
    this.lineHelper.dots = [];
    for (var i = 0, il = dots.length; i < il-1; i++) {
        dotTemp = dots[i+1].clone();
        dotTemp.sub(dots[i]);
        dotTemp.normalize();
        dotDirection.push(dotTemp.clone());
        dotTemp.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
        dotVertical.push(dotTemp.clone());
        dotTemp.setLength(val);

        dotNew = dots[i].clone();
        dotNew.add(dotTemp);
        dotsNew.push( dotNew );
        dotNew = dots[i+1].clone();
        dotNew.add(dotTemp);
        dotsNew.push( dotNew );
    }

    this.lineHelper.dots.push(dotsNew[0]);
    for (var i = 1, j = 1, il = dotsNew.length; i < il; i++, j++) {
        if (dotDirection[j]) {  
            if ( dotDirection[j].dot(dotDirection[j-1]).toFixed(4) === '1.0000' ) {
                this.lineHelper.dots.push(dotsNew[i]);
                i++;
            } else {
                dotTemp = this.getPublicDot(dotsNew[i], dotDirection[j-1], dotsNew[i+1], dotDirection[j]);
                this.lineHelper.dots.push(dotTemp);
                i++;
            }
        } else {
            this.lineHelper.dots.push(dotsNew[i]);
        }
    }

    this.lineHelper.circles = [];
    if (this.lineHelper.circleNow) {
        this.scene.remove(this.lineHelper.circleNow);
        this.lineHelper.circleNow = null;
    }
    for (var i = 0, il = this.lineHelper.dots.length; i < il; i++) {
        this.lineHelper.circles.push( this.createDot(this.lineHelper.dots[i]) );
    }

    if (line.userData.type === 'lineHelper' && line.userData.subtype === 'line') {
        this.createLine();
        line.material.color.setHex(this.lineHelper.colors.line);
    }
    if (line.userData.type === 'lineHelper' && line.userData.subtype === 'dashedLine') {
        this.createDashedLine();
        line.material.color.setHex(this.lineHelper.colors.dashedLine);
    }
    this.lineHelper.lineNow.userData.moveLine = line.userData.timeId;
    this.lineHelper.lineNow.userData.moveLen = val;
    this.getMoveArea(dots);
    this.saveLine();

    for (var i = 0, il = this.lineHelper.lineSelected.length; i < il; i++) {
        this.lineHelper.lineSelected[i].material.color.setHex(this.lineHelper.lineSelected[i].userData.subtype === 'line' ? this.lineHelper.colors.line : this.lineHelper.colors.dashedLine);
    }
    this.lineHelper.lineSelected = [];
    
    // 偏移线段位置 回调，旧的线段被复制，新的线段被建立
    if (this.onMoveLine) this.onMoveLine(line, this.lineHelper.lines[this.lineHelper.lines.length - 1]);

}

// 更新线段的偏移面积
ThreejsDesk.prototype.updateMoveArea = function (line) {
    if (! line.userData.moveArea) return;

    var line1TimeId = line.userData.moveLine, line2TimeId = line.userData.timeId,
        line1, line2, dots1 = [], dots2 = [], shape, areaValue;
    
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.type === 'lineHelper') {
            if (this.scene.children[i].userData.timeId === line1TimeId) line1 = this.scene.children[i];
            if (this.scene.children[i].userData.timeId === line2TimeId) line2 = this.scene.children[i];
        }
    }

    if (!line1 || !line2) return;

    for (var i = 0, il = line1.userData.circles.length; i < il; i++) {
        dots1.push( new THREE.Vector3(line1.userData.circles[i].position.x, 
            line1.userData.circles[i].position.y, line1.userData.circles[i].position.z) );
    }
    for (var i = 0, il = line2.userData.circles.length; i < il; i++) {
        dots2.push( new THREE.Vector3(line2.userData.circles[i].position.x, 
            line2.userData.circles[i].position.y, line2.userData.circles[i].position.z) );
    }

    dots2.reverse();
    shape = this.createShapeTemp(dots1.concat(dots2));
    areaValue = this.getAreaValue(shape.geometry.vertices, shape.geometry.faces);
    line2.userData.moveArea = areaValue; 
}

// 获取点数据，生成形状，计算面积
ThreejsDesk.prototype.getMoveArea = function (dots) {
    var dotsNew = this.lineHelper.dots, line = this.lineHelper.lineNow, shape, areaValue;
    dotsNew.reverse();
    shape = this.createShapeTemp(dots.concat(dotsNew));
    areaValue = this.getAreaValue(shape.geometry.vertices, shape.geometry.faces);
    line.userData.moveArea = areaValue; 
}

// 创建形状
ThreejsDesk.prototype.createShapeTemp = function (dots) {
    var shape = new THREE.Shape();
    for (var i = 0, il = dots.length; i < il; i++) {
        if (i === 0) {
            shape.moveTo(dots[i].x, dots[i].z);
        } else {
            shape.lineTo(dots[i].x, dots[i].z);
        }
    }
    var geometry = new THREE.ShapeGeometry( shape );
    var material = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
    var mesh = new THREE.Mesh( geometry, material ) ;
    // this.scene.add( mesh );
    return mesh;
}

// 创建几何体
ThreejsDesk.prototype.createObjectTemp = function (dots) {
    var shape = new THREE.Shape();
    for (var i = 0, il = dots.length; i < il; i++) {
        if (i === 0) {
            shape.moveTo(dots[i].x, dots[i].z);
        } else {
            shape.lineTo(dots[i].x, dots[i].z);
        }
    }

    var extrudeSettings = {
        steps: 2,
        depth: 0.5,
        bevelEnabled: false,
    };
    
    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var mesh = new THREE.Mesh( geometry, material ) ;
    // scene.add( mesh );
    return mesh;
}

// 计算面积
ThreejsDesk.prototype.getAreaValue = function (vertices, faces) {
    var areaValue = 0, triangle = new THREE.Triangle();
    for (var i = 0, il = faces.length; i < il; i++) {
        triangle.set(vertices[faces[i].a], vertices[faces[i].b], vertices[faces[i].c]);
        areaValue += triangle.getArea();
    }
    return areaValue;
}

// 创建虚线
ThreejsDesk.prototype.createDashedLine = function (lineOld) {
    if ( this.lineHelper.dotNow ) this.lineHelper.dots.push(this.lineHelper.dotNow);

    if (this.lineHelper.dots.length > 1) {  
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.LineDashedMaterial( {
            color: this.lineHelper.colors.dashedLine,
            linewidth: 1,
            scale: 1,
            dashSize: 1,
            gapSize: 1,
        } );
        var dots = [];
        for (var i = 0, il = this.lineHelper.dots.length; i < il; i++) {
            dots.push(this.lineHelper.dots[i]);
            if ( i > 0 && i < il-1) dots.push(this.lineHelper.dots[i]);
        }
        geometry.setFromPoints(dots)

        var line = new THREE.LineSegments(geometry, material);
        line.computeLineDistances();
        this.scene.add(line);
        if (lineOld) {
            $.extend(line.userData, lineOld.userData);
        } else {
            line.userData.type = 'lineHelper';
            line.userData.subtype = 'dashedLine';
            line.userData.timeId = (new Date()).getTime() + '_' + line.id;
        }
        if (this.lineHelper.lineNow) this.scene.remove(this.lineHelper.lineNow);
        this.lineHelper.lineNow = line;
    } else {
        if (this.lineHelper.lineNow) {
            this.lineHelper.dots = [];
            for (var i = 0, il = this.lineHelper.circles.length; i < il; i++) {
                this.scene.remove(this.lineHelper.circles[i]);
            }
            this.lineHelper.circles = [];
            this.scene.remove(this.lineHelper.lineNow);
            this.lineHelper.lineNow = null;
        }
    }

    if ( this.lineHelper.dotNow ) this.lineHelper.dots.pop();
}

// 画曲线，贝塞尔曲线
ThreejsDesk.prototype.createCurve = function (lineOld) {
    if (this.lineHelper.dots.length < 4) {
        console.log('画曲线至少要4个点')
        return;
    }

    var dots = [], circles = [], lineType = this.lineHelper.lineNow.type;
    for (var i = 0; i < 4; i++) {
        dots.push( this.lineHelper.dots.pop() );
        circles.push( this.lineHelper.circles.pop() );
    }
    this.lineHelper.dotNow = null;
    if (this.lineHelper.circleNow) this.scene.remove(this.lineHelper.circleNow);
    this.lineHelper.circleNow = null;

    this.lineHelper.dots.push(dots[3].clone());
    var circle3 = circles[3].clone(true);
    this.lineHelper.circles.push(circle3);
    this.scene.add(circle3);
    if (lineType === 'Line') {
        this.createLine(this.lineHelper.lineNow);
    } else {
        this.createDashedLine(this.lineHelper.lineNow);
    }
    this.saveLine();

    var curve = new THREE.CubicBezierCurve3(
        dots[0],
        dots[1],
        dots[2],
        dots[3]
    );    
    var points = curve.getPoints( 50 );

    if (lineType === 'Line') {
        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        var material = new THREE.LineBasicMaterial( { color : this.lineHelper.colors.line } );
        var curveObject = new THREE.Line( geometry, material );
    } else {
        var pointsNew = [];
        for (var i = 0, il = points.length; i < il; i++) {
            pointsNew.push(points[i]);
            if (i > 0 && i < il - 1) pointsNew.push(points[i]);
        }
        var geometry = new THREE.BufferGeometry().setFromPoints( pointsNew );
        var material = new THREE.LineDashedMaterial( {
            color: this.lineHelper.colors.dashedLine,
            linewidth: 1,
            scale: 1,
            dashSize: 1,
            gapSize: 1,
        } );
        var curveObject = new THREE.LineSegments( geometry, material );
        curveObject.computeLineDistances();
    }

    this.scene.add(curveObject);  
    if (lineOld) {
        $.extend(curveObject.userData, lineOld.userData);
    } else {
        curveObject.userData.type = 'lineHelper';
        curveObject.userData.subtype = 'curve';
        curveObject.userData.timeId = (new Date()).getTime() + '_' + curveObject.id;
    }
    this.lineHelper.lineNow = curveObject;

    this.lineHelper.dotNow = null;
    this.lineHelper.dots = dots;
    this.lineHelper.circleNow = null;
    this.lineHelper.circles = circles;
    circles[1].userData.dotControl = true;
    circles[1].material.color.setHex(this.lineHelper.colors.dotControl);
    circles[2].userData.dotControl = true;
    circles[2].material.color.setHex(this.lineHelper.colors.dotControl);
}

// 画曲线，圆弧曲线
// 两条线段的延长交点，两条线段的垂线，圆弧半径，交点夹角，计算切点、圆心，和 x 轴的夹角
// 点、线、线偏移交点、曲线、曲线偏移半径、面、模型
ThreejsDesk.prototype.createCircleCurve = function () {
    var lines = [];
    if (this.lineHelper.lineSelected.length > 1) {
        lines = this.lineHelper.lineSelected;
    } else 
    if (this.lineHelper.lines.length > 1) {
        lines = this.lineHelper.lines;
    } else {
        console.log('画圆弧曲线至少要2条线');
        return;
    }

    var line1, line2, dotPublic, line1Direction, line2Direction, line1Vertical, line2Vertical, 
        angleCircle, dotCircle, line1DotTriangle, line2DotTriangle, angleRotation,
        radius = 8, val = this.lineHelper.$input.val(), lineType;

    val = parseFloat(val);
    if (!isNaN(val) && val > 0) radius = val;
    this.lineHelper.$input.val('').hide();

    line1 = lines[lines.length - 2];
    line2 = lines[lines.length - 1];
    lineType = line1.userData.subtype;
    if (line1.userData.subtype !== 'line' && line1.userData.subtype !== 'dashedLine') {
        console.log('画圆弧曲线需要2条直线');
        return;
    }
    if (line2.userData.subtype !== 'line' && line2.userData.subtype !== 'dashedLine') {
        console.log('画圆弧曲线需要2条直线');
        return;
    }

    // 获取点击的位置
    var dotsSelect = this.lineHelper.dotsSelect, dotClick1, dotClick2;
    dotClick1 = dotsSelect[dotsSelect.length - 2];
    dotClick2 = dotsSelect[dotsSelect.length - 1];

    // 获取线段的方向
    line1Direction = line1.userData.circles[line1.userData.circles.length - 1];
    line1Direction = new THREE.Vector3(line1Direction.position.x, line1Direction.position.y, line1Direction.position.z);

    var line1Dot = line1.userData.circles[0];
    line1Dot = new THREE.Vector3(line1Dot.position.x, line1Dot.position.y, line1Dot.position.z);

    if (dotClick1 && dotClick1.distanceTo(line1Dot) > dotClick1.distanceTo(line1Direction)) {
        line1Dot = line1.userData.circles[line1.userData.circles.length - 2];
        line1Dot = new THREE.Vector3(line1Dot.position.x, line1Dot.position.y, line1Dot.position.z);
    } else {
        line1Direction = line1.userData.circles[1];
        line1Direction = new THREE.Vector3(line1Direction.position.x, line1Direction.position.y, line1Direction.position.z);
    }

    line1Direction.sub(line1Dot);
    line1Direction.normalize();

    line2Direction = line2.userData.circles[0];
    line2Direction = new THREE.Vector3(line2Direction.position.x, line2Direction.position.y, line2Direction.position.z);

    var line2Dot = line2.userData.circles[line2.userData.circles.length - 1];
    line2Dot = new THREE.Vector3(line2Dot.position.x, line2Dot.position.y, line2Dot.position.z);

    if (dotClick2 && dotClick2.distanceTo(line2Dot) > dotClick2.distanceTo(line2Direction)) {
        line2Dot = line2.userData.circles[1];
        line2Dot = new THREE.Vector3(line2Dot.position.x, line2Dot.position.y, line2Dot.position.z);
    } else {
        line2Direction = line2.userData.circles[line2.userData.circles.length - 2];
        line2Direction = new THREE.Vector3(line2Direction.position.x, line2Direction.position.y, line2Direction.position.z);
    }

    line2Direction.sub(line2Dot);
    line2Direction.normalize();

    // 获取线段交点
    dotPublic = this.getPublicDot(line1Dot, line1Direction, line2Dot, line2Direction);
    if (!dotPublic) {
        console.log('两条线的交点找不到');
        return;
    }  

    // 修改线段的方向
    line1Direction = dotPublic.clone();
    line2Direction = dotPublic.clone();
    line1Direction.sub(line1Dot);
    line2Direction.sub(line2Dot);
    line1Direction.normalize();
    line2Direction.normalize();

    // 获取线段垂线的方向
    line1Vertical = line1Direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
    if (line1Vertical.dot(line2Direction) > 0) {
        line1Vertical.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        line2Vertical = line2Direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
    } else if (line1Vertical.dot(line2Direction) < 0) {
        line2Vertical = line2Direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
    } else if (line1Vertical.dot(line2Direction) === 0) {
        console.log('两条线平行，无法绘制圆弧曲线');
        return;
    }
    
    // 圆心夹角
    angleCircle = line1Direction.dot(line2Direction);
    angleCircle = Math.acos(angleCircle);
    angleCircle = Math.PI - angleCircle;

    // 获取圆心
    var line1Triangle = radius * Math.tan(angleCircle / 2);
    var line1DirectionTriangle = line1Direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    line1DirectionTriangle.setLength(line1Triangle);
    var line1DotTriangle = dotPublic.clone();
    line1DotTriangle.add(line1DirectionTriangle);

    var line2DirectionTriangle = line2Direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    line2DirectionTriangle.setLength(line1Triangle);
    var line2DotTriangle = dotPublic.clone();
    line2DotTriangle.add(line2DirectionTriangle);

    dotCircle = this.getPublicDot(line1DotTriangle, line1Vertical, line2DotTriangle, line2Vertical);
    if (!dotCircle) {
        console.log('圆心找不到');
        return;
    }

    // 圆弧与 x 轴的偏移角度
    var xNormal = new THREE.Vector3(1, 0, 0);
    var line1VerticalReverse = line1Vertical.clone();
    line1VerticalReverse.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    var line2VerticalReverse = line2Vertical.clone();
    line2VerticalReverse.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    var line12Vertical = line1VerticalReverse.clone();
    line12Vertical.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleCircle);
    if ( 
        Math.abs(line12Vertical.x - line2VerticalReverse.x) < 0.0001 && 
        Math.abs(line12Vertical.y - line2VerticalReverse.y) < 0.0001 && 
        Math.abs(line12Vertical.z - line2VerticalReverse.z) < 0.0001 
    ) {
        angleRotation = line1VerticalReverse.dot(xNormal);
        angleRotation = Math.acos(angleRotation);
        if (line1VerticalReverse.z > 0) angleRotation = - angleRotation;
    } else {
        angleRotation = line2VerticalReverse.dot(xNormal);
        angleRotation = Math.acos(angleRotation);
        if (line2VerticalReverse.z > 0) angleRotation = - angleRotation;
    }

    // 画圆弧
    var geometry = new THREE.CircleGeometry( radius, 3*radius, 0, angleCircle );    
    var material = new THREE.LineBasicMaterial( { color : this.lineHelper.colors.line } );
    var circle = new THREE.Line( geometry, material );

    circle.position.set(dotCircle.x, dotCircle.y, dotCircle.z);
    circle.rotateX(- Math.PI/2);
    circle.rotateZ(angleRotation);
    circle.updateMatrixWorld();

    var dots = [], dot0, dot1;
    for (var i = 1, il = geometry.vertices.length; i < il; i++) {
        dots.push(new THREE.Vector3(geometry.vertices[i].x, geometry.vertices[i].y, geometry.vertices[i].z))
        circle.localToWorld(dots[i - 1])
        if (i === 1) dot0 = dots[i - 1];
        if (i === il - 1) dot1 = dots[il - 2];
    }
    this.lineHelper.dotNow = null;
    this.lineHelper.dots = dots;
    this.scene.remove(this.lineHelper.circleNow);
    this.lineHelper.circleNow = null;
    this.lineHelper.circles = [];
    var circle0 = this.createDot(dot0);
    var circle1 = this.createDot(dot1);
    var circle2 = this.createDot(dotCircle);
    this.lineHelper.lineNow = null;
    if (lineType === 'line') {
        this.createLine();
    } else {
        this.createDashedLine();
    }
    this.scene.add( this.lineHelper.lineNow );

    this.lineHelper.lineNow.userData.type = 'lineHelper';
    this.lineHelper.lineNow.userData.subtype = 'circleCurve';
    this.lineHelper.lineNow.userData.timeId = (new Date).getTime() + '_' + this.lineHelper.lineNow.id;
    
    this.lineHelper.lineNow.userData.circleCurve = {
        dotPublic: dotPublic, line1Direction: line1Direction, line2Direction: line2Direction, 
        line1Vertical: line1Vertical, line2Vertical: line2Vertical, 
        angleCircle: angleCircle, dotCircle: dotCircle, 
        line1DotTriangle: line1DotTriangle, line2DotTriangle: line2DotTriangle, 
        angleRotation: angleRotation, radius: radius, lineType: lineType
    }

    this.lineHelper.lineNow.userData.circles = [circle2, circle0, circle1];
    circle0.userData.line = this.lineHelper.lineNow;
    circle1.userData.line = this.lineHelper.lineNow;
    circle2.userData.line = this.lineHelper.lineNow;
    circle0.userData.fixPos = true;
    circle1.userData.fixPos = true;
    circle2.userData.fixPos = true;
    circle2.userData.dotControl = true;
    circle2.material.color.setHex(this.lineHelper.colors.dotControl);

    if (this.lineHelper.lineSelected.length > 1) {
        for (var i = 0, il = lines.length; i < il; i++) {
            lines[i].material.color.setHex(lines[i].userData.subtype === 'line' ? this.lineHelper.colors.line : this.lineHelper.colors.dashedLine);
        }
        this.lineHelper.lineSelected = [];
        
        for(var i = 0, il = this.lineHelper.lines.length; i < il; i++) {
            if (this.lineHelper.lines[i].id === line2.id) {
                this.lineHelper.lines.splice(i, 0, this.lineHelper.lineNow);
                break;
            }
        }
    } else {
        line2 = lines.pop();
        lines.push(this.lineHelper.lineNow);
        lines.push(line2);
    }

    this.lineHelper.dotNow = null;
    this.lineHelper.dots = [];
    this.lineHelper.circleNow = null; 
    this.lineHelper.circles = [];
    this.lineHelper.lineNow = null;

    var line1Result = this.trimLine(line1, line1Direction, line1DotTriangle);
    var line2Result = this.trimLine(line2, line2Direction, line2DotTriangle);
    for(var i = 0, il = this.lineHelper.lines.length; i < il; i++) {
        if ( (this.lineHelper.lines[i].id === line1.id && line1Result) || 
                (this.lineHelper.lines[i].id === line2.id && line2Result) ) {
            this.lineHelper.lines.splice(i, 1);
            i--;
            il--;
        }
    }
    if (line1Result) {
        this.updateMoveArea(line1Result);
        this.deleteLine(line1);
    }
    if (line2Result) {
        this.updateMoveArea(line2Result);
        this.deleteLine(line2);
    }
    
    // var arrowHelper = new THREE.ArrowHelper( line2DotPro, line2DotPro, 11, 0xffff00 );
    // this.scene.add( arrowHelper );

}

// 截断线段
ThreejsDesk.prototype.trimLine = function (line, direction, dot) {  
    if (line.userData.subtype !== 'line' && line.userData.subtype !== 'dashedLine') return false;
    var circles = line.userData.circles, dots = [], directionTemp, check = false, dotTemp, circlesRight = [],
        circlesError = [], turn;

    direction.normalize();
    this.saveLine();

    for (var i = 0, il = circles.length; i < il; i++) {
        dotTemp = new THREE.Vector3(circles[i].position.x, circles[i].position.y, circles[i].position.z);
        dots.push(dotTemp);
    }

    for (var i = 0, il = dots.length; i < il; i++) {
        if (i+1 < il) {
            directionTemp = dots[i+1].clone();
            directionTemp.sub(dots[i]);
            directionTemp.normalize();
            check = (Math.abs(parseFloat(directionTemp.dot(direction).toFixed(4))) === 1);
        }
        if ( !check && (i-1 >= 0) ) {
            directionTemp = dots[i-1].clone();
            directionTemp.sub(dots[i]);
            directionTemp.normalize();
            check = (Math.abs(parseFloat(directionTemp.dot(direction).toFixed(4))) === 1);
        }
        
        if ( check ) {
            directionTemp = dot.clone();
            directionTemp.sub(dots[i]);
            directionTemp.normalize();
            if ( parseFloat(directionTemp.dot(direction).toFixed(4)) === 1 ) {
                circlesRight.push(circles[i]);
            }
            if ( parseFloat(directionTemp.dot(direction).toFixed(4)) === -1 ) {
                circlesError.push(circles[i]);
            }
        } 
    }

    // 判断线段留下部分的方向
    if (circlesError.length > 0 && circlesRight.length > 0) {
        turn = circlesError[0].id - circlesRight[0].id;
    } else if (circlesRight.length > 1) {
        var dot0 = new THREE.Vector3(circlesRight[0].position.x, circlesRight[0].position.y, 
            circlesRight[0].position.z),
            dot1 = new THREE.Vector3(circlesRight[1].position.x, circlesRight[1].position.y, 
            circlesRight[1].position.z);
        
        if (dot0.distanceTo(dot) > dot1.distanceTo(dot)) {
            turn = circlesRight[1].id - circlesRight[0].id;
        } else {
            turn = circlesRight[0].id - circlesRight[1].id;
        }
    } else if (circlesError.length > 1) {
        var dot0 = new THREE.Vector3(circlesError[0].position.x, circlesError[0].position.y, 
            circlesError[0].position.z),
            dot1 = new THREE.Vector3(circlesError[1].position.x, circlesError[1].position.y, 
            circlesError[1].position.z);
        
        if (dot0.distanceTo(dot) > dot1.distanceTo(dot)) {
            turn = circlesError[0].id - circlesError[1].id;
        } else {
            turn = circlesError[1].id - circlesError[0].id;
        }
    }

    // 从小到大获取点
    if (turn > 0) {
        for (var i = 0, il = circles.length; i < il; i++) {
            if (circlesError.length > 0 && circles[i].id === circlesError[0].id) break;
            this.lineHelper.circles.push(this.createDot(dots[i]));
            this.lineHelper.dots.push(dots[i]);
            if (circlesRight.length > 0 && circles[i].id === circlesRight[circlesRight.length-1].id) break;
        }
    } else if (turn < 0) {
        for (var i = circles.length - 1; i >= 0; i--) {
            if (circlesError.length > 0 && circles[i].id === circlesError[circlesError.length-1].id) break;
            this.lineHelper.circles.push(this.createDot(dots[i]));
            this.lineHelper.dots.push(dots[i]);
            if (circlesRight.length > 0 && circles[i].id === circlesRight[0].id) break;
        }
    } else {
        console.log('无法处理线段');
        console.log(circlesRight);
        console.log(circlesError);

        return false;
    }
    this.lineHelper.dots.push(dot);
    this.lineHelper.circles.push( this.createDot(dot) );

    if (line.userData.subtype === 'line') {
        this.createLine(line);
    } else {
        this.createDashedLine(line);
    }
    this.saveLine();
    return this.lineHelper.lines[this.lineHelper.lines.length-1];
}

// 画曲线，圆弧曲线，偏移的曲线
ThreejsDesk.prototype.createCircleCurveFromData = function (circleData) {
    if (!circleData) {
        return;
    }

    var dotPublic = circleData.dotPublic, line1Direction = circleData.line1Direction, line2Direction = circleData.line2Direction, 
        line1Vertical = circleData.line1Vertical, line2Vertical = circleData.line2Vertical, 
        angleCircle = circleData.angleCircle, dotCircle = circleData.dotCircle, 
        line1DotTriangle = circleData.line1DotTriangle, line2DotTriangle = circleData.line2DotTriangle, 
        angleRotation = circleData.angleRotation,
        radius = circleData.radius, lineType = circleData.lineType;

    // 画圆弧
    var geometry = new THREE.CircleGeometry( radius, 3*radius, 0, angleCircle );    
    var material = new THREE.LineBasicMaterial( { color : this.lineHelper.colors.line } );
    var circle = new THREE.Line( geometry, material );

    circle.position.set(dotCircle.x, dotCircle.y, dotCircle.z);
    circle.rotateX(- Math.PI/2);
    circle.rotateZ(angleRotation);
    circle.updateMatrixWorld();

    var dots = [], dot0, dot1;
    for (var i = 1, il = geometry.vertices.length; i < il; i++) {
        dots.push(new THREE.Vector3(geometry.vertices[i].x, geometry.vertices[i].y, geometry.vertices[i].z))
        circle.localToWorld(dots[i - 1])
        if (i === 1) dot0 = dots[i - 1];
        if (i === il - 1) dot1 = dots[il - 2];
    }
    this.lineHelper.dotNow = null;
    this.lineHelper.dots = dots;
    this.scene.remove(this.lineHelper.circleNow);
    this.lineHelper.circleNow = null;
    this.lineHelper.circles = [];
    var circle0 = this.createDot(dot0);
    var circle1 = this.createDot(dot1);
    var circle2 = this.createDot(dotCircle);
    this.scene.remove(circle2);
    this.lineHelper.lineNow = null;
    if (lineType === 'line') {
        this.createLine();
    } else {
        this.createDashedLine();
    }
    // this.scene.add( this.lineHelper.lineNow );

    this.lineHelper.lineNow.userData.type = 'lineHelper';
    this.lineHelper.lineNow.userData.subtype = 'circleCurve';
    this.lineHelper.lineNow.userData.timeId = (new Date()).getTime() + '_' + this.lineHelper.lineNow.id;
    
    this.lineHelper.lineNow.userData.circleCurve = {
        dotPublic: dotPublic, line1Direction: line1Direction, line2Direction: line2Direction, 
        line1Vertical: line1Vertical, line2Vertical: line2Vertical, 
        angleCircle: angleCircle, dotCircle: dotCircle, 
        line1DotTriangle: line1DotTriangle, line2DotTriangle: line2DotTriangle, 
        angleRotation: angleRotation, radius: radius, lineType: lineType
    }

    this.lineHelper.lineNow.userData.circles = [circle2, circle0, circle1];
    circle0.userData.line = this.lineHelper.lineNow;
    circle1.userData.line = this.lineHelper.lineNow;
    circle2.userData.line = this.lineHelper.lineNow;
    circle0.userData.fixPos = true;
    circle1.userData.fixPos = true;
    circle2.userData.fixPos = true;
    circle2.userData.dotControl = true;
    circle2.material.color.setHex(this.lineHelper.colors.dotControl);

    line2 = this.lineHelper.lineNow;
    this.lineHelper.lines.push(line2);

    this.lineHelper.dotNow = null;
    this.lineHelper.dots = [];
    this.lineHelper.circleNow = null;
    this.lineHelper.circles = [];
    this.lineHelper.lineNow = null;

    return line2;

    // var arrowHelper = new THREE.ArrowHelper( line2DotPro, line2DotPro, 11, 0xffff00 );
    // this.scene.add( arrowHelper );

}

// 显示或隐藏点
ThreejsDesk.prototype.toggleCirclesVisible = function (type) { 
    var lineNow, circleNow, visibleType = 0;
    if (type === true) visibleType = !type;
    if (type === false) visibleType = !type;
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        lineNow = this.scene.children[i];
        if (lineNow.userData.circles) {
            for (var j = 0, jl = lineNow.userData.circles.length; j < jl; j++) {
                circleNow = lineNow.userData.circles[j];
                if (visibleType === 0) visibleType = circleNow.visible;
                circleNow.visible = !visibleType;
            }
        }
    }
}

// 显示线段的信息
ThreejsDesk.prototype.showLineData = function () {
    var line;
    if (this.lineHelper.circleFind) {
        line = this.lineHelper.circleFind.userData.line;
        if (!line) return;
    } else
    if (this.lineHelper.lineFind) {
        line = this.lineHelper.lineFind;
    } else {
        return;
    }

    if (line.userData.subtype === 'line' || line.userData.subtype === 'dashedLine') {
        // var str = '<div><div> 线段总长度为：'+line.userData.lenAll.toFixed(4)+'m </div>';
        // for(var i = 0, il = line.userData.lens.length; i < il; i++) {
        //     str += '<div> 第'+(i+1)+'段长度为：'+line.userData.lens[i].toFixed(4)+'m </div>';
        // }
        // if (line.userData.moveLen) str += '<div> 线段偏移了'+line.userData.moveLen+'m </div>';
        // if (line.userData.moveArea) str += '<div> 线段偏移的面积'+line.userData.moveArea+'平方米 </div>';
        // str += '</div>';
        // $.YH.box({
        //     target: $(str), 
        //     title: '线段信息', 
        //     show: true, 
        //     hide: true, 
        //     ok: function(){},
        //     cancel: function(){}
        // })
        var str = '线段总长度为：'+line.userData.lenAll.toFixed(4)+'m \n';
        for(var i = 0, il = line.userData.lens.length; i < il; i++) {
            str += '第'+(i+1)+'段长度为：'+line.userData.lens[i].toFixed(4)+'m \n';
        }
        if (line.userData.moveLen) str += '线段偏移了'+line.userData.moveLen+'m \n';
        if (line.userData.moveArea) str += '线段偏移的面积'+line.userData.moveArea+'平方米 \n';
        alert(str)
    }
    if (line.userData.subtype === 'circleCurve') {
        // var data = line.userData.circleCurve;
        // var str = '<div><div> 圆弧半径为：'+data.radius+'m </div>';
        // str += '<div> 圆弧弧度为：'+(data.angleCircle / Math.PI * 180).toFixed(2)+'度 </div>';
        // str += '<div> 圆弧弧长为：'+(data.radius * data.angleCircle).toFixed(4)+'m </div>';
        // if (line.userData.moveLen) str += '<div> 圆弧偏移了'+line.userData.moveLen+'m </div>';
        // if (line.userData.moveArea) str += '<div> 圆弧偏移的面积'+line.userData.moveArea+'平方米 </div>';
        // str += '</div>';
        // $.YH.box({
        //     target: $(str), 
        //     title: '圆弧信息', 
        //     show: true, 
        //     hide: true, 
        //     ok: function(){},
        //     cancel: function(){}
        // })
        var data = line.userData.circleCurve;
        var str = '圆弧半径为：'+data.radius+'m \n';
        str += '圆弧弧度为：'+(data.angleCircle / Math.PI * 180).toFixed(2)+'度 \n';
        str += '圆弧弧长为：'+(data.radius * data.angleCircle).toFixed(4)+'m \n';
        if (line.userData.moveLen) str += '圆弧偏移了'+line.userData.moveLen+'m \n';
        if (line.userData.moveArea) str += '圆弧偏移的面积'+line.userData.moveArea+'平方米 \n';
        alert(str);
    }
}

// 获取两条线的交点
ThreejsDesk.prototype.getPublicDot = function (line1Dot, line1Direction, line2Dot, line2Direction) {
    var dotPublic = new THREE.Vector3(0, -3000, 0);

    function run () {
        var ray = new THREE.Ray( line1Dot, line1Direction );
        var line2DotPro = line2Dot.clone();
        var line2Vertical = line2Direction.clone();
        line2Vertical.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
        line2DotPro.projectOnVector(line2Vertical);
        var line2Pos = (line2DotPro.x * line2Vertical.x > 0 ? -1 : 1) * line2DotPro.distanceTo(new THREE.Vector3(0, 0, 0));
        var plane2 = new THREE.Plane( line2Vertical, line2Pos );
        ray.intersectPlane( plane2, dotPublic );
    }
    run();

    if ( dotPublic.y > -2900 ) {
        return dotPublic;
    } else {
        line1Direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        run();
        line1Direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        if ( dotPublic.y > -2900 ) {
            return dotPublic;
        } else {
            console.log('无法获取交点：', dotPublic);
            return null;
        }
    }
}

// 获取最近的点  
ThreejsDesk.prototype.getMinDot = function ( dot, dots ) {
    if (dots.length > 0) {
        var dotMin = dots[0].clone();
        for (var i = 1, il = dots.length; i < il; i++) {
            if (dots[i].distanceTo(dot) < dotMin.distanceTo(dot)) {
                dotMin = dots[i].clone();
            }
        }
        if (dotMin.distanceTo(dot) < this.lineHelper.errorLen) return dotMin;
    }
    return null;
}

// 获取模型最近的点
ThreejsDesk.prototype.getObjMinDot = function () { 
    this.setPickerObjects(this.scene);
    this.intersects = this.raycaster.intersectObjects( this.objectPicker.objects );

    var point, dotMin;

    if (this.intersects.length > 0) {
        point = this.intersects[0].point;

        var pickObj = this.intersects[0].object;
        pickObj.updateMatrixWorld();
        if (pickObj.geometry.attributes) {  
            var pos = pickObj.geometry.attributes.position, arr = pos.array, count = pos.count, 
                dot = new THREE.Vector3(), matrix = pickObj.matrixWorld;

            for (var i = 0; i < count; i++) {
                dot.set(arr[i*3], arr[i*3+1], arr[i*3+2]);
                dot.applyMatrix4(matrix);
                if (point.distanceTo(dot) < this.lineHelper.errorLen) {
                    if (dotMin) {
                        if (dotMin.distanceTo(point) > dot.distanceTo(point)) dotMin = dot.clone();
                    } else {
                        dotMin = dot.clone();
                    }
                }
            }
        }
    }

    if (dotMin) return dotMin;
    if (point) return point;
    return null;
}

// 获取最近的线
ThreejsDesk.prototype.getMinLine = function (dot, lines) {
    var lineCurrent, dot1 = new THREE.Vector3(), dot2 = new THREE.Vector3(), dot3 = new THREE.Vector3(), 
        circle1, circle2, circle3, lineDirection, lineVertical, lenMin, lineMin, dotPro, dotMin, 
        dotProDir1, dotProDir2, check = false, angleDot;

    for (var i = 0, il = lines.length; i < il; i++) {
        if (lines[i].userData.subtype === 'line' || lines[i].userData.subtype === 'dashedLine') {
            lineCurrent = lines[i];
            
            for (var j = 0, jl = lineCurrent.userData.circles.length; j < jl-1; j++) {
                circle1 = lineCurrent.userData.circles[j];
                circle2 = lineCurrent.userData.circles[j+1];
                dot1.set(circle1.position.x, circle1.position.y, circle1.position.z);
                dot2.set(circle2.position.x, circle2.position.y, circle2.position.z);
                lineDirection = dot2.clone();
                lineDirection = lineDirection.sub(dot1);
                lineVertical = lineDirection.clone();
                lineVertical.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
                lineDirection.normalize();
                lineVertical.normalize();

                dotPro = dot.clone(); 
                dotPro.projectOnPlane(lineVertical);
                dotPro.sub(dot);
                dotPro = this.getPublicDot(dot, dotPro, dot1, lineDirection);
                if (!dotPro) return null;

                dotProDir1 = dotPro.clone();
                dotProDir2 = dotPro.clone();
                dotProDir1.sub(dot1);
                dotProDir2.sub(dot2);
                dotProDir1.normalize();
                dotProDir2.normalize();
                check = dotProDir1.dot(dotProDir2);

                if ( ( !lenMin || lenMin > dotPro.distanceTo(dot) ) && (check.toFixed(4) === '-1.0000') ) {
                    lenMin = dotPro.distanceTo(dot);
                    lineMin = lineCurrent;
                    dotMin = dotPro.clone();
                } 
            }
        } else if (lines[i].userData.subtype === 'circleCurve') {
            lineCurrent = lines[i];
            circle1 = lineCurrent.userData.circles[0];
            circle2 = lineCurrent.userData.circles[1];
            circle3 = lineCurrent.userData.circles[2];
            dot1.set(circle1.position.x, circle1.position.y, circle1.position.z);
            dot2.set(circle2.position.x, circle2.position.y, circle2.position.z);
            dot3.set(circle3.position.x, circle3.position.y, circle3.position.z);

            lineDirection = dot.clone();
            lineDirection.sub(dot1);
            lineDirection.setLength(lineCurrent.userData.circleCurve.radius);
            dotPro = dot1.clone();
            dotPro.add(lineDirection);

            dotProDir1 = dotPro.clone();
            dotProDir2 = dotPro.clone();
            dotProDir1.sub(dot2);
            dotProDir2.sub(dot3);
            dotProDir1.normalize();
            dotProDir2.normalize();
            angleDot = dotProDir1.dot(dotProDir2);
            angleDot = Math.acos(angleDot);
            check = angleDot / (2*Math.PI - lineCurrent.userData.circleCurve.angleCircle);

            if ( ( !lenMin || lenMin > dotPro.distanceTo(dot) ) && (check.toFixed(4) === '0.5000') ) {
                lenMin = dotPro.distanceTo(dot);
                lineMin = lineCurrent;
                dotMin = dotPro.clone();
            } 
        }
    } 

    if (lenMin && lenMin < this.lineHelper.errorLen) {
        return {
            dot: dotMin,
            line: lineMin
        };
    } else {
        return null;
    }
    
}

// 判断两个点是否近似相等
ThreejsDesk.prototype.aboutEqualDots = function ( dot1, dot2 ) {
    if (!dot1 || !dot2) return false;
    if (
        Math.abs(dot1.x - dot2.x) < 0.000001 &&
        Math.abs(dot1.y - dot2.y) < 0.000001 &&
        Math.abs(dot1.z - dot2.z) < 0.000001 
    ) {
        return true;
    } else {
        return false;
    }
}

// 获取 buildId 下的线段，获取当前绘制的线段
// 线段偏移后，没有连接的要连接，加入线段
// 线段可以包围成闭合的区域，从第一条的点开始查找，查找下一条的线段，循环到第一条的点，按顺序记录线段
// 线段的包围区域查找点，直线取关键点，曲线取几何点，创建平面，计算平面的面积
// 根据平面生成三维几何体

// 获取线段包围的区域，补充成闭合路径
ThreejsDesk.prototype.getAreaLines = function ( buildId ) {
    if (!buildId && this.activeObjects[0] && this.activeObjects[0].userData.buildId)
        buildId = this.activeObjects[0].userData.buildId;
    if (!buildId) {
        console.log('没有指定线段生成模型');
        return false;
    }
    var lines = [];

    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.buildId === buildId) lines.push(this.scene.children[i]);
    }
    // for (var i = 0, il = this.lineHelper.lines.length; i < il; i++) {
    //     if (!this.lineHelper.lines[i].userData.buildId) lines.push(this.lineHelper.lines[i]);
    // }

    var lineNow;
    for (var i = 0, il = lines.length; i < il; i++) {
        if ( lines[i].userData.moveLine ) {
            if ( !this.checkLineJoin(lines[i].userData.circles[0], lines) ) {
                lineNow = this.getLineByTimeId(lines[i].userData.moveLine);
                if (!lineNow) continue;
                lineNow = this.createLineByPosition(lines[i].userData.circles[0], lineNow.userData.circles[0], 'dashedLine');
                lineNow.userData.buildId = buildId;
                lines.push(lineNow);
            }
            if ( !this.checkLineJoin(lines[i].userData.circles[lines[i].userData.circles.length - 1], lines) ) {
                lineNow = this.getLineByTimeId(lines[i].userData.moveLine);
                if (!lineNow) continue;
                lineNow = this.createLineByPosition(lines[i].userData.circles[lines[i].userData.circles.length - 1], lineNow.userData.circles[lineNow.userData.circles.length - 1], 'dashedLine');
                lineNow.userData.buildId = buildId;
                lines.push(lineNow);
            }
        }
    }

    this.lineHelper.areaLines = lines;
}

// 按照顺序获取点，生成面积和几何体
ThreejsDesk.prototype.getAreaDots = function () {
    if (this.lineHelper.areaLines.length < 1) {
        console.log('线段少于1条，无法生成面');
        return false;
    }
    
    var lines = [];
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.buildId === this.lineHelper.areaLines[0].userData.buildId) {
            lines.push(this.scene.children[i]);
        }
    }
    if ( lines.length < 1 ) {
        console.log('线段少于1条，无法生成面');
        return false;
    }
    this.lineHelper.areaLines = lines;
    this.lineHelper.areaDots = [];

    var lineNow = lines.pop(), circleNow;  
    for (var i = 0, il = lineNow.userData.circles.length; i < il; i++) {
        circleNow = lineNow.userData.circles[i];
        this.lineHelper.areaDots.push( new THREE.Vector3(circleNow.position.x, circleNow.position.y, circleNow.position.z) );
    }

    this.getAreaLineDots(circleNow);
}

// 按照顺序获取下一条线段的点，生成面积
ThreejsDesk.prototype.getAreaLineDots = function ( circleNow ) { 
    var same = this.aboutEqualDots(this.lineHelper.areaDots[0], this.lineHelper.areaDots[this.lineHelper.areaDots.length - 1]);
    if (same) {
        var lineOk = circleNow.userData.line;  
        var shape = this.createShapeTemp(this.lineHelper.areaDots);
        var areaValue = this.getAreaValue(shape.geometry.vertices, shape.geometry.faces);
        if (!lineOk) {
            console.log('没有获取到线段，请重试，点模型：', circleNow);
            return false;
        }

        shape = this.createObjectTemp(this.lineHelper.areaDots);
        this.scene.add(shape);
        shape.rotateX(Math.PI/2);
        shape.position.setY(0.5);
        shape.material.color.setHex(0xffffff);
        shape.material.side = THREE.DoubleSide;
        // this.resetObjCenter(shape); 

        this.setUserData(shape);
        shape.userData.type = 'dae';
        shape.userData.subtype = 'object';
        shape.userData.enableExport = true;
        shape.userData.buildId = lineOk.userData.buildId;
        shape.userData.areaValue = areaValue;
        shape.name = lineOk.name;
        return true;
    } 

    var circleNext = this.checkLineJoin(circleNow, this.lineHelper.areaLines);
    if (!circleNext) {
        console.log('找不到下一条线段，无法生成面，线段 id :' + circleNow.userData.line.id);
        return false;
    }

    var lineNow = circleNext.userData.line;
    if (lineNow.userData.subtype === 'line' || lineNow.userData.subtype === 'dashedLine') {
        if ( this.checkPosition(circleNext, lineNow.userData.circles[0]) ) {
            for (var i = 1, il = lineNow.userData.circles.length; i < il; i++) {
                circleNow = lineNow.userData.circles[i];
                this.lineHelper.areaDots.push( new THREE.Vector3(circleNow.position.x, circleNow.position.y, circleNow.position.z) );
            }
        } else {
            for (var i = lineNow.userData.circles.length - 2; i >= 0; i--) {
                circleNow = lineNow.userData.circles[i];
                this.lineHelper.areaDots.push( new THREE.Vector3(circleNow.position.x, circleNow.position.y, circleNow.position.z) );
            }
        }
    } else if (lineNow.userData.subtype === 'circleCurve') {
        if ( this.checkPosition(circleNext, lineNow.geometry.vertices[0]) ) {
            for (var i = 1, il = lineNow.geometry.vertices.length; i < il; i++) {
                this.lineHelper.areaDots.push( lineNow.geometry.vertices[i] );
            }
        } else {
            for (var i = lineNow.geometry.vertices.length - 2; i >= 0; i--) {
                this.lineHelper.areaDots.push( lineNow.geometry.vertices[i] );
            }
        } 
        if ( this.checkPosition(circleNext, lineNow.userData.circles[1]) ) {
            circleNow = lineNow.userData.circles[2];
        } else {
            circleNow = lineNow.userData.circles[1];
        }
    }
    
    this.removeLineFromArray(lineNow, this.lineHelper.areaLines);  
    this.getAreaLineDots(circleNow);
}

// 从数组中移除指定的线段
ThreejsDesk.prototype.removeLineFromArray = function (line, lines) {
    for (var i = 0, il = lines.length; i < il; i++) {
        if (lines[i].id === line.id) {
            lines.splice(i, 1);
            return true;
        }
    }
    return false;
}

// 获取线段根据时间和 id 
ThreejsDesk.prototype.getLineByTimeId = function ( timeId ) {
    for (var i = 0, il = this.scene.children.length; i < il; i++) {
        if (this.scene.children[i].userData.timeId === timeId) return this.scene.children[i];
    }
    return null;
} 

// 根据对象的位置创建线段
ThreejsDesk.prototype.createLineByPosition = function (obj1, obj2, type) {
    if (!obj1 || !obj2) return null;
    if (!type) type = 'dashedLine';
    if (type !== 'dashedLine') type = 'line';

    var geometry = new THREE.Geometry(), material, line, dot1, dot2;
    dot1 = new THREE.Vector3(obj1.position.x, obj1.position.y, obj1.position.z);
    dot2 = new THREE.Vector3(obj2.position.x, obj2.position.y, obj2.position.z);
    geometry.vertices.push( dot1 );
    geometry.vertices.push( dot2 );
    
    if (type === 'dashedLine') {
        material = new THREE.LineDashedMaterial( {
            color: this.lineHelper.colors.dashedLine,
            linewidth: 1,
            scale: 1,
            dashSize: 1,
            gapSize: 1,
        } );
        line = new THREE.LineSegments(geometry, material);
        line.computeLineDistances();
    } else {
        material = new THREE.LineBasicMaterial( {
            color: this.lineHelper.colors[type],
            linewidth: 1,
            linecap: 'round', 
            linejoin: 'round' 
        } );
        line = new THREE.Line(geometry, material);
    }
    
    this.scene.add(line);
    line.userData.type = 'lineHelper';
    line.userData.subtype = type;
    line.userData.timeId = (new Date()).getTime() + '_' + line.id;
    line.userData.areaLine = true;

    var circle1, circle2;
    circle1 = this.createDot(dot1);
    circle2 = this.createDot(dot2);
    circle1.visible = false;
    circle2.visible = false;
    circle1.userData.line = line;
    circle2.userData.line = line;
    line.userData.circles = [circle1, circle2];

    return line;
}

// 检查线段的点是否被连接
ThreejsDesk.prototype.checkLineJoin = function ( circle, lines ) {  
    for (var i = 0, il = lines.length; i < il; i++) {
        if (lines[i].id !== circle.userData.line.id) {
            if (lines[i].userData.subtype === 'circleCurve') {
                if ( this.checkPosition(lines[i].userData.circles[1], circle) ) return lines[i].userData.circles[1];
                if ( this.checkPosition(lines[i].userData.circles[2], circle) ) return lines[i].userData.circles[2];
            } else if (lines[i].userData.subtype === 'line' || lines[i].userData.subtype === 'dashedLine') {
                if ( this.checkPosition(lines[i].userData.circles[0], circle) ) return lines[i].userData.circles[0];
                if ( this.checkPosition(lines[i].userData.circles[lines[i].userData.circles.length - 1], circle) ) return lines[i].userData.circles[lines[i].userData.circles.length - 1];
            }
        }
    }
    return null;
}

// 检查对象的位置是否相等
ThreejsDesk.prototype.checkPosition = function (obj1, obj2) {
    if (obj1 && obj1.position) obj1 = obj1.position;
    if (obj2 && obj2.position) obj2 = obj2.position;
    if (
        obj1 && obj2 &&
        Math.abs(obj1.x - obj2.x) < 0.0001 &&
        Math.abs(obj1.y - obj2.y) < 0.0001 &&
        Math.abs(obj1.z - obj2.z) < 0.0001
    ) return true;
    return false;
}



// 划线功能快捷键

// 实线和虚线切换 alt+b

// 绘制圆弧曲线 ctrl+b

// 线段确定 空格

// 修改线的点位 shift+拖动

// 删除选择的线、画的线 delete

// 退出输入框 esc

// 显示输入框 enter

// 撤销一个点 ctrl+z

// 删除线 shift+alt+单击

// 隐藏或显示点模型 shift+空格

// 保存线段回调 ctrl+q

// 显示线段信息 shift+a

// 划线生成体块 shift+z

// 取消吸附效果 ctrl 冲突了，已经注释