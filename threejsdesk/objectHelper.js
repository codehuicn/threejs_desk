// 线段的法向量，平行移动的距离；更新矩阵、相邻线段的交点、画一个多边形
// 材质属性在复制的对象之间会同步
// meshLineAll, 线段数组；lenArr, 长度数组
// 返回点数组，用于画新的线段，第一个点、最后一个点是原始点用于不闭合的起点、终点
ThreejsDesk.prototype.translateMeshLine = function(meshLineAll, lenArr) {
    if ( meshLineAll.length < 3 ) {
        console.log('线段数量至少要三个哦');
        return [];
    } 
    if ( meshLineAll.length !== lenArr.length ) {
        console.log('线段数量和距离数量不匹配哦');
        return [];
    } 

    var meshLine, normal, meshLineNew, meshLineNewAll = [];  

    for (var i = 0, il = meshLineAll.length; i < il; i++) {
        meshLine = meshLineAll[i];
        normal = meshLine.userData.normal.clone();  

        normal.setLength(lenArr[i]);
        meshLineNew = meshLine.clone(true);

        if (meshLine.userData.v2.x < meshLine.userData.v1.x) {
            meshLineNew.position.set(meshLine.position.x + normal.x, 0, meshLine.position.z + normal.z);
            meshLineNew.userData.v1.x += normal.x;
            meshLineNew.userData.v1.y  = 0;
            meshLineNew.userData.v1.z += normal.z;
            meshLineNew.userData.v2.x += normal.x;
            meshLineNew.userData.v2.y  = 0;
            meshLineNew.userData.v2.z += normal.z;
        } else {
            meshLineNew.position.set(meshLine.position.x - normal.x, 0, meshLine.position.z - normal.z);
            meshLineNew.userData.v1.x -= normal.x;
            meshLineNew.userData.v1.y  = 0;
            meshLineNew.userData.v1.z -= normal.z;
            meshLineNew.userData.v2.x -= normal.x;
            meshLineNew.userData.v2.y  = 0;
            meshLineNew.userData.v2.z -= normal.z;
        }
        meshLineNew.scale.setX(3000);
        meshLineNew.updateMatrixWorld();

        this.scene.add(meshLineNew);
        meshLineNew.name = 'meshLineNew' + i;
        meshLineNewAll.push(meshLineNew);
    }

    var raycaster = new THREE.Raycaster(), points = [], find = false,
        intersects = [], lineIndex, vTemp = new THREE.Vector3();
    points.push(new THREE.Vector3(meshLineNewAll[0].userData.v1.x, 0, meshLineNewAll[0].userData.v1.z));
    for (var i = 0, il = meshLineNewAll.length; i < il; i++) {
        normal = meshLineAll[i].userData.normal.clone();

        if (meshLineNewAll[i].userData.v2.x > meshLineNewAll[i].userData.v1.x) {
            normal.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), - Math.PI/2);
        } else {
            normal.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), Math.PI/2);
        }
        
        // 寻找交点
        vTemp.set(meshLineNewAll[i].userData.v2.x, 0, meshLineNewAll[i].userData.v2.z);
        raycaster.set( vTemp, normal );
        intersects = raycaster.intersectObjects( meshLineNewAll, false );
        
        lineIndex = meshLineNewAll[i].userData.index;
        if (lineIndex - 1 < 0) {
            lineIndex = il -1;
        } else {
            lineIndex = lineIndex - 1;
        }

        if (intersects.length > 0) {
            for (var j = 0, jl = intersects.length; j < jl; j++) {
                if ( intersects[j].object.userData.index === lineIndex ) {
                    points.push(intersects[j].point);
                    find = true;
                }
            }
        }
        if (!find) points.push(vTemp.clone());

    }

    for (var i = 0, il = meshLineNewAll.length; i < il; i++) {
        if (i === il - 2) {
            points.push(new THREE.Vector3(meshLineNewAll[i].userData.v2.x, 0, meshLineNewAll[i].userData.v2.z));
        }
        this.scene.remove(meshLineNewAll[i]);
    }

    return points;
}

