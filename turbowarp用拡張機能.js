// TurboWarp 3D Skybox Extension - シンプル版
// このスプライトのコスチュームを3Dスカイボックスとして表示

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
    constructor() {
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.skyboxMesh = null;
      this.container = null;
      this.isInitialized = false;
      this.rotationX = 0;
      this.rotationY = 0;
      this.rotationZ = 0;
      this.zoom = 1;
    }

    async init() {
      if (this.isInitialized) return;

      await loadThreeJS();

      // コンテナを作成
      this.container = document.createElement('div');
      this.container.id = 'skybox-container';
      this.container.style.position = 'fixed';
      this.container.style.top = '0';
      this.container.style.left = '0';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.zIndex = '1';
      this.container.style.display = 'none';
      this.container.style.pointerEvents = 'none';
      document.body.appendChild(this.container);

      // シーンを作成
      this.scene = new THREE.Scene();

      // カメラを作成
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
      );
      this.camera.position.z = 0;

      // レンダラーを作成
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 1);
      this.container.appendChild(this.renderer.domElement);

      // ウィンドウリサイズ対応
      window.addEventListener('resize', () => this.onWindowResize());

      // ���ニメーションループ開始
      this.animate();

      this.isInitialized = true;
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
      if (this.container) {
        this.container.style.display = 'block';
      }
    }

    hide() {
      if (this.container) {
        this.container.style.display = 'none';
      }
    }

    setRotation(x, y, z) {
      this.rotationX = (x * Math.PI) / 180;
      this.rotationY = (y * Math.PI) / 180;
      this.rotationZ = (z * Math.PI) / 180;
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

      this.renderer.render(this.scene, this.camera);
    }

    onWindowResize = () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  class TurboWarpSkyboxExtension {
    constructor(runtime) {
      this.runtime = runtime;
      this.skybox = new SkyboxEngine();
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
            opcode: 'setRotation',
            blockType: Scratch.BlockType.COMMAND,
            text: 'スカイボックスを X [X] Y [Y] Z [Z] 度回転させる',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
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

    setRotation(args) {
      const x = parseFloat(args.X) || 0;
      const y = parseFloat(args.Y) || 0;
      const z = parseFloat(args.Z) || 0;
      this.skybox.setRotation(x, y, z);
    }

    setZoom(args) {
      const zoom = parseFloat(args.ZOOM) || 1;
      this.skybox.setZoom(zoom);
    }
  }

  Scratch.extensions.register(new TurboWarpSkyboxExtension(Scratch.vm.runtime));
})(Scratch);
