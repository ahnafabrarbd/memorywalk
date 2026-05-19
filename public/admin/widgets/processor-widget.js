/**
 * 0.3MP Processor Widget for Decap CMS.
 *
 * Replaces the default image widget. Processes images through the CMOS sensor
 * emulation pipeline at upload time. Only the processed blob is committed.
 *
 * The processor logic is self-contained here (not imported from src/lib/processor)
 * because Decap loads as a standalone script outside the Astro build pipeline.
 */

(function () {
  // ---- Processor pipeline (mirrors src/lib/processor/) ----

  function resizeImage(source, maxW, maxH) {
    var srcW = source.naturalWidth || source.width;
    var srcH = source.naturalHeight || source.height;
    var scale = Math.min(maxW / srcW, maxH / srcH, 1);
    var dstW = Math.round(srcW * scale);
    var dstH = Math.round(srcH * scale);
    var canvas = document.createElement("canvas");
    canvas.width = dstW;
    canvas.height = dstH;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
    ctx.drawImage(source, 0, 0, dstW, dstH);
    return ctx.getImageData(0, 0, dstW, dstH);
  }

  function quantize(data) {
    var d = data.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] = (d[i] >> 3) << 3;
      d[i + 1] = (d[i + 1] >> 2) << 2;
      d[i + 2] = (d[i + 2] >> 3) << 3;
    }
    return data;
  }

  function safeGet(m, w, h, x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return -1;
    return m[y * w + x];
  }
  function avg4(m, w, h, x, y) {
    var s = 0, c = 0, v;
    v = safeGet(m, w, h, x, y - 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x, y + 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x + 1, y); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x - 1, y); if (v >= 0) { s += v; c++; }
    return c > 0 ? s / c : 0;
  }
  function avgDiag(m, w, h, x, y) {
    var s = 0, c = 0, v;
    v = safeGet(m, w, h, x + 1, y - 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x - 1, y - 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x + 1, y + 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x - 1, y + 1); if (v >= 0) { s += v; c++; }
    return c > 0 ? s / c : 0;
  }
  function avgH(m, w, h, x, y) {
    var s = 0, c = 0, v;
    v = safeGet(m, w, h, x - 1, y); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x + 1, y); if (v >= 0) { s += v; c++; }
    return c > 0 ? s / c : 0;
  }
  function avgV(m, w, h, x, y) {
    var s = 0, c = 0, v;
    v = safeGet(m, w, h, x, y - 1); if (v >= 0) { s += v; c++; }
    v = safeGet(m, w, h, x, y + 1); if (v >= 0) { s += v; c++; }
    return c > 0 ? s / c : 0;
  }

  function bayer(data) {
    var w = data.width, h = data.height;
    var src = new Uint8ClampedArray(data.data);
    var mosaic = new Float32Array(w * h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var er = y % 2 === 0, ec = x % 2 === 0;
        if (er && ec) mosaic[y * w + x] = src[i];
        else if (er && !ec) mosaic[y * w + x] = src[i + 1];
        else if (!er && ec) mosaic[y * w + x] = src[i + 1];
        else mosaic[y * w + x] = src[i + 2];
      }
    }
    var out = data.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var er = y % 2 === 0, ec = x % 2 === 0;
        if (er && ec) {
          out[i] = mosaic[y * w + x];
          out[i + 1] = avg4(mosaic, w, h, x, y);
          out[i + 2] = avgDiag(mosaic, w, h, x, y);
        } else if (er && !ec) {
          out[i] = avgH(mosaic, w, h, x, y);
          out[i + 1] = mosaic[y * w + x];
          out[i + 2] = avgV(mosaic, w, h, x, y);
        } else if (!er && ec) {
          out[i] = avgV(mosaic, w, h, x, y);
          out[i + 1] = mosaic[y * w + x];
          out[i + 2] = avgH(mosaic, w, h, x, y);
        } else {
          out[i] = avgDiag(mosaic, w, h, x, y);
          out[i + 1] = avg4(mosaic, w, h, x, y);
          out[i + 2] = mosaic[y * w + x];
        }
      }
    }
    return data;
  }

  function gaussRand() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function noise(data, sigma) {
    sigma = sigma || 6;
    var w = data.width, h = data.height, d = data.data;
    var band = new Float32Array(h);
    for (var y = 0; y < h; y++) band[y] = gaussRand() * 3;
    for (var y = 0; y < h; y++) {
      var b = band[y];
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        var shot = 1 - 0.6 * (luma / 255);
        for (var c = 0; c < 3; c++) {
          d[i + c] = Math.max(0, Math.min(255, d[i + c] + gaussRand() * sigma * shot + b));
        }
      }
    }
    return data;
  }

  function bloom(data, threshold) {
    threshold = threshold || 240;
    var w = data.width, h = data.height, d = data.data;
    var src = new Uint8ClampedArray(d);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var luma = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
        if (luma > threshold) {
          var excess = (luma - threshold) / (255 - threshold);
          var strength = excess * 0.4;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              var nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              var ni = (ny * w + nx) * 4;
              var dist = Math.sqrt(dx * dx + dy * dy);
              var falloff = strength / dist;
              for (var c = 0; c < 3; c++) {
                d[ni + c] = Math.min(255, d[ni + c] + (src[i + c] - d[ni + c]) * falloff);
              }
            }
          }
        }
      }
    }
    return data;
  }

  function processImageData(imgEl) {
    var data = resizeImage(imgEl, 640, 480);
    data = quantize(data);
    data = bayer(data);
    data = noise(data, 6);
    data = bloom(data, 240);
    return data;
  }

  function imageDataToBlob(data, quality) {
    var canvas = document.createElement("canvas");
    canvas.width = data.width;
    canvas.height = data.height;
    canvas.getContext("2d").putImageData(data, 0, 0);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) { blob ? resolve(blob) : reject(new Error("encode failed")); },
        "image/jpeg",
        quality || 0.65
      );
    });
  }

  function loadImageEl(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("load failed")); };
      img.src = src;
    });
  }

  // ---- EXIF extraction (uses global exifr loaded from CDN) ----

  function extractExif(file) {
    if (!window.exifr) return Promise.resolve(null);
    return window.exifr.parse(file, {
      pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"],
    }).catch(function () { return null; });
  }

  // ---- Decap Widget ----

  var React = window.React || (window.h && { createElement: window.h });
  var h = React.createElement;

  var ProcessorControl = window.createClass({
    getInitialState: function () {
      return {
        originalUrl: null,
        processedUrl: null,
        processing: false,
        exifInfo: null,
        fileName: null,
      };
    },

    handleFile: function (e) {
      var self = this;
      var file = e.target.files && e.target.files[0];
      if (!file) return;

      self.setState({ processing: true, fileName: file.name });

      var origUrl = URL.createObjectURL(file);
      self.setState({ originalUrl: origUrl });

      Promise.all([
        loadImageEl(origUrl),
        extractExif(file),
      ]).then(function (results) {
        var img = results[0];
        var exif = results[1];

        var exifInfo = {};
        if (exif) {
          if (exif.DateTimeOriginal) exifInfo.captured_at = exif.DateTimeOriginal;
          if (exif.latitude != null && exif.longitude != null) {
            exifInfo.coords = [exif.latitude, exif.longitude];
          }
        }
        self.setState({ exifInfo: exifInfo });

        // Auto-populate captured_at on the parent entry if EXIF has it
        if (exifInfo.captured_at && self.props.entry) {
          try {
            var dateStr = new Date(exifInfo.captured_at).toISOString();
            self.props.onChange(self.props.value, { captured_at: dateStr });
          } catch (err) { /* ignore */ }
        }

        var processed = processImageData(img);
        return imageDataToBlob(processed);
      }).then(function (blob) {
        var procUrl = URL.createObjectURL(blob);
        self.setState({ processedUrl: procUrl, processing: false });

        // Convert blob to base64 data URL for Decap
        var reader = new FileReader();
        reader.onloadend = function () {
          self.props.onChange(reader.result);
        };
        reader.readAsDataURL(blob);
      }).catch(function (err) {
        console.error("Processor widget error:", err);
        self.setState({ processing: false });
      });
    },

    render: function () {
      var state = this.state;
      var containerStyle = { fontFamily: "monospace", fontSize: "0.875rem", color: "#888" };
      var previewStyle = { display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" };
      var imgStyle = { maxWidth: "300px", height: "auto", display: "block" };
      var labelStyle = { color: "#888", marginBottom: "0.25rem" };

      var children = [];

      children.push(
        h("input", {
          type: "file",
          accept: "image/*",
          onChange: this.handleFile,
          style: { marginBottom: "0.5rem" },
        })
      );

      if (state.processing) {
        children.push(h("div", null, "processing..."));
      }

      if (state.exifInfo && Object.keys(state.exifInfo).length > 0) {
        var exifLines = [];
        if (state.exifInfo.captured_at) {
          exifLines.push("captured: " + new Date(state.exifInfo.captured_at).toISOString());
        }
        if (state.exifInfo.coords) {
          exifLines.push("coords: [" + state.exifInfo.coords[0].toFixed(6) + ", " + state.exifInfo.coords[1].toFixed(6) + "]");
        }
        children.push(h("pre", { style: { color: "#888", margin: "0.5rem 0" } }, exifLines.join("\n")));
      }

      if (state.originalUrl && state.processedUrl) {
        children.push(
          h("div", { style: previewStyle },
            h("div", null,
              h("div", { style: labelStyle }, "original"),
              h("img", { src: state.originalUrl, style: imgStyle })
            ),
            h("div", null,
              h("div", { style: labelStyle }, "processed"),
              h("img", { src: state.processedUrl, style: imgStyle })
            )
          )
        );
      } else if (this.props.value && typeof this.props.value === "string") {
        // Show existing image
        children.push(
          h("div", { style: { marginTop: "0.5rem" } },
            h("div", { style: labelStyle }, "current"),
            h("img", { src: this.props.value, style: imgStyle })
          )
        );
      }

      return h("div", { style: containerStyle }, children);
    },
  });

  var ProcessorPreview = window.createClass({
    render: function () {
      var value = this.props.value;
      if (!value) return h("div", null, "no image");
      return h("img", { src: value, style: { maxWidth: "640px", height: "auto" } });
    },
  });

  CMS.registerWidget("processor_image", ProcessorControl, ProcessorPreview);
})();
