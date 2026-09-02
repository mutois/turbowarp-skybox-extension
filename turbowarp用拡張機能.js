// TurboWarp 3D Skybox Extension
// 3Dパノラマスカイボックス拡張機能

(function(Scratch) {
  'use strict';

  // Three.jsをCDNから動的に読み込む
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

  class SkyboxExtension {
    constructor(runtime) {
      this.runtime = runtime;
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
      this.skyboxTextures = {
        default: this.generateDefaultStarfield()
      };
    }

    // デフォルトの星空テクスチャを生成
    generateDefaultStarfield() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // 黒い背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 1024);

      // グラデーション背景（宇宙的な）
      const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
      gradient.addColorStop(0, '#000033');
      gradient.addColorStop(0.5, '#000011');
      gradient.addColorStop(1, '#1a0033');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // ランダムな星を描画
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 2;
        const brightness = Math.random();

        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // カラフルな星を追加
      const colors = ['#ff6b9d', '#c44569', '#ffa502', '#00d2fc', '#00ff88', '#9d00ff'];
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 1.5;
        const color = colors[Math.floor(Math.random() * colors.length)];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      return canvas.toDataURL();
    }

    // 3Dシーンの初期化
    async initScene() {
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
      this.container.style.zIndex = '10000';
      this.container.style.display = 'none';
      document.body.appendChild(this.container);

      // シーンを作成
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
      );
      this.camera.position.z = 0;

      // レンダラーを作成
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x000000, 1);
      this.container.appendChild(this.renderer.domElement);

      // スカイボックスジオメトリを作成
      const geometry = new THREE.SphereGeometry(100, 64, 64);
      const textureLoader = new THREE.TextureLoader();

      // デフォルトテクスチャを作成
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // グラデーション背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
      gradient.addColorStop(0, '#000033');
      gradient.addColorStop(0.5, '#000011');
      gradient.addColorStop(1, '#1a0033');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // 星を描画
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide
      });

      this.skyboxMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.skyboxMesh);

      // ウィンドウリサイズ対応
      window.addEventListener('resize', () => this.onWindowResize());

      // アニメーションループを開始
      this.animate();

      this.isInitialized = true;
    }

    // アニメーションループ
    animate = () => {
      if (!this.renderer) return;

      requestAnimationFrame(this.animate);

      // スカイボックスを回転
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

    // スカイボックスを表示
    showSkybox() {
      if (this.container) {
        this.container.style.display = 'block';
      }
    }

    // スカイボックスを非表示
    hideSkybox() {
      if (this.container) {
        this.container.style.display = 'none';
      }
    }

    // 回転を設定
    setRotation(x, y, z) {
      this.rotationX = (x * Math.PI) / 180;
      this.rotationY = (y * Math.PI) / 180;
      this.rotationZ = (z * Math.PI) / 180;
    }

    // ズームを設定
    setZoom(value) {
      this.zoom = Math.max(0.1, value);
    }

    // 外部画像をテクスチャとして設定
    setCustomTexture(imageUrl) {
      if (!this.skyboxMesh) return;

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageUrl, (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        this.skyboxMesh.material.map = texture;
        this.skyboxMesh.material.needsUpdate = true;
      });
    }

    // テクスチャを回転
    rotateTexture(angle) {
      if (!this.skyboxMesh || !this.skyboxMesh.material.map) return;
      this.skyboxMesh.material.map.rotation = (angle * Math.PI) / 180;
    }

    // 明度を設定
    setBrightness(value) {
      if (!this.skyboxMesh) return;
      value = Math.max(0, Math.min(value, 200)) / 100;
      this.skyboxMesh.material.color.multiplyScalar(value);
    }
  }

  class TurboWarpSkyboxExtension {
    constructor(runtime) {
      this.runtime = runtime;
      this.skybox = new SkyboxExtension(runtime);
      this.skybox.initScene();
    }

    getInfo() {
      return {
        id: 'turbowarpSkybox',
        name: '3D Skybox',
        blocks: [
          {
            opcode: 'showSkybox',
            blockType: Scratch.BlockType.COMMAND,
            text: 'スカイボックスを表示'
          },
          {
            opcode: 'hideSkybox',
            blockType: Scratch.BlockType.COMMAND,
            text: 'スカイボックスを非表示'
          },
          {
            opcode: 'setRotation',
            blockType: Scratch.BlockType.COMMAND,
            text: 'スカイボックスを X [X] Y [Y] Z [Z] 度回転',
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
            text: 'スカイボックスをズーム [ZOOM]',
            arguments: {
              ZOOM: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'setCustomTexture',
            blockType: Scratch.BlockType.COMMAND,
            text: '画像 [IMAGE_URL] をテクスチャとして設定',
            arguments: {
              IMAGE_URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/skybox.png'
              }
            }
          },
          {
            opcode: 'rotateTexture',
            blockType: Scratch.BlockType.COMMAND,
            text: 'テクスチャを [ANGLE] 度回転',
            arguments: {
              ANGLE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setBrightness',
            blockType: Scratch.BlockType.COMMAND,
            text: '明度を [BRIGHTNESS] に設定',
            arguments: {
              BRIGHTNESS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          }
        ]
      };
    }

    showSkybox() {
      this.skybox.showSkybox();
    }

    hideSkybox() {
      this.skybox.hideSkybox();
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

    setCustomTexture(args) {
      this.skybox.setCustomTexture(args.IMAGE_URL);
    }

    rotateTexture(args) {
      const angle = parseFloat(args.ANGLE) || 0;
      this.skybox.rotateTexture(angle);
    }

    setBrightness(args) {
      const brightness = parseFloat(args.BRIGHTNESS) || 100;
      this.skybox.setBrightness(brightness);
    }
  }

  Scratch.extensions.register(new TurboWarpSkyboxExtension(Scratch.vm.runtime));
})(Scratch);
