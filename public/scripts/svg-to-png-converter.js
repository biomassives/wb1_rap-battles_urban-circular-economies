/**
 * SVG to PNG Converter
 * Uses Canvas and WebGL to convert SVG graphics to PNG format with dynamic data
 *
 * Usage:
 * - Convert NFT cards to PNG for downloads
 * - Generate avatar PNGs from SVG templates
 * - Create role badges as PNG images
 * - Export DVG cards as shareable images
 */

class SVGtoPNGConverter {
  constructor(options = {}) {
    this.useWebGL = options.useWebGL !== false; // Default true
    this.quality = options.quality || 0.95; // PNG quality
    this.scale = options.scale || 2; // Resolution multiplier for retina displays
  }

  /**
   * Convert SVG element or SVG string to PNG Blob
   * @param {SVGElement|string} svg - SVG element or SVG markup string
   * @param {Object} data - Dynamic data to inject into SVG
   * @param {number} width - Output width in pixels
   * @param {number} height - Output height in pixels
   * @returns {Promise<Blob>} PNG image as Blob
   */
  async convert(svg, data = {}, width, height) {
    const svgString = this.prepareSVG(svg, data);
    const canvas = this.createCanvas(width, height);

    if (this.useWebGL && this.isWebGLAvailable()) {
      return await this.convertWithWebGL(svgString, canvas, width, height);
    } else {
      return await this.convertWithCanvas(svgString, canvas, width, height);
    }
  }

  /**
   * Prepare SVG by injecting dynamic data
   * @param {SVGElement|string} svg
   * @param {Object} data
   * @returns {string} SVG markup
   */
  prepareSVG(svg, data) {
    let svgString;

    if (typeof svg === 'string') {
      svgString = svg;
    } else if (svg instanceof SVGElement) {
      svgString = new XMLSerializer().serializeToString(svg);
    } else {
      throw new Error('SVG must be an SVGElement or string');
    }

    // Inject dynamic data into SVG
    svgString = this.injectData(svgString, data);

    return svgString;
  }

  /**
   * Inject dynamic data into SVG template
   * @param {string} svgString
   * @param {Object} data
   * @returns {string}
   */
  injectData(svgString, data) {
    // Replace data placeholders like {{username}}, {{level}}, etc.
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      svgString = svgString.replace(regex, data[key]);
    });

    // Handle conditional sections: <!-- IF:premium -->...<!-- /IF:premium -->
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'boolean') {
        const ifRegex = new RegExp(`<!--\\s*IF:${key}\\s*-->[\\s\\S]*?<!--\\s*/IF:${key}\\s*-->`, 'g');
        if (!data[key]) {
          svgString = svgString.replace(ifRegex, '');
        } else {
          svgString = svgString.replace(new RegExp(`<!--\\s*IF:${key}\\s*-->`, 'g'), '');
          svgString = svgString.replace(new RegExp(`<!--\\s*/IF:${key}\\s*-->`, 'g'), '');
        }
      }
    });

    return svgString;
  }

  /**
   * Create canvas element with proper scaling
   */
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width * this.scale;
    canvas.height = height * this.scale;
    return canvas;
  }

  /**
   * Check WebGL availability
   */
  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Convert using standard Canvas 2D API
   */
  async convertWithCanvas(svgString, canvas, width, height) {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Create blob from SVG
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Scale context for retina displays
        ctx.scale(this.scale, this.scale);

        // Draw SVG to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to PNG Blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          'image/png',
          this.quality
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG: ' + err));
      };

      img.src = url;
    });
  }

  /**
   * Convert using WebGL for better performance (large images, batch processing)
   */
  async convertWithWebGL(svgString, canvas, width, height) {
    // WebGL rendering for high-performance conversion
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      // Fallback to Canvas 2D
      return this.convertWithCanvas(svgString, canvas, width, height);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Create texture from image
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload image to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // Setup shaders and render
        this.renderWebGL(gl, canvas, width, height);

        // Convert to PNG Blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          'image/png',
          this.quality
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for WebGL: ' + err));
      };

      img.src = url;
    });
  }

  /**
   * WebGL rendering pipeline
   */
  renderWebGL(gl, canvas, width, height) {
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Setup geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1
    ]);

    const texCoords = new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0
    ]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // TexCoord buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Render
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Compile WebGL shader
   */
  compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Batch convert multiple SVGs
   * @param {Array} svgBatch - Array of {svg, data, width, height}
   * @returns {Promise<Array<Blob>>}
   */
  async convertBatch(svgBatch) {
    const promises = svgBatch.map(item =>
      this.convert(item.svg, item.data, item.width, item.height)
    );
    return Promise.all(promises);
  }

  /**
   * Download PNG directly
   */
  async download(svg, data, width, height, filename = 'image.png') {
    const blob = await this.convert(svg, data, width, height);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SVGtoPNGConverter;
}

// Make available globally
window.SVGtoPNGConverter = SVGtoPNGConverter;

// Convenience function for quick conversions
window.convertSVGtoPNG = async (svg, data = {}, width = 600, height = 600, options = {}) => {
  const converter = new SVGtoPNGConverter(options);
  return await converter.convert(svg, data, width, height);
};