// 线段的法向量，平行移动的距离
// 材质属性在复制的对象之间会同步
// meshLineAll, 线段数组；lenArr, 长度数组
// 返回新的线段数组
ThreejsDesk.prototype.translateMeshLineSimple = function(meshLineAll, lenArr) {
    if ( meshLineAll.length < 1 ) {
        console.log('线段数量至少要一个哦');
        return [];
    } 
    if ( meshLineAll.length !== lenArr.length ) {
        console.log('线段数量和距离数量不匹配哦');
        return [];
    } 

    var meshLine, normal, meshLineNew, meshLineNewAll = [];  

    for (var i = 0, il = meshLineAll.length; i < il; i++) {
        meshLine = meshLineAll[i];
        normal = meshLine.userData.normal.clone();  

        normal.setLength(lenArr[i]);
        meshLineNew = meshLine.clone(true);

        if (meshLine.userData.v2.x < meshLine.userData.v1.x) {
            meshLineNew.position.set(meshLine.position.x + normal.x, 0, meshLine.position.z + normal.z);
            meshLineNew.userData.v1.x += normal.x;
            meshLineNew.userData.v1.y = 0;
            meshLineNew.userData.v1.z += normal.z;
            meshLineNew.userData.v2.x += normal.x;
            meshLineNew.userData.v2.y = 0;
            meshLineNew.userData.v2.z += normal.z;
        } else {
            meshLineNew.position.set(meshLine.position.x - normal.x, 0, meshLine.position.z - normal.z);
            meshLineNew.userData.v1.x -= normal.x;
            meshLineNew.userData.v1.y = 0;
            meshLineNew.userData.v1.z -= normal.z;
            meshLineNew.userData.v2.x -= normal.x;
            meshLineNew.userData.v2.y = 0;
            meshLineNew.userData.v2.z -= normal.z;
        }
        meshLineNew.updateMatrixWorld();

        meshLineNew.name = 'meshLineNew' + i;
        meshLineNewAll.push(meshLineNew);
    }

    return meshLineNewAll;
}


// 至少两个点，前后两个点，确定中点，中点和后面点连线和 x 轴的角度，确定一条线段 Mesh
// points, 点数组；type, 传 open 时不会闭合；heightVal, 线段高度； widthVal, 线段宽度； color, 线段颜色；
// 返回线段数组
ThreejsDesk.prototype.setMeshLine = function (vertices, type, heightVal, widthVal, color) {
    if ( ! vertices || vertices.length < 2 ) {
        console.log('点数组错误');
        return [];
    }
    var  meshLineAll = [], meshLine;

    for (var i = 0, il = vertices.length; i < il; i++) {
        // this.createBox(vertices[i].x, vertices[i].y, vertices[i].z, 0x0000ff);
        if ((i === il - 1) && type === 'open') break;
        meshLine = this.createMeshLine(vertices[i], vertices[(i + 1 < il) ? (i + 1) : 0], i, heightVal, widthVal, color, (i > 0 && i < il-1) ? true : false );
        meshLineAll.push(meshLine);
    }
    return meshLineAll;
}

// 创建一条线段
// v1, 第一个点；v2, 第二个点；index, 线段索引；heightVal, 线段的高；widthVal, 线段的宽；color, 线段的颜色
// 返回创建的线段
ThreejsDesk.prototype.createMeshLine = function(v1, v2, index, heightVal, widthVal, color, middle) {
    var v0 = new THREE.Vector3( v1.x/2 + v2.x/2, v1.y/2 + v2.y/2, v1.z/2 + v2.z/2 ),
        len = v1.distanceTo(v2), angle = - Math.asin(v2.z/len - v1.z/len), lenNew;
    if (v2.x < v1.x) angle = - angle;
    lenNew = len + Math.abs(Math.sin(angle)) * widthVal;

    var geometry = new THREE.BoxGeometry( !middle ? len : lenNew, heightVal, widthVal ),
        material = new THREE.MeshLambertMaterial( {color: color} ),
        cube = new THREE.Mesh( geometry, material );
    cube.position.set(v0.x, v0.y+heightVal/2, v0.z);
    cube.rotateY(angle);
    cube.updateMatrixWorld();  // 更新矩阵

    cube.name = 'meshLine' + index;
    cube.userData.v1 = v1;
    cube.userData.v2 = v2;
    cube.userData.length = len;
    cube.userData.heightVal = heightVal;
    cube.userData.widthVal = widthVal;
    cube.userData.color = color;
    cube.userData.index = index;
    cube.userData.angle = angle;
    cube.userData.normal = new THREE.Vector3( 0, 0, 1 );
    cube.userData.normal.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), angle);
    
    return cube;
}

ThreejsDesk.prototype.updateMeshLine = function(obj) {
    var v1 = obj.userData.v1, v2 = obj.userData.v2, index = obj.userData.index, 
        heightVal = obj.userData.heightVal, widthVal = obj.userData.widthVal, color = obj.userData.color,
        v0 = new THREE.Vector3( v1.x/2 + v2.x/2, v1.y/2 + v2.y/2, v1.z/2 + v2.z/2 ),
        len = obj.userData.length, angle = obj.userData.angle;

    var geometry = new THREE.BoxGeometry( len, heightVal, widthVal ),
        material = new THREE.MeshLambertMaterial( {color: color} ),
        cube = new THREE.Mesh( geometry, material );
    cube.position.set(v0.x, v0.y+heightVal/2, v0.z);
    cube.rotateY(angle);
    cube.updateMatrixWorld();  // 更新矩阵

    cube.name = 'meshLine' + index;
    cube.userData.v1 = v1;
    cube.userData.v2 = v2;
    cube.userData.length = len;
    cube.userData.heightVal = heightVal;
    cube.userData.widthVal = widthVal;
    cube.userData.color = color;
    cube.userData.index = index;
    cube.userData.angle = angle;
    cube.userData.normal = new THREE.Vector3( 0, 0, 1 );
    cube.userData.normal.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), angle);
    
    return cube;
}

// 根据坐标创建一个点盒子
ThreejsDesk.prototype.createBox = function( x, y, z, color ) {
    var geometry = new THREE.BoxGeometry( 1.4, 1.4, 1.4 );
    var material = new THREE.MeshBasicMaterial( {color: color} );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    cube.position.set(x, y, z);
    cube.name = 'createBox';
}

// 根据尺寸和位置创建面板
ThreejsDesk.prototype.createPanel = function( w, h, d, pos, name) {
    var geometry = new THREE.BoxBufferGeometry( w, h, d );
    var material = new THREE.MeshBasicMaterial( {
        color: 0x00ff00, transparent: true, opacity: 0.5
    } );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    cube.position.set(pos.x, pos.y, pos.z);
    cube.updateMatrixWorld();
    cube.name = name;
    return cube;
}

// 创建道路
ThreejsDesk.prototype.createRoad = function (type, timeVal) {
    if (!timeVal) timeVal = ( new Date() ).getTime();
    // 转换需要的点数组
    var x, y, z, roadOpt = {
        dots: [],
        widthVal: 1,
        heightVal: 0.1,
        colorMiddle: 0xcccccc,
        colorSide1: 0xcccccc,
        translateLen1: 3
    };
    if (type === 'wall') roadOpt.heightVal = 6;
    if (type === 'road') {
        roadOpt.widthVal = 0.3;
    }
    if (!this.objectHelper) {
        this.objectHelper = {};
        this.objectHelper['roadOpt'+timeVal] = roadOpt;
    }
    if (!this.objectHelper['roadOpt'+timeVal]) {
        this.objectHelper['roadOpt'+timeVal] = roadOpt;
    }
    roadOpt = this.objectHelper['roadOpt'+timeVal];
    if (this.tempPoint && this.tempPoint.length > 1) {
        roadOpt.dots = [];
        for (var i = 0, il = this.tempPoint.length; i < il; i++) {
            x = this.tempPoint[i].userData.poi.x;
            y = this.tempPoint[i].userData.poi.y;
            z = this.tempPoint[i].userData.poi.z;
            roadOpt.dots.push(new THREE.Vector3(x, y, z));
            this.tempPoint[i].parent.remove(this.tempPoint[i]);
        } 
        this.tempPoint = [];
    }
    
    // 绘制线段
    var meshLines = this.setMeshLine(roadOpt.dots, 'close', roadOpt.heightVal, roadOpt.widthVal, roadOpt.colorMiddle);
    var lens = [], lens2 = [];
    for (var i = 0, il = meshLines.length; i < il - 1; i++) {
        this.scene.add(meshLines[i]);
        this.setUserData(meshLines[i], {type: 'meshLine', isLock: true, translateLen: roadOpt.translateLen1});
        if (type === 'road') {
            meshLines[i].userData.timeVal = timeVal;
            meshLines[i].userData.subtype = 'road';
            meshLines[i].userData.groupIndex = 1;
            if (i === 0 || i === il - 2) {
                meshLines[i].userData.enablePick = true;
            } else {
                meshLines[i].userData.enablePick = false;
            }
        } else if (type === 'wall') {
            meshLines[i].userData.timeVal = timeVal;
            meshLines[i].userData.subtype = 'wall';
        }
        lens.push(roadOpt.translateLen1);
        lens2.push(-roadOpt.translateLen1);
    }; 
    lens.push(roadOpt.translateLen1);
    lens2.push(-roadOpt.translateLen1);
    
    if (type === 'wall') return;

    // 偏移两边的线段，存在没有交点，缺少线段的问题
    if (meshLines.length > 2) {
        var dots2 = this.translateMeshLine(meshLines, lens);
        dots2.splice(1, 1); 
        dots2.splice(-2, 1); 
        var meshLines2 = this.setMeshLine(dots2, 'close', roadOpt.heightVal, roadOpt.widthVal, roadOpt.colorSide1);
        for (var i = 0, il = meshLines2.length; i < il - 1; i++) {
            this.scene.add(meshLines2[i]);
            this.setUserData(meshLines2[i], {type: 'meshLine', isLock: true, timeVal: timeVal, subtype: 'road', groupIndex: 2});
            if (i === 0 || i === il - 2) {
                meshLines2[i].userData.enablePick = true;
            } else {
                meshLines2[i].userData.enablePick = false;
            }
            meshLines2[i].userData.translateLen = lens[i];
        }

        var dots3 = this.translateMeshLine(meshLines, lens2);
        dots3.splice(1, 1); 
        dots3.splice(-2, 1); 
        var meshLines3 = this.setMeshLine(dots3, 'close', roadOpt.heightVal, roadOpt.widthVal, roadOpt.colorSide1);
        for (var i = 0, il = meshLines3.length; i < il - 1; i++) {
            this.scene.add(meshLines3[i]);
            this.setUserData(meshLines3[i], {type: 'meshLine', isLock: true, timeVal: timeVal, subtype: 'road', groupIndex: 3});
            if (i === 0 || i === il - 2) {
                meshLines3[i].userData.enablePick = true;
            } else {
                meshLines3[i].userData.enablePick = false;
            }
            meshLines3[i].userData.translateLen = lens[i];
        }
    } else {
        var meshLines2 = this.translateMeshLineSimple(meshLines, lens), line, v1, v2;
        for (var i = 0, il = meshLines2.length; i < il; i++) {
            v1 = new THREE.Vector3(meshLines2[i].userData.v1.x, meshLines2[i].userData.v1.y, meshLines2[i].userData.v1.z);
            v2 = new THREE.Vector3(meshLines2[i].userData.v2.x, meshLines2[i].userData.v2.y, meshLines2[i].userData.v2.z);
            line = this.createMeshLine(v1, v2, meshLines2[i].userData.index, meshLines2[i].userData.heightVal, meshLines2[i].userData.widthVal, roadOpt.colorSide1);
            this.scene.add(line);
            this.setUserData(line, {type: 'meshLine', isLock: true, timeVal: timeVal, subtype: 'road', groupIndex: 2});
            if (i === 0 || i === il - 1) {
                line.userData.enablePick = true;
            } else {
                line.userData.enablePick = false;
            }
            line.userData.translateLen = lens[i];
        }

        var meshLines2 = this.translateMeshLineSimple(meshLines, lens2), line, v1, v2;
        for (var i = 0, il = meshLines2.length; i < il; i++) {
            v1 = new THREE.Vector3(meshLines2[i].userData.v1.x, meshLines2[i].userData.v1.y, meshLines2[i].userData.v1.z);
            v2 = new THREE.Vector3(meshLines2[i].userData.v2.x, meshLines2[i].userData.v2.y, meshLines2[i].userData.v2.z);
            line = this.createMeshLine(v1, v2, meshLines2[i].userData.index, meshLines2[i].userData.heightVal, meshLines2[i].userData.widthVal, roadOpt.colorSide1);
            this.setUserData(line, {type: 'meshLine', isLock: true, timeVal: timeVal, subtype: 'road', groupIndex: 3});
            if (i === 0 || i === il - 1) {
                line.userData.enablePick = true;
            } else {
                line.userData.enablePick = false;
            }
            line.userData.translateLen = lens[i];
        }
    }

    // 绘制道路的线段
    // 虚线的绘制，在线段里绘制实线，线段设置透明度，考虑连续性
    var childV1 = new THREE.Vector3(0, 0, 0), 
        childV2 = new THREE.Vector3(0, 0, 0), 
        childIndex, childHeight, childWidth, childColor, childLine,  
        childData = {
            totalLen: 0,
            showLen: 3,
            hideLen: 2,

            status: 'showLen',  // hideLen
            statusFix: false,   // 为 true 时，不改 status
            hasLen: 0,          // 记录切换 meshLine 时，使用的长度

            dir: 1,    // 方向，递增 1 或递减 -1 或 0
            pos: 0,    // 当前第一个点的位置
        };
    for (var i = 0, il = meshLines.length; i < il; i++) {
        childData.statusFix = false;
        childData.totalLen = meshLines[i].userData.length;
        if (meshLines[i].userData.v1.x < meshLines[i].userData.v2.x) {
            childData.dir = 1;
        } else if (meshLines[i].userData.v1.x > meshLines[i].userData.v2.x) {
            childData.dir = - 1; 
        } else {
            childData.dir = 0; 
        }
        if (childData.totalLen <= 0) childData.dir = 0; 
        childData.pos = - childData.dir * childData.totalLen / 2;


        var count = 0;
        while ( !childData.statusFix && childData.dir != 0 && count < 500) {  
            count++;
            childV1.setX(childData.pos);
            childV2.setX( childData.pos + childData.dir * (childData[childData.status] - childData.hasLen) );
            childData.hasLen = 0;
            if (childData.dir < 0 && childV2.x < - childData.totalLen / 2) {
                childV2.setX(- childData.totalLen / 2);
                childData.statusFix = true;
                childData.hasLen = childV1.x - childV2.x;
            }
            if (childData.dir > 0 && childV2.x > childData.totalLen / 2) {
                childV2.setX(childData.totalLen / 2);
                childData.statusFix = true;
                childData.hasLen = childV2.x - childV1.x;
            }
            
            if (childData.status === 'showLen') {
                childIndex = meshLines[i].userData.index;
                childHeight = meshLines[i].userData.heightVal;
                childWidth = meshLines[i].userData.widthVal;
                childColor = meshLines[i].userData.color;
                childLine = this.createMeshLine(childV1, childV2, childIndex, childHeight, childWidth, childColor); 
                $.extend(childLine.userData, childData);
                meshLines[i].add(childLine);
            }

            if (!childData.statusFix && childData.status === 'showLen') {
                childData.status = 'hideLen';
            } else if (!childData.statusFix && childData.status === 'hideLen') {
                childData.status = 'showLen';
            }
            childData.pos = childV2.x; 
        }

        meshLines[i].material.transparent = true;
        meshLines[i].material.opacity = 0;
    }
}



