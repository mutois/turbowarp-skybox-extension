// TurboWarp 3D Skybox Extension
// 完璧な3Dパノラマスカイボックス拡張機能
// cubemap対応、スプライトコスチューム読み込み対応

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
      this.starMeshes = []; // 3D星用
      this.container = null;
      this.isInitialized = false;
      this.rotationX = 0;
      this.rotationY = 0;
      this.rotationZ = 0;
      this.zoom = 1;
      this.brightness = 1;
      this.mode = 'skybox'; // 'skybox', '3dstars', 'cubemap'
      this.fileInput = null;
      this.createFileInput();
    }

    // ファイル入力要素を作成
    createFileInput() {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
      this.fileInput.multiple = true;
      this.fileInput.style.display = 'none';
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
      document.body.appendChild(this.fileInput);
    }

    // ファイル選択時の処理
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      
      // 複数ファイルの場合（cubemap）
      if (files.length === 6) {
        this.loadCubemapFromFiles(files);
      } else if (files.length === 1) {
        // 単一ファイルの場合
        const reader = new FileReader();
        reader.onload = (e) => {
          this.setSkyboxTexture(e.target.result);
          this.mode = 'skybox';
        };
        reader.readAsDataURL(files[0]);
      }
      this.fileInput.value = '';
    }

    // ファイルからcubemapを読み込む
    loadCubemapFromFiles(files) {
      const readers = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((dataUrls) => {
        this.createCubemapFromImages(dataUrls);
        this.mode = 'cubemap';
      });
    }

    // 画像配列からcubemapを作成
    createCubemapFromImages(imageUrls) {
      if (!this.scene || imageUrls.length !== 6) return;

      const textureLoader = new THREE.TextureLoader();
      const textures = [];
      let loadedCount = 0;

      imageUrls.forEach((url) => {
        textureLoader.load(url, (texture) => {
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;
          textures.push(texture);
          loadedCount++;

          // 6枚すべてが読み込まれたらcubemapを作成
          if (loadedCount === 6) {
            this.applyCubemap(textures);
          }
        });
      });
    }

    // cubemapを適用
    applyCubemap(textures) {
      if (!this.scene) return;

      // 既存のスカイボックスメッシュを削除
      if (this.skyboxMesh) {
        this.scene.remove(this.skyboxMesh);
      }

      // cubemapジオメトリ
      const geometry = new THREE.BoxGeometry(200, 200, 200);
      const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));

      this.skyboxMesh = new THREE.Mesh(geometry, materials);
      this.scene.add(this.skyboxMesh);
    }

    // デフォルトの星空テクスチャを生成
    generateDefaultStarfield() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');

      // 黒い背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 2048, 2048);

      // グラデーション背景（宇宙的な）
      const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
      gradient.addColorStop(0, '#0a0e27');
      gradient.addColorStop(0.5, '#0d0815');
      gradient.addColorStop(1, '#1a0033');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2048, 2048);

      // 白い星を描画
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 2.5;
        const brightness = Math.random() * 0.8 + 0.2;

        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // カラフルな星を追加
      const colors = ['#ff6b9d', '#c44569', '#ffa502', '#00d2fc', '#00ff88', '#9d00ff', '#ffff00', '#ff00ff'];
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const brightness = Math.random() * 0.6 + 0.4;

        ctx.fillStyle = color;
        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ネビュラ効果
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const radius = Math.random() * 200 + 100;
        
        const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const nebulaColors = ['rgba(255, 100, 200, 0.1)', 'rgba(100, 150, 255, 0.05)', 'rgba(0, 0, 0, 0)'];
        nebulaGradient.addColorStop(0, nebulaColors[0]);
        nebulaGradient.addColorStop(0.5, nebulaColors[1]);
        nebulaGradient.addColorStop(1, nebulaColors[2]);

        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      return canvas.toDataURL();
    }

    // 3D星を生成
    generate3DStars(starCount = 2000) {
      // 既存の星を削除
      this.starMeshes.forEach(mesh => this.scene.remove(mesh));
      this.starMeshes = [];

      // スカイボックスがあれば削除
      if (this.skyboxMesh) {
        this.scene.remove(this.skyboxMesh);
        this.skyboxMesh = null;
      }

      // シーンの背景を宇宙色に設定
      this.scene.background = new THREE.Color(0x0a0e27);

      // 3D星を追加
      for (let i = 0; i < starCount; i++) {
        // ランダムな位置（球面上）
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 80 + Math.random() * 30;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        // 星のサイズ
        const size = Math.random() * 0.4 + 0.05;

        // 星の色
        const colors = [
          0xFFFFFF, // 白
          0xFF6B9D, // ピンク
          0xC44569, // 赤
          0xFFA502, // オレンジ
          0x00D2FC, // シアン
          0x00FF88, // ライムグリーン
          0x9D00FF, // パープル
          0xFFFF00, // イエロー
          0xFF00FF  // マゼンタ
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const brightness = Math.random() * 0.5 + 0.5;

        // スターのジオメトリとマテリアル
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        material.color.multiplyScalar(brightness);
        const star = new THREE.Mesh(geometry, material);

        star.position.set(x, y, z);

        // グロー効果を追加
        const haloGeometry = new THREE.SphereGeometry(size * 2.5, 8, 8);
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.copy(star.position);

        this.scene.add(star);
        this.scene.add(halo);
        this.starMeshes.push(star);
        this.starMeshes.push(halo);
      }

      this.mode = '3dstars';
    }

    // 3D シーンの初期化
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
      this.container.style.zIndex = '1'; // 背面に設定
      this.container.style.display = 'none';
      this.container.style.pointerEvents = 'none'; // マウスイベントを透過
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
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 0); // 透明背景
      this.renderer.shadowMap.enabled = true;
      this.container.appendChild(this.renderer.domElement);

      // デフォルトスカイボックスを初期化
      this.initDefaultSkybox();

      // ウィンドウリサイズ対応
      window.addEventListener('resize', () => this.onWindowResize());

      // アニメーションループを開始
      this.animate();

      this.isInitialized = true;
    }

    // デフォルトスカイボックスの初期化
    initDefaultSkybox() {
      const geometry = new THREE.SphereGeometry(100, 64, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');

      // グラデーション背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
      gradient.addColorStop(0, '#0a0e27');
      gradient.addColorStop(0.5, '#0d0815');
      gradient.addColorStop(1, '#1a0033');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2048, 2048);

      // 星を描画
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 2.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
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

      // 3D星を回転
      this.starMeshes.forEach(mesh => {
        mesh.rotation.x = this.rotationX;
        mesh.rotation.y = this.rotationY;
        mesh.rotation.z = this.rotationZ;
      });

      this.renderer.render(this.scene, this.camera);
    }

    onWindowResize = () => {
      if (!this.camera || !this.renderer) return;

      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // スカ��ボックスを表示
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

    // 回転を加算
    rotateBy(x, y, z) {
      this.rotationX += (x * Math.PI) / 180;
      this.rotationY += (y * Math.PI) / 180;
      this.rotationZ += (z * Math.PI) / 180;
    }

    // ズームを設定
    setZoom(value) {
      this.zoom = Math.max(0.1, value);
    }

    // スプライトコスチュームからテクスチャを取得
    getSpriteTextureAsDataURL(spriteName, costumeIndex) {
      try {
        // スプライト名からスプライトを取得
        const sprite = this.runtime.targets.find(t => t.name === spriteName);
        if (!sprite) {
          console.error('Sprite not found:', spriteName);
          return null;
        }

        const costumes = sprite.getCostumes();
        if (!costumes || costumes.length === 0) {
          console.error('No costumes found');
          return null;
        }

        const costumeIdx = Math.max(0, Math.min(costumeIndex, costumes.length - 1));
        const costume = costumes[costumeIdx];

        if (!costume || !costume.asset) {
          console.error('Costume not found at index:', costumeIdx);
          return null;
        }

        return costume.asset.encodeDataURI();
      } catch (e) {
        console.error('Failed to get sprite costume:', e);
        return null;
      }
    }

    // スプライトコスチュームをSkyテクスチャとして設定
    setSkyTextureFromSprite(spriteName, costumeIndex) {
      const textureUrl = this.getSpriteTextureAsDataURL(spriteName, costumeIndex);
      if (textureUrl) {
        this.setSkyboxTexture(textureUrl);
        this.mode = 'skybox';
      }
    }

    // スカイボックステクスチャを設定
    setSkyboxTexture(imageUrl) {
      if (!this.skyboxMesh) {
        this.initDefaultSkybox();
      }

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageUrl, (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        this.skyboxMesh.material.map = texture;
        this.skyboxMesh.material.needsUpdate = true;
      }, undefined, (error) => {
        console.error('Texture loading error:', error);
      });
    }

    // テクスチャを回転
    rotateTexture(angle) {
      if (!this.skyboxMesh || !this.skyboxMesh.material.map) return;
      this.skyboxMesh.material.map.rotation = (angle * Math.PI) / 180;
      this.skyboxMesh.material.map.center.set(0.5, 0.5);
    }

    // 明度を設定
    setBrightness(value) {
      this.brightness = Math.max(0, Math.min(value, 200)) / 100;
    }

    // ファイルから画像を読み込む
    openFileDialog() {
      this.fileInput.multiple = false;
      this.fileInput.click();
    }

    // ファイルからcubemapを読み込む
    openCubemapDialog() {
      this.fileInput.multiple = true;
      this.fileInput.click();
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
            opcode: 'show3DStars',
            blockType: Scratch.BlockType.COMMAND,
            text: '３D星空を表示'
          },
          {
            opcode: 'showDefaultSkybox',
            blockType: Scratch.BlockType.COMMAND,
            text: 'デフォルト星空を表示'
          },
          {
            opcode: 'setSkyTextureFromSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: 'このスプライトの [COSTUME_INDEX] 番目をskyテクスチャに設定',
            arguments: {
              COSTUME_INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
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
            opcode: 'rotateXBy',
            blockType: Scratch.BlockType.COMMAND,
            text: 'X軸を [X] 度回転',
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'rotateYBy',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Y軸を [Y] 度回転',
            arguments: {
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'rotateZBy',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Z軸を [Z] 度回転',
            arguments: {
              Z: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
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
            opcode: 'setBrightness',
            blockType: Scratch.BlockType.COMMAND,
            text: '明度を [BRIGHTNESS] に設定',
            arguments: {
              BRIGHTNESS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },
          {
            opcode: 'loadImageFromFile',
            blockType: Scratch.BlockType.COMMAND,
            text: 'ファイルから画像を読み込む'
          },
          {
            opcode: 'loadCubemapFromFiles',
            blockType: Scratch.BlockType.COMMAND,
            text: 'ファイルから cubemap を読み込む (6ファイル選択)'
          },
          {
            opcode: 'loadImageFromURL',
            blockType: Scratch.BlockType.COMMAND,
            text: 'URL [URL] から画像を読み込む',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/skybox.png'
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

    show3DStars() {
      this.skybox.showSkybox();
      this.skybox.generate3DStars();
    }

    showDefaultSkybox() {
      this.skybox.showSkybox();
      this.skybox.initDefaultSkybox();
      this.skybox.mode = 'skybox';
    }

    setSkyTextureFromSprite(args, util) {
      const costumeIndex = parseInt(args.COSTUME_INDEX) || 0;
      const spriteName = util.target.name;
      this.skybox.setSkyTextureFromSprite(spriteName, costumeIndex);
    }

    setRotation(args) {
      const x = parseFloat(args.X) || 0;
      const y = parseFloat(args.Y) || 0;
      const z = parseFloat(args.Z) || 0;
      this.skybox.setRotation(x, y, z);
    }

    rotateXBy(args) {
      const x = parseFloat(args.X) || 0;
      this.skybox.rotateBy(x, 0, 0);
    }

    rotateYBy(args) {
      const y = parseFloat(args.Y) || 0;
      this.skybox.rotateBy(0, y, 0);
    }

    rotateZBy(args) {
      const z = parseFloat(args.Z) || 0;
      this.skybox.rotateBy(0, 0, z);
    }

    setZoom(args) {
      const zoom = parseFloat(args.ZOOM) || 1;
      this.skybox.setZoom(zoom);
    }

    setBrightness(args) {
      const brightness = parseFloat(args.BRIGHTNESS) || 100;
      this.skybox.setBrightness(brightness);
    }

    loadImageFromFile() {
      this.skybox.openFileDialog();
    }

    loadCubemapFromFiles() {
      this.skybox.openCubemapDialog();
    }

    loadImageFromURL(args) {
      this.skybox.setSkyboxTexture(args.URL);
      this.skybox.mode = 'skybox';
    }
  }

  Scratch.extensions.register(new TurboWarpSkyboxExtension(Scratch.vm.runtime));
})(Scratch);
