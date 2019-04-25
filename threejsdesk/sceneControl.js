// 场景设置
ThreejsDesk.prototype.setupScene = function () {
    this.setResize();
    this.setMouseWheel();
    this.setGui();
    this.setMode();

    this.getAxes();
    this.getGrid();
    this.getLights();
    this.getOrbitControls();
}

// 切换操作模式
ThreejsDesk.prototype.setMode = function () {
    var that = this;
    this.opts.$modeType.on('click', function(){
        if (that.mode === 'pickOne') {
            that.mode = 'pickMore';
            $(this).text('单选');
            that.orbitControls.enabled = false;
        } else if (that.mode === 'pickMore') {
            that.mode = 'pickOne';
            $(this).text('多选');
            that.orbitControls.enabled = true;
        }
    })
}

// 动画
ThreejsDesk.prototype.animate = function () {
    var that = this; 
    requestAnimationFrame( that.animate.bind(that) );

    that.orbitControls.update();  

    for (var i = 0, il = that.transControls.length; i < il; i++) {
        that.transControls[i].update();    
    }
    for (var i = 0, il = that.selectionBoxs.length; i < il; i++) {
        that.selectionBoxs[i].update();    
    }
    
    that.renderer.render( that.scene, that.camera);
    that.labelRenderer.render( that.scene, that.camera );            
}

// 场景控制 rotate scale pan 
ThreejsDesk.prototype.getOrbitControls = function () {
    var that = this;
    that.orbitControls = new THREE.OrbitControls( that.camera, that.renderer.domElement );
    that.orbitControls.screenSpacePanning = true; 
    that.orbitControls.enableKeys = false;
    // that.orbitControls.enableRotateUp = false;
    that.orbitControls.addEventListener('change', function(){
        that.setObjectScale(that.scene.children);
        that.updateLabels();
    })
}

// 构建坐标轴
ThreejsDesk.prototype.getAxes = function () {
    this.axes = new THREE.AxesHelper(600);
    this.scene.add(this.axes);
}

// 构建网格
ThreejsDesk.prototype.getGrid = function () {
    this.grid = new THREE.GridHelper( 1200, 1200/25 );
    this.scene.add(this.grid);
}

// 光
ThreejsDesk.prototype.getLights = function () {
    this.lights.hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x080820, 1 );
    this.scene.add( this.lights.hemisphereLight );
    
    // this.lights.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // this.lights.directionalLight.position.set(-1, 1, 1).normalize();
    // this.scene.add( this.lights.directionalLight );

    this.lights.ambientLight = new THREE.AmbientLight( 0x444444 ); 
    this.scene.add( this.lights.ambientLight );
}

// 设置尺寸监听
ThreejsDesk.prototype.setResize = function () {
    var that = this;

    // 全屏时窗口缩放
    $(window).on( 'resize', function () {  
        clearTimeout(that.opts.resizeTimer);
        that.opts.resizeTimer = setTimeout(function () {
            that.onResize();
        }, 300);
    });

    if ( this.opts.$fullScreen === null ) return;
    this.opts.$fullScreen.on('click', function () {
        if ( that.opts.boxFull ) {
            that.opts.boxFull = false;
            that.opts.$fullScreen.text('全屏');

            that.opts.$box.width( that.opts.boxSize.width );
            that.opts.$box.height( that.opts.boxSize.height );
            that.onResize();
        } else {
            that.opts.boxFull = true;
            that.opts.$fullScreen.text('退出全屏');

            that.onResize();
        }
    })
}

// 设置鼠标滚轮功能
ThreejsDesk.prototype.setMouseWheel = function () {
    var that = this;
    this.opts.$box[0].addEventListener('mousewheel', function(e){ 
        that.opts.wheelDeltaY = e.deltaY;         
    }, false)
}

// 窗口缩放
ThreejsDesk.prototype.onResize = function () {
    var widthVal, heightVal;
    if ( this.opts.boxFull ) {
        widthVal = $( window ).innerWidth();
        heightVal = $( window ).innerHeight();
        this.opts.$box.width(widthVal);
        this.opts.$box.height(heightVal);
    } else {
        widthVal = this.opts.$box.innerWidth();
        heightVal = this.opts.$box.innerHeight();
    }

    this.camera.aspect = widthVal / heightVal;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( widthVal, heightVal );
}

// 设置 gui 
ThreejsDesk.prototype.setGui = function () {
    this.gui = new dat.GUI();

    var that = this;
    if ( this.opts.$setupData ) {
        this.opts.$setupData.hover(function(){
            that.objectActiveLock = true;  
        }, function(){
            that.objectActiveLock = false; 
        }).html(this.gui.domElement);
    }
}

// 控制模型缩放
ThreejsDesk.prototype.setObjectScale = function ( objs ) {  
    var scaleValue, pos = this.camera.position, pos1, scaleRefer,
        dot = new THREE.Vector3(), dot1 = new THREE.Vector3();

    for (var i = 0, il = objs.length; i < il; i++) {
        scaleValue = objs[i].userData.scaleValue;
        if (!scaleValue) continue;
        
        pos1 = objs[i].position;
        dot.set(pos.x, pos.y, pos.z);
        dot1.set(pos1.x, pos1.y, pos1.z);
        scaleRefer = dot.distanceTo(dot1);
        objs[i].scale.set(
            scaleValue * scaleRefer / 120, 
            scaleValue * scaleRefer / 120,
            scaleValue * scaleRefer / 120
        );
    } 

    this.lineHelper.errorLen = scaleRefer / 120;
}