ThreejsDesk.prototype.testMeshLine = function () {
    // 多个点
    var pointArr = [
        new THREE.Vector3( 3, 0, 10 ),
        new THREE.Vector3( 20, 0, 30 ),
        new THREE.Vector3( 33, 0, 22 ),
        new THREE.Vector3( 66, 0, 11 ),
        new THREE.Vector3( 55, 0, -4 ),
        new THREE.Vector3( 11, 0, -22 ),
        new THREE.Vector3( 0, 0, -11 ),
    ], lenArr = [3.1, 2.7, 3, 2.9, 2.4, 3.2, 2.8],
    lenArr2 = [-3.1, -2.7, -3, -2.9, -2.4, -3.2, -2.8];

    var timeVal = (new Date()).getTime();
    if (!this.objectHelper) this.objectHelper = {};
    this.objectHelper['roadOpt'+timeVal] = {
        dots: pointArr,
        widthVal: 1,
        heightVal: 0.1,
        colorMiddle: 0xcccccc,
        colorSide1: 0xcccccc,
        translateLen1: 3
    }
    this.createRoad('road', timeVal); return;
    
    var meshLines = this.setMeshLine(pointArr, 'close', 1, 1, 0xff0000);

    var points = this.translateMeshLine(meshLines, lenArr);
    points.shift();
    points.pop();
    var meshLines2 = this.setMeshLine(points, 'close', 1, 1, 0x00ff00);

    var points2 = this.translateMeshLine(meshLines, lenArr2);
    points.shift();
    points.pop();
    var meshLines3 = this.setMeshLine(points2, 'close', 1, 1, 0x0000ff);

    for (var i = 0, il = meshLines2.length; i < il; i++) {
        this.scene.add(meshLines2[i]);
    }
    for (var i = 0, il = meshLines3.length; i < il; i++) {
        this.scene.add(meshLines3[i]);
    }

    // 两个点
    var pointArr2 = [
        new THREE.Vector3( -13, 0, 10 ),
        new THREE.Vector3( -20, 0, 30 ),
    ], lenArr3 = [3.1], lenArr4 = [-3.1];

    var meshLines4 = this.setMeshLine(pointArr2, 'open', 1, 1, 0xff0000);
    this.scene.add(meshLines4[0]); 

    var meshLines5 = this.translateMeshLineSimple(meshLines4, lenArr3), line, v1, v2;
    for (var i = 0, il = meshLines5.length; i < il; i++) {
        v1 = new THREE.Vector3(meshLines5[i].userData.v1.x, meshLines5[i].userData.v1.y, meshLines5[i].userData.v1.z);
        v2 = new THREE.Vector3(meshLines5[i].userData.v2.x, meshLines5[i].userData.v2.y, meshLines5[i].userData.v2.z);
        line = this.createMeshLine(v1, v2, meshLines5[i].userData.index, meshLines5[i].userData.heightVal, meshLines5[i].userData.widthVal, 0x00ff00);
        this.scene.add(line);
    }
    meshLines5 = this.translateMeshLineSimple(meshLines4, lenArr4);
    for (var i = 0, il = meshLines5.length; i < il; i++) {
        v1 = new THREE.Vector3(meshLines5[i].userData.v1.x, meshLines5[i].userData.v1.y, meshLines5[i].userData.v1.z);
        v2 = new THREE.Vector3(meshLines5[i].userData.v2.x, meshLines5[i].userData.v2.y, meshLines5[i].userData.v2.z);
        line = this.createMeshLine(v1, v2, meshLines5[i].userData.index, meshLines5[i].userData.heightVal, meshLines5[i].userData.widthVal, 0x0000ff);
        this.scene.add(line);
    }
}

