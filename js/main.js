$(function () {
  const $image = $('#image');
  const $imageCropped = $('#img-cropped');
  const $uploadBtn = $('#upload-btn');
  const $cropBtn = $('#crop-btn');

  // 默认设置：200px 圆形裁剪
  let imageHeight = 200; // 裁剪高度 200px
  let imageWidth = 200;  // 裁剪宽度 200px
  let aspectRatio = 1;   // 正方形比例 (1:1)
  let fillColor = "#fff"; // 填充颜色
  let cropper;           // Cropper 实例
  let canvas;            // Canvas 对象

  // 初始化 Cropper
  function cropperInit() {
    cropper = $image.cropper({
      aspectRatio: aspectRatio,
      viewMode: 1,             // 限制裁剪框在图片内
      cropBoxResizable: false, // 禁止调整裁剪框大小
      cropBoxMovable: true,    // 允许移动裁剪框
      dragMode: 'move',        // 允许拖动图片
      minCropBoxWidth: 200,    // 固定裁剪框宽度 200px
      minCropBoxHeight: 200,   // 固定裁剪框高度 200px
      crop: function(event) {
        canvas = $image.cropper("getCroppedCanvas", {
          width: 200,          // 输出宽度 200px
          height: 200,         // 输出高度 200px
          fillColor: fillColor
        });
      }
    });
  }

  // 销毁 Cropper
  function cropperDestroy() {
    if (cropper) {
      $image.cropper("destroy");
      cropper = null;
    }
  }

  // 点击裁剪按钮，显示裁剪结果
  $cropBtn.click(function(e) {
    $("#img-cropped").empty();
    if (canvas) {
      // 创建圆形裁剪结果
      const roundedCanvas = document.createElement('canvas');
      const ctx = roundedCanvas.getContext('2d');
      roundedCanvas.width = 200;
      roundedCanvas.height = 200;
      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2, true); // 绘制 200px 直径圆形
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0, 200, 200);
      $imageCropped.append(roundedCanvas);
    }
  });

  // 点击上传按钮，发送裁剪数据
  $uploadBtn.click(function(e) {
    if (canvas) {
      const roundedCanvas = document.createElement('canvas');
      const ctx = roundedCanvas.getContext('2d');
      roundedCanvas.width = 200;
      roundedCanvas.height = 200;
      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2, true); // 绘制圆形
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0, 200, 200);

      const base64 = roundedCanvas.toDataURL('image/png');
      const imageData = ctx.getImageData(0, 0, 200, 200);
      const buffer = imageData.data.buffer;

      sendData({ buffer, base64 });
    }
  });

  // 发送数据到 Wix
  function sendData(data) {
    let msg = {
      "isCropper": true
    };
    msg = { ...msg, ...data };
    console.log("Sending message:", msg);
    window.parent.postMessage(msg, "*");
  }

  // 更新图片并刷新 Cropper
  function updateCropperImage(url) {
    $image.attr("src", url);
    refreshCropper();
  }

  // 刷新 Cropper
  function refreshCropper() {
    cropperDestroy();
    cropperInit();
  }

  // 监听 Wix 传来的消息
  window.onmessage = e => {
    let { data } = e;
    if (data.toUpdateImageURL) {
      let url = data.updateImageURL;
      updateCropperImage(url);
    } else if (data.initSetting) {
      let { aspectRatio: asptRatio, fillColor: backgroundColor, 
            imageHeight: imgH, imageWidth: imgW, noAspectRatio } = data;
      aspectRatio = asptRatio || 1;         // 默认 1:1
      fillColor = backgroundColor || "#fff"; // 默认白色
      imageHeight = imgH || 200;            // 默认 200px
      imageWidth = imgW || 200;             // 默认 200px
      if (noAspectRatio) aspectRatio = NaN;
      refreshCropper();
    }
  };

  // 初始化 Cropper 并通知 Wix 已准备好
  cropperInit();
  sendData({ ready: true });
});
