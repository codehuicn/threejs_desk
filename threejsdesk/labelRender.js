// 设置标注层
ThreejsDesk.prototype.setLabelLayer = function () {  
    var that = this;

    that.labelRenderer = new THREE.CSS2DRenderer();
    that.labelRenderer.setSize( that.opts.$box.innerWidth(), that.opts.$box.innerHeight() );
    that.labelRenderer.domElement.style.position = 'absolute';
    that.labelRenderer.domElement.style.top = 0;
    that.opts.$box.prepend( that.labelRenderer.domElement );

    if (that.opts.$labelValue !== null) that.opts.$labelValue.on('keyup', function(e){
        that.objectActiveLock = true;
        var val = $(this).val();
        if (that.activeObjects.length > 0) that.addLabel(that.activeObjects, that.opts.getLabelHtml(val));
    })
}

// 保存标注信息到 userData ， 导出的时候会丢失标注信息
ThreejsDesk.prototype.saveLabelData = function (object) {
    if ( ! object || ! object.userData.labelId ) return;
    var objectLabel = object.getObjectById(object.userData.labelId);
    if (objectLabel) {
        object.userData.label = $('<div/>').append($(objectLabel.element)).html();
        object.name = $(objectLabel.element).text();
    }
    return object.name;
}

// 设置标注信息
ThreejsDesk.prototype.resetLabelObject = function (object) {  return;
    if ( ! object ) return;
    if (object.userData.label) {
        this.addObjectLabel(object, object.userData.label);
    }
}

// 添加标注
ThreejsDesk.prototype.addLabel = function (objs, html) {
    for (var i = 0, il = objs.length; i < il; i++) {
        this.addObjectLabel(objs[i], html);
    }
}

// 添加模型标注
ThreejsDesk.prototype.addObjectLabel = function (object, html) {  return;
    var that = this, textEle, textObj, labelObj;
    
    labelObj = object.getObjectById( object.userData.labelId );
    if ( labelObj ) {
        $(labelObj.element).html( $(html).html() );
        return;
    }

    textEle = $(html)[0];
    textObj = new THREE.CSS2DObject( textEle )
    textObj.name = object.name + '_label';

    // var objBox = (new THREE.Box3()).setFromObject(object);  
    
    object.add( textObj ); 
    object.userData.labelId = textObj.id;

    textObj.position.set( 0, 0, 0 );
    $(textEle).data('object', object);

    $(textEle).drag({
        callDown: function (e) {
            e.stopPropagation();
            $(this).attr('contenteditable', true);
        },
        callUp: function () {
            $(document).off('mouseup')  // 必须清除事件，否则会被其它元素调用
            that.pickAndJudge($(this).data('object'));
        },
        callMove: function (dx, dy, e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('marginTop', 
                parseFloat($(this).css('marginTop')) + dy + 'px'
            );
            $(this).css('marginLeft', 
                parseFloat($(this).css('marginLeft')) + dx + 'px'
            );
        }
    })
}

// 更新标注
ThreejsDesk.prototype.updateLabels = function () {
    var scale = Math.pow(0.97, this.opts.zoomSpeed), 
        $labels = $(this.opts.labelElementClass), $ele, top, left;
   
    for (var i = 0, il = $labels.length; i < il; i++) {
        $ele = $labels.eq(i);
        top = parseFloat($ele.css('marginTop'));
        left = parseFloat($ele.css('marginLeft'));

        if (this.opts.wheelDeltaY > 0) {
            $ele.css({
                'marginTop': top * scale + 'px',
                'marginLeft': left * scale + 'px'
            })
        } else if (this.opts.wheelDeltaY < 0) {
            $ele.css({
                'marginTop': top / scale + 'px',
                'marginLeft': left / scale + 'px'
            })
        }
    }
}

// 删除对象的标注，保存标注信息
ThreejsDesk.prototype.removeObjectLabel = function ( obj ) {
    this.saveLabelData(obj);
    
    var objLabel = obj.getObjectByName( obj.name + '_label' );
    if ( !objLabel ) return;
    $( objLabel.element ).remove();
    obj.remove( objLabel );
}