// 绘制区域
ThreejsDesk.prototype.setZoneDrawing = function () {  
    this.toggleLineHelper(true);
    this.objectPicker.enable = false;

    // 完成绘制区域，保存线段
    this.onSaveLine = function (line) {
        var circles = line.userData.circles;
        for (var i = 0, il = circles.length; i < il; i++) {
            circles[i].userData.line = null;
        }
        this.setUserData(line, {type: 'lineHelper'})
        this.saveObjectApi([line]);
    }
}

// 退出区域绘制
ThreejsDesk.prototype.unsetZoneDrawing = function () {  
    this.toggleLineHelper(false);
    this.lineHelper.dotNum = 2000;
    this.clearLines();
    this.lineHelper.lines = [];
    this.objectPicker.enable = true;

    this.onSaveLine = null;
}

// 绘制道路
ThreejsDesk.prototype.setRoadDrawing = function () {   
    this.toggleLineHelper(true);
    this.objectPicker.enable = false;

    // 完成绘制区域，保存线段
    this.onSaveLine = function () {
        var lines = this.lineHelper.lines;
        for (var i = 0, il = lines.length; i < il; i++) {
            this.setUserData(lines[i], {type: 'lineHelper'});
            // for (var j = 0, jl = lines[i].userData.circles.length; j < jl; j++) {
            //     lines[i].userData.circles[j].userData.line = null;
            // }
        }
        this.saveObjectApi(lines);
    }
}

// 退出道路绘制
ThreejsDesk.prototype.unsetRoadDrawing = function () {  
    // return;
    this.toggleLineHelper(false);
    this.lineHelper.colors.line = 0x00ff00;
    this.lineHelper.colors.dashedLine = 0x00ff00;
    this.lineHelper.lines = [];
    this.objectPicker.enable = true;

    this.onSaveLine = null;
}

// 绘制围墙
ThreejsDesk.prototype.setWallDrawing = function () {   
    this.toggleLineHelper(true);
    this.objectPicker.enable = false;

    // 完成绘制区域，保存线段
    this.onSaveLine = function () {
        var lines = this.lineHelper.lines;
        this.createObjectWall(lines[0], lines[lines.length - 1]);
    }
}

// 创建模型围墙
ThreejsDesk.prototype.createObjectWall = function ( line1, line2 ) {
    if (this.activeObjects.length < 1) {
        console.log('没有选择围墙模型');
        return false;
    }
    if (!line1 || !line2) {
        console.log('路径至少要两段，第一段围墙模型，第二段排列模型');
        return false;
    }

    var obj = this.activeObjects[this.activeObjects.length - 1], objDir, objLen, lineDir, lineDirTemp, lineLen = 0,
        circles1 = line1.userData.circles, circles2 = line2.userData.circles, dot1 = new THREE.Vector3(), 
        dot2 = new THREE.Vector3(), dotStart, objArr = [], objLine;

    if (!obj.userData.wallGroup) {
        obj.updateMatrixWorld();
        group = new THREE.Group();
        box = new THREE.Box3();
        box.setFromObject(obj);
        group.position.set(box.min.x, box.min.y, box.max.z);
        box = obj.position;  
        box = new THREE.Vector3(box.x, box.y, box.z);  
        group.updateMatrixWorld();
        group.worldToLocal(box);  
        group.add(obj);
        obj.position.set(box.x, box.y, box.z);
        this.scene.add(group);
        $.extend(group.userData, obj.userData);
        group.name = obj.name;
        obj = group;
        obj.userData.wallGroup = true;
        this.selected = [obj];
        this.showObjectActive();
    }

    obj.updateMatrixWorld();
    dot1.set(circles1[0].position.x, circles1[0].position.y, circles1[0].position.z);
    dot2.set(circles1[1].position.x, circles1[1].position.y, circles1[1].position.z);
    objDir = dot2.clone();
    objDir.sub(dot1);
    objDir.normalize();
    objLen = dot2.distanceTo(dot1);

    for (var i = 0, il = circles2.length; i < il-1; i++) {
        dot1.set(circles2[i].position.x, circles2[i].position.y, circles2[i].position.z);
        if (!dotStart) dotStart = dot1.clone();
        dot2.set(circles2[i+1].position.x, circles2[i+1].position.y, circles2[i+1].position.z);
        lineDirTemp = dot2.clone();
        lineDirTemp.sub(dot1);
        lineDirTemp.normalize();
        if (!lineDir) lineDir = lineDirTemp.clone();
        if (this.aboutEqualDots(lineDirTemp, lineDir)) {
            lineLen += dot2.distanceTo(dot1);
        } else {
            objLine = this.setObjectLine(obj, objDir, objLen, dotStart, lineDir, lineLen);
            objArr = objArr.concat(objLine);
            lineDir = lineDirTemp.clone();
            lineLen = dot2.distanceTo(dot1);
            dotStart = dot1.clone();
        }
    }
    objLine = this.setObjectLine(obj, objDir, objLen, dotStart, lineDir, lineLen);
    objArr = objArr.concat(objLine);  

    var objsMatrix = [];
    for (var i = 0, il = objArr.length; i < il; i++) {
        objsMatrix.push(objArr[i].matrixWorld.clone());
    }
    for (var i = 0, il = objArr.length; i < il; i++) {
        objArr[i].userData.objsMatrix = objsMatrix;
    }
}

