import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc:
      "https://github.com/AceFree86/image-tracking-angel_26/blob/main/assets/Image/targets.mind",
    filterMinCF: 0.1,
    filterBeta: 10,
    warmupTolerance: 1,
    missTolerance: 1,
  });

  const { renderer, scene, camera } = mindarThree;

  const boxAnimashen = document.querySelector(".box"); // Ваш лоадер
  const startButton = document.querySelector("#startButton");
  const errorDisplay = document.querySelector("#error-message");
  let isRunning = false;
  let mixer;

  // Початковий стан UI
  startButton.style.display = "none";
  if (errorDisplay) errorDisplay.style.display = "none";

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  // Налаштування завантажувача з DRACO
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  // Використовуємо стабільний CDN для декодера
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  loader.setDRACOLoader(dracoLoader);

  const urlParams = new URLSearchParams(window.location.search);
  const anchorIndex = parseInt(urlParams.get("index")) || 0;
  const modelUrl =
    "https://github.com/AceFree86/image-tracking-angel_26/blob/main/assets/models/Angel.glb";

  loader.load(
    modelUrl,
    // ✅ УСПІШНЕ ЗАВАНТАЖЕННЯ
    (gltf) => {
      const model = gltf.scene;
      const groupM = new THREE.Group();
      groupM.add(model);

      mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        mixer.clipAction(gltf.animations[0]).play();
      }

      const anchor = mindarThree.addAnchor(anchorIndex);
      anchor.group.add(groupM);

      // Даємо браузеру 200мс "відпочити" після парсингу важкої моделі
      setTimeout(() => {
        if (boxAnimashen) boxAnimashen.style.display = "none";
        startButton.style.display = "block";
        startButton.textContent = "Старт";
        console.log("✅ Модель готова до використання");
      }, 200);
    },
    // ℹ️ ПРОГРЕС ЗАВАНТАЖЕННЯ
    (xhr) => {
      if (xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        // Якщо у вас є текст всередині лоадера, оновлюємо його
        if (boxAnimashen)
          boxAnimashen.textContent = `Завантаження: ${percent}%`;
      }
    },
    // ❌ ПОМИЛКА
    (error) => {
      console.error("Помилка завантаження:", error);
      if (boxAnimashen) boxAnimashen.style.display = "none";
      if (errorDisplay) {
        errorDisplay.style.display = "block";
        errorDisplay.textContent = "Не вдалося завантажити 3D модель";
      }
    },
  );

  const clock = new THREE.Clock();

  const start = async () => {
    try {
      await mindarThree.start();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
      });
      isRunning = true;
      startButton.textContent = "Стоп";
    } catch (err) {
      console.error("AR Start Error:", err);
    }
  };

  const stop = () => {
    mindarThree.stop();
    renderer.setAnimationLoop(null);
    isRunning = false;
    startButton.textContent = "Старт";
  };

  startButton.addEventListener("click", () => {
    isRunning ? stop() : start();
  });

  // Автоматичне перезавантаження при зміні вкладки для стабільності камери
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isRunning) location.reload();
  });
});
