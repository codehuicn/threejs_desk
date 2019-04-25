// 添加 文本精灵
ThreejsDesk.prototype.addSpriteText = function ( obj, text ) {
    var canvasSprite = this.makeCanvasSprite( text );
    canvasSprite.scale.set(10, 10, 10);
    obj.add( canvasSprite );
}

// 创建 canvas 精灵
ThreejsDesk.prototype.makeCanvasSprite = function ( text, opt ) {
    var canvasText = this.makeCanvasText( text, opt );
    var texture = new THREE.CanvasTexture(canvasText);

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
    var sprite = new THREE.Sprite( spriteMaterial );

    return sprite;	
}

// 创建 canvas 文本
ThreejsDesk.prototype.makeCanvasText = function( text, opt ) {
    var textOpt = {
        'fontFace': 'Verdana',
        'fontSize': '30px',
        'fontWeight': 'normal',
        'borderWidth': 2,
        'borderColor': 'rgba(0, 0, 0, 1)',
        'backgroundColor': 'rgba(255, 255, 255, 1)',
    }
    $.extend(textOpt, opt);

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = textOpt.fontWeight + ' ' + textOpt.fontSize + ' ' + textOpt.fontFace;
    
    context.strokeStyle = textOpt.borderColor;
    context.fillStyle = textOpt.backgroundColor;
    context.lineWidth = textOpt.borderWidth;
    var textWidth = context.measureText( text ).width;
    this.makeCanvasRect(context, 4, 4, 
        textWidth + textOpt.borderWidth * 2 + 8, 
        parseInt(textOpt.fontSize) + textOpt.borderWidth * 2 + 8, 2);
    
    context.fillStyle = textOpt.borderColor;
    context.fillText( text, textOpt.borderWidth + 8, 
        parseInt(textOpt.fontSize) + textOpt.borderWidth + 6 );
    
    // document.body.appendChild(canvas);
    return canvas;        
};

// 创建 canvas 矩形
ThreejsDesk.prototype.makeCanvasRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}