// 排列模型到指定的路径，不足一个的进行压缩
ThreejsDesk.prototype.setObjectLine = function (obj, objDir, objLen, dotStart, lineDir, lineLen) {
    var objNow, objs = [], nums = lineLen / objLen, moveData, pos, objAngle, dirTemp,
        axisY = new THREE.Vector3(0, 1, 0), that = this;
    
    function putFirst () {
        objNow = obj.clone(true);
        pos = objNow.position;
        pos.set(dotStart.x, pos.y, dotStart.z);

        // 旋转模型，旋转点在左侧
        objAngle = Math.acos(lineDir.dot(objDir));
        dirTemp = lineDir.clone();
        dirTemp.applyAxisAngle(axisY, objAngle);
        if (dirTemp.dot(objDir).toFixed(3) === '1.000') {
            objNow.rotateOnWorldAxis(axisY, -objAngle);
        } else {
            objNow.rotateOnWorldAxis(axisY, objAngle);
        }
    }

    function putOther () {
        objNow = objs[objs.length - 1].clone(true);
        moveData = lineDir.clone();
        moveData.setLength(objLen);
        pos = objNow.position;
        pos.set(pos.x+moveData.x, pos.y, pos.z+moveData.z);
    }

    for (var i = 1; i <= nums; i++) {
        if (i === 1) {
            putFirst();
        } else {
            putOther();
        }

        objNow.updateMatrixWorld();
        objs.push(objNow);
        this.scene.add(objNow);
    }
    i = nums - (i - 1);
    if (i > 0) {
        if (objs.length < 1) {
            putFirst();
        } else {
            putOther();
        }

        objNow.scale.setX(objNow.scale.x * i);
        objNow.updateMatrixWorld();
        objs.push(objNow);
        this.scene.add(objNow);
    }
    return objs;
}

// 根据模型矩阵生成多个模型
ThreejsDesk.prototype.createObjByMatrix = function ( obj ) {
    if (!obj || !obj.userData.objsMatrix || obj.userData.objsMatrix.length < 1) {
        console.log('无法生成多个模型');
        return false;
    }

    var objsMatrix = obj.userData.objsMatrix, matrix = new THREE.Matrix4(), objNew, 
        matrixObj = new THREE.Matrix4();

    obj.updateMatrixWorld();
    for (var i = 0, il = objsMatrix.length; i < il; i++) {
        matrix.fromArray(objsMatrix[i].elements);
        objNew = obj.clone(true);
        matrixObj.getInverse(objNew.matrixWorld);
        objNew.applyMatrix(matrixObj);
        objNew.applyMatrix(matrix);
        this.scene.add(objNew);
    }
    this.scene.remove(obj);
}

