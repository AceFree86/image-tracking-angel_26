import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  // Ініціалізація MindAR
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

  // Елементи DOM
  const boxAnimashen = document.querySelector(".box");
  const startButton = document.querySelector("#startButton");
  const errorDisplay = document.querySelector("#error-message");
  let isRunning = false;

  // Початкові стани елементів
  startButton.style.display = "none";
  errorDisplay.textContent = "";
  boxAnimashen.style.display = "block"; // Показуємо анімацію завантаження

  // Освітлення сцени
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight1.position.set(5, 5, 5);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-5, -5, 5);
  scene.add(directionalLight2);

  // Глобальні змінні для моделі та анкора
  const groupM = new THREE.Group();
  let mixer;
  let anchor; // Змінна для анкора
  const urlParams = new URLSearchParams(window.location.search);
  const anchorIndex = parseInt(urlParams.get("index")) || 0;

  // Иавантаження моделі
  const modelUrl =
    "https://acefree86.github.io/image-tracking-angel_26/assets/models/angel.glb"; // ✅ lower-case!
  const loader = new GLTFLoader();

  // -------------------------------------------------
  // Додаємо DRACO-стиснення (якщо модель використовує Draco)
  // -------------------------------------------------
  const dracoLoader = new DRACOLoader();
  // Використовуємо актуальний CDN для DRACO (версія має співпадати з Three.js)
  dracoLoader.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/",
  );
  loader.setDRACOLoader(dracoLoader);

  // -------------------------------------------------
  // Завантаження моделі
  // -------------------------------------------------
  loader.load(
    modelUrl,
    // ✅ Успішне завантаження — ТУТ робимо ВСЕ!
    (gltf) => {
      // 1. Налаштування моделі
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      groupM.add(model);

      // 2. Анімація (якщо є)
      mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      // 3. Створюємо анкор ТІЛЬКИ ПІСЛЯ завантаження моделі!
      anchor = mindarThree.addAnchor(anchorIndex);
      anchor.group.add(groupM); // Додаємо groupM до анкора

      // 4. Ховаємо анімацію завантаження, показуємо кнопку
      boxAnimashen.style.display = "none";
      startButton.style.display = "block";
      startButton.textContent = "Старт";
      errorDisplay.textContent = "";
      errorDisplay.style.color = "transparent";

      console.log("✅ Модель успішно завантажена!");
    },
    // 🔄 Прогрес завантаження
    (xhr) => {
      const percent = Math.round((xhr.loaded / xhr.total) * 100);
      console.log(`Завантажено: ${percent}%`);
      // errorDisplay.textContent = `Завантаження: ${percent}%`; // Опційно
    },
    // ❌ Помилка завантаження
    (error) => {
      console.error("🔴 ПОМИЛКА ЗАВАНТАЖЕННЯ МОДЕЛІ:", error);
      boxAnimashen.style.display = "none";
      startButton.style.display = "none";
      errorDisplay.textContent = "Помилка завантаження моделі";
      errorDisplay.style.color = "red";
      errorDisplay.style.fontSize = "20px";
    },
  );

  // -------------------------------------------------
  // Керування AR
  // -------------------------------------------------
  const startAR = async () => {
    try {
      await mindarThree.start();
      renderer.setAnimationLoop(() => {
        if (mixer) mixer.update(0.016); // Оновлення анімації
        renderer.render(scene, camera);
      });
      isRunning = true;
      startButton.textContent = "Стоп";
    } catch (err) {
      console.error("⚠️ Помилка старту AR:", err);
      errorDisplay.textContent = "Помилка запуску AR";
      errorDisplay.style.color = "red";
    }
  };

  const stopAR = () => {
    mindarThree.stop();
    renderer.setAnimationLoop(null);
    isRunning = false;
    startButton.textContent = "Старт";
  };

  // Перезавантаження при зміні вкладки (уникнення багів MindAR)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      location.reload();
    }
  });

  // Кнопка запуску/зупинки
  startButton.addEventListener("click", () => {
    if (isRunning) {
      stopAR();
    } else {
      startAR();
    }
  });
});