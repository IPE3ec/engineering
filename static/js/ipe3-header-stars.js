(() => {
  const container = document.getElementById("header-stars");
  if (!container) return;

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 45; index += 1) {
    const star = document.createElement("span");
    star.className = "ipe3-star";
    star.style.setProperty("--left", `${Math.random() * 100}%`);
    star.style.setProperty("--top", `${Math.random() * 100}%`);
    star.style.setProperty("--size", `${1 + Math.random() * 2}px`);
    star.style.setProperty("--duration", `${12 + Math.random() * 20}s`);
    star.style.setProperty("--glow-duration", `${2 + Math.random() * 4}s`);
    star.style.setProperty("--delay", `${-Math.random() * 30}s`);
    fragment.appendChild(star);
  }

  container.appendChild(fragment);
})();
