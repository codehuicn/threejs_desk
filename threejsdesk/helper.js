// 格式化数字
ThreejsDesk.prototype.parseNumber = function ( key, value ) {
    return typeof value === 'number' ? parseFloat( value.toFixed( this.opts.numberFixed ) ) : value;
}

// 获取时间点
ThreejsDesk.prototype.getTime = function () {
    var date = new Date();
    return date.getTime();
}

// 拖拽的功能和回调
$.fn.drag = function (callback) {
    $(this).on('mousedown', function (e) {
        var that = this,
            x = e.pageX,
            y = e.pageY,
            stop;
        
        if (callback.callDown) {
            stop = callback.callDown.call(that, e);
        }
        if (stop === false) return;
        $(document).on('mousemove', function (e) {
            var xx = e.pageX;
            var yy = e.pageY;

            if (callback.callMove) {
                callback.callMove.call(that, xx - x, yy - y, e);
            }
            x = xx;
            y = yy;
        })
        $(document).on('mouseup', function (e) {
            $(document).off('mousemove');

            if (callback.callUp) {
                callback.callUp.call(that, e);
            }
        })
    })
}

// 打印 4x4 矩阵数组
ThreejsDesk.prototype.logMatrix = function(arr) {
    var str4 = '', arr = arr.elements;
    for (var i = 0, il = arr.length; i < il; i++) {
        str4 = str4 + arr[i].toFixed(2) + ' ';
        if ( (i+1) % 4 === 0 ) {
            console.log(str4);
            str4 = '';
        }
    }
    console.log('===================')
}

// 复制对象数据
ThreejsDesk.prototype.copyJsonData = function (json1, json2) {
    for (var item in json2) {
        json1[item] = json2[item];
    }
}