// 保存新的模型
ThreejsDesk.prototype.saveObjectApi = function (objArr) {
    if (objArr.length < 1) {
        // $.YH.box({
        //     target: $('<div> 找不到模型，没办法保存哦 </div>'), 
        //     title: '提示', 
        //     show: true, 
        //     hide: true, 
        // })
        alert('找不到模型，没办法保存哦');
        return;
    } 
    // if (!this.objectInfo || !this.objectInfo.psResultId) {
    //     $.YH.box({
    //         target: $('<div> 没有选择关联的材质，没办法保存咯 </div>'), 
    //         title: '提示', 
    //         show: true, 
    //         hide: true, 
    //     })
    //     return;
    // }

    var buildId = objArr[0].id, name = objArr[0].name;
    for (var i = 0, il = objArr.length; i < il; i++) {
        objArr[i].userData.buildId = buildId;
        objArr[i].name = name;
    }
    this.activeObjects = objArr;
    this.lineHelper.lines = [];
    return '不传数据到后端';

    var that = this, area = 0, boxHtml = '', length = 0, width = [];
    for (var i = 0, il = objArr.length; i < il; i++) {   // 道路的面积
        if (objArr[i].userData.moveArea) area += parseFloat(objArr[i].userData.moveArea);
        if (objArr[i].userData.lenAll) {
            length += objArr[i].userData.lenAll;  
        } else if (objArr[i].userData.circleCurve) {
            length += (objArr[i].userData.circleCurve.radius * objArr[i].userData.circleCurve.angleCircle);
        }
        if (objArr[i].userData.moveLen) width.push( Math.abs(objArr[i].userData.moveLen) );
    }
    if (il === 1) {    // 区域的面积
        var circles = objArr[0].userData.circles, dots = [];
        for (var i = 0, il = circles.length; i < il; i++) {
            dots.push( new THREE.Vector3(circles[i].position.x, circles[i].position.y, circles[i].position.z) );
        }

        var shape = this.createShapeTemp(dots);
        area = this.getAreaValue(shape.geometry.vertices, shape.geometry.faces);
        length = objArr[0].userData.lenAll;
    }
    area = area.toFixed(4);
    length = length/2;
    length = length.toFixed(4);

    boxHtml  = '<div>';
    boxHtml += '<div> <span>请输入名称：</span> <input type="text" class="box_object_name" /> </div>';
    boxHtml += '<div> <span>生成的面积：</span> <input type="text" class="box_object_area" value="'+area+'" /> </div>';
    boxHtml += '<div> <span>累计的长度：</span> <input type="text" class="box_object_length" value="'+length+'" /> </div>';
    
    if (objArr.length > 1) {
        if (width.length < 1) {
            width = 0;
        } else {
            var il = width.length, wl = 0;
            for (var i = 0; i < il; i++) {
                wl += width[i];
            }
            width = wl / il;
            width = width.toFixed(4);
        }
        boxHtml += '<div> <span>道路的宽度：</span> <input type="text" class="box_object_width" value="'+width+'" /> </div>';
    }

    boxHtml += '</div>';
    $.YH.box({
        target: $(boxHtml), 
        title: '提示', 
        show: true, 
        hide: true, 
        ok: function(){
            var name = $('.box_object_name').val();
            if (!name) {
                $.YH.box({
                    target: $('<div> 没有填写名称，没办法保存咯 </div>'), 
                    title: '提示', 
                    show: true, 
                    hide: true, 
                })
                return;
            }

            var areaNew = $('.box_object_area').val();
            areaNew = parseFloat(areaNew);
            if (isNaN(areaNew)) areaNew = parseFloat(area);

            var lengthNew = $('.box_object_length').val();
            lengthNew = parseFloat(lengthNew);
            if (isNaN(lengthNew)) lengthNew = parseFloat(length);

            var widthNew = 0;
            if ($('.box_object_width').length > 0) {
                var widthNew = $('.box_object_width').val();
                widthNew = parseFloat(widthNew);
                if (isNaN(widthNew)) widthNew = parseFloat(width);
            }
                

            var objData = that.exportJson(objArr, 'json');
            for (var i = 0, il = objArr.length; i < il; i++) {
                objArr[i].name = name;
            }
            $.ajax({
                url: "/Home/CreateBuildByType",
                type: 'post',
                data: {
                    psResultId: that.objectInfo.psResultId,
                    moduleId: that.objectInfo.moduleId,
                    resultType: that.objectInfo.resultType,
                    schemeId: schemeId,
                    sortIds: that.objectInfo.sortIds,
                    dataJson: objData,
                    name: name,
                    area: areaNew,
                    uuid: objArr[0].uuid,
                    width: widthNew === 0 ? '' : widthNew,
                    length: lengthNew,
                },
                dataType: 'json',
                error: function () {
                    $.YH.box({
                        target: $('<div> 未知错误，请联系服务器管理员，或者刷新页面重试 </div>'), 
                        title: '提示', 
                        show: true, 
                        hide: true, 
                    })
                },
                success: function (data) {
                    if (data.Success == false) {
                        // $.tmsg("m_jfw", data.Message, { infotype: 2 });
                        $.YH.box({
                            target: $('<div> '+data.Message+' </div>'), 
                            title: '提示', 
                            show: true, 
                            hide: true, 
                        })
                    }
                    else {
                        that.activeObjects = objArr;
                        getObjectInfo(data.buildId, 1)
                        for (var i = 0, il = objArr.length; i < il; i++) {
                            objArr[i].userData.buildId = data.buildId;
                            objArr[i].name = name;
                        }
        
                        editor.lineHelper.lines = [];
                        // $.YH.box({
                        //     target: $('<div> 保存成功咯 </div>'), 
                        //     title: '提示', 
                        //     show: true, 
                        //     hide: true, 
                        // })
                        // that.lineHelper.lines = [];
                    }
                }
            });            
        }, 
    })
}



