// TurboWarp 3D Skybox Extension - Scratch Stage統合版
// ステージ内に3Dスカイボックスを表示

(function(Scratch) {
  'use strict';

  function loadThreeJS() {
    return new Promise((resolve) => {
      if (typeof THREE !== 'undefined') {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      }
    });
  }

  class SkyboxEngine {
    constructor(runtime) {
      this.runtime = runtime;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.skyboxMesh = null;
      this.canvas = null;
      this.isInitialized = false;
      this.rotationX = 0;
      this.rotationY = 0;
      this.rotationZ = 0;
      this.zoom = 1;
      this.currentTexture = null;
    }

    async init() {
      if (this.isInitialized) return;

      await loadThreeJS();

      // Scratchの既存canvasを取得
      const stageCanvas = document.querySelector('[class*="stage"]');
      if (!stageCanvas) {
        console.error('Stage canvas not found');
        return;
      }

      // Three.jsのcanvasを作成
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'skybox-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '0';

      // ステージコンテナを探して追加
      const stageContainer = document.querySelector('[class*="monitor-list"]')?.parentElement || 
                             document.querySelector('[class*="stage"]')?.parentElement;
      
      if (stageContainer) {
        stageContainer.style.position = 'relative';
        stageContainer.insertBefore(this.canvas, stageContainer.firstChild);
      }

      // シーンを作成
      this.scene = new THREE.Scene();

      // カメラを作成
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.canvas.clientWidth / this.canvas.clientHeight || 480 / 360,
        0.1,
        10000
      );
      this.camera.position.z = 0;

      // レンダラーを作成
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
      });

      // ステージサイズに合わせる
      this.updateRendererSize();

      this.renderer.setClearColor(0x000000, 1);

      // ウィンドウリサイズ対応
      window.addEventListener('resize', () => this.updateRendererSize());

      // アニメーションループ開始
      this.animate();

      this.isInitialized = true;
    }

    updateRendererSize() {
      if (!this.canvas || !this.renderer || !this.camera) return;

      const width = this.canvas.clientWidth || 480;
      const height = this.canvas.clientHeight || 360;

      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    setSkyTexture(imageDataUrl) {
      // 既存のメッシュを削除
      if (this.skyboxMesh) {
        this.scene.remove(this.skyboxMesh);
        this.skyboxMesh = null;
      }

      // スフィアジオメトリを作成
      const geometry = new THREE.SphereGeometry(100, 64, 64);

      // テクスチャを読み込む
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageDataUrl, (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        this.currentTexture = texture;

        // マテリアルを作成
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide
        });

        // メッシュを作成して追加
        this.skyboxMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.skyboxMesh);
      });
    }

    show() {
      if (this.canvas) {
        this.canvas.style.display = 'block';
      }
    }

    hide() {
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
    }

    setRotationX(value) {
      this.rotationX = (value * Math.PI) / 180;
    }

    setRotationY(value) {
      this.rotationY = (value * Math.PI) / 180;
    }

    setRotationZ(value) {
      this.rotationZ = (value * Math.PI) / 180;
    }

    rotateX(value) {
      this.rotationX += (value * Math.PI) / 180;
    }

    rotateY(value) {
      this.rotationY += (value * Math.PI) / 180;
    }

    rotateZ(value) {
      this.rotationZ += (value * Math.PI) / 180;
    }

    setZoom(value) {
      this.zoom = Math.max(0.1, value);
    }

    animate = () => {
      requestAnimationFrame(this.animate);

      if (this.skyboxMesh) {
        this.skyboxMesh.rotation.x = this.rotationX;
        this.skyboxMesh.rotation.y = this.rotationY;
        this.skyboxMesh.rotation.z = this.rotationZ;
        this.skyboxMesh.scale.set(this.zoom, this.zoom, this.zoom);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  class TurboWarpSkyboxExtension {
    constructor(runtime) {
      this.runtime = runtime;
      this.skybox = new SkyboxEngine(runtime);
      this.skybox.init();
    }

    getInfo() {
      return {
        id: 'turbowarpSkybox',
        name: '3D Skybox',
        blocks: [
          {
            opcode: 'setSkyTexture',
            blockType: Scratch.BlockType.COMMAND,
            text: 'このスプライトのコスチューム [COSTUME_INDEX] を3Dスカイボックスにする',
            arguments: {
              COSTUME_INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'showSkybox',
            blockType: Scratch.BlockType.COMMAND,
            text: '3Dスカイボックスを表示'
          },
          {
            opcode: 'hideSkybox',
            blockType: Scratch.BlockType.COMMAND,
            text: '3Dスカイボックスを非表示'
          },
          {
            opcode: 'setRotationX',
            blockType: Scratch.BlockType.COMMAND,
            text: 'X軸回転を [VALUE] 度にする',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setRotationY',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Y軸回転を [VALUE] 度にする',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setRotationZ',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Z軸回転を [VALUE] 度にする',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'rotateX',
            blockType: Scratch.BlockType.COMMAND,
            text: 'X軸を [VALUE] 度回転',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'rotateY',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Y軸を [VALUE] 度回転',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'rotateZ',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Z軸を [VALUE] 度回転',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'setZoom',
            blockType: Scratch.BlockType.COMMAND,
            text: 'スカイボックスを [ZOOM] 倍にする',
            arguments: {
              ZOOM: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          }
        ]
      };
    }

    setSkyTexture(args, util) {
      const costumeIndex = parseInt(args.COSTUME_INDEX) || 0;
      const sprite = util.target;

      if (!sprite) return;

      try {
        const costumes = sprite.getCostumes();
        if (!costumes || costumes.length === 0) return;

        const idx = Math.max(0, Math.min(costumeIndex, costumes.length - 1));
        const costume = costumes[idx];

        if (!costume || !costume.asset) return;

        const dataUrl = costume.asset.encodeDataURI();
        this.skybox.setSkyTexture(dataUrl);
      } catch (e) {
        console.error('Error loading costume:', e);
      }
    }

    showSkybox() {
      this.skybox.show();
    }

    hideSkybox() {
      this.skybox.hide();
    }

    setRotationX(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.setRotationX(value);
    }

    setRotationY(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.setRotationY(value);
    }

    setRotationZ(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.setRotationZ(value);
    }

    rotateX(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.rotateX(value);
    }

    rotateY(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.rotateY(value);
    }

    rotateZ(args) {
      const value = parseFloat(args.VALUE) || 0;
      this.skybox.rotateZ(value);
    }

    setZoom(args) {
      const zoom = parseFloat(args.ZOOM) || 1;
      this.skybox.setZoom(zoom);
    }
  }

  Scratch.extensions.register(new TurboWarpSkyboxExtension(Scratch.vm.runtime));
})(Scratch);
