import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc:
      "https://acefree86.github.io/image-tracking-angel_26/assets/Image/targets.mind",
    filterMinCF: 0.1,
    filterBeta: 10,
    warmupTolerance: 1,
    missTolerance: 1,
  });

  const { renderer, scene, camera } = mindarThree;

  const boxAnimashen = document.querySelector(".box");
  const startButton = document.querySelector("#startButton");
  const errorDisplay = document.querySelector("#error-message");
  let isRunning = false;

  // Спочатку показуємо анімацію завантаження, кнопку ховаємо
  startButton.style.display = "none";
  startButton.textContent = "";
  errorDisplay.textContent = "";

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight1.position.set(5, 5, 5);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-5, -5, 5);
  scene.add(directionalLight2);

  const groupM = new THREE.Group();
  let mixer;
  let anchor;

  // Отримуємо anchorIndex з URL
  const urlParams = new URLSearchParams(window.location.search);
  const anchorIndex = parseInt(urlParams.get("index")) || 0;

  // Налаштовуємо GLTFLoader + DRACOLoader
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/",
  );
  loader.setDRACOLoader(dracoLoader);

  const url =
    "https://acefree86.github.io/image-tracking-angel_26/assets/models/angel.glb";

  loader.load(
    url,
    // ✅ onLoad — модель завантажена повністю
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      groupM.add(model);

      // Ініціалізація анімації
      mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      // Додаємо groupM до анкора ТІЛЬКИ після завантаження моделі
      anchor = mindarThree.addAnchor(anchorIndex);
      anchor.group.add(groupM);

      // Показуємо кнопку "Старт" ТІЛЬКИ після успішного завантаження
      boxAnimashen.style.display = "none";
      startButton.style.display = "block";
      startButton.textContent = "Старт";
      errorDisplay.textContent = "";
      errorDisplay.style.display = "none";

      console.log("✅ Модель завантажена успішно");
    },
    // ℹ️ onProgress — показуємо прогрес, але НЕ змінюємо UI
    (xhr) => {
      if (xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`Завантаження моделі: ${percent}%`);
      }
    },
    // ❌ onError — показуємо помилку
    (error) => {
      boxAnimashen.style.display = "none";
      errorDisplay.textContent = "Помилка завантаження моделі";
      errorDisplay.style.color = "red";
      errorDisplay.style.fontSize = "20px";
      errorDisplay.style.display = "block";
      console.error("🔴 ПОМИЛКА ЗАВАНТАЖЕННЯ МОДЕЛІ:", error);
    },
  );

  // Використовуємо clock для точного deltaTime
  const clock = new THREE.Clock();

  // Start AR
  const start = async () => {
    try {
      await mindarThree.start();
      clock.start();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
      });
      isRunning = true;
      startButton.textContent = "Стоп";
    } catch (err) {
      console.error("🔴 Помилка запуску AR:", err);
      errorDisplay.textContent = "Помилка запуску камери";
      errorDisplay.style.color = "red";
      errorDisplay.style.display = "block";
    }
  };

  // Stop AR
  const stop = () => {
    mindarThree.stop();
    renderer.setAnimationLoop(null);
    clock.stop();
    isRunning = false;
    startButton.textContent = "Старт";
  };

  // При зміні видимості сторінки — перезавантаження
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isRunning) {
      stop();
    }
  });

  // Toggle AR по кліку
  startButton.addEventListener("click", () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  });
});
