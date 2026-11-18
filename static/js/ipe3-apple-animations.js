(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Scroll progress bar --- */
  const progressBar = document.createElement("div");
  progressBar.className = "ipe3-scroll-progress";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressBar);

  let ticking = false;
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  if (reducedMotion) return;

  /* --- IntersectionObserver for .ipe3-anim --- */
  const supportsNative = CSS.supports("animation-timeline: scroll()");

  if (!supportsNative) {
    const animObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ipe3-anim--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".ipe3-anim").forEach((el) => {
      animObserver.observe(el);
    });
  }

  /* --- Auto-tag sections for animation --- */
  const autoTargets = document.querySelectorAll(
    "main > section:not([class*='ipe3-anim']), " +
    "main > article, " +
    ".services-grid > .card, " +
    ".projects-grid > .project, " +
    ".contact-grid > *, " +
    ".grid.two-columns > *"
  );

  autoTargets.forEach((el, index) => {
    if (el.classList.contains("ipe3-anim")) return;
    el.classList.add("ipe3-anim", "ipe3-anim--fade-up");
    el.style.animationDelay = `${(index % 4) * 80}ms`;
  });

  /* --- Stagger grid children --- */
  document.querySelectorAll(".services-grid, .projects-grid").forEach((grid) => {
    grid.classList.add("ipe3-anim-stagger");
    if (!supportsNative) {
      animObserver.observe(grid);
    }
  });

  /* --- Parallax: hero image --- */
  const heroImage = document.querySelector(".hero-image");
  if (heroImage) {
    heroImage.classList.add("ipe3-parallax");
    let parallaxTicking = false;
    const updateParallax = () => {
      const scroll = window.scrollY;
      if (scroll < window.innerHeight) {
        heroImage.style.transform = `translate3d(0, ${scroll * 0.3}px, 0) scale(1.1)`;
      }
      parallaxTicking = false;
    };
    window.addEventListener("scroll", () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });
  }

  /* --- Text reveal for hero h1 --- */
  const heroTitle = document.querySelector(".hero h1");
  if (heroTitle) {
    const walk = (node) => {
      const result = [];
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const words = child.textContent.trim().split(/\s+/);
          words.forEach((word) => {
            const span = document.createElement("span");
            span.className = "ipe3-word";
            span.textContent = word;
            result.push(span);
            result.push(document.createTextNode(" "));
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName === "BR") {
            result.push(child.cloneNode());
          } else {
            const clone = child.cloneNode(false);
            walk(child).forEach((n) => clone.appendChild(n));
            result.push(clone);
          }
        }
      });
      return result;
    };

    const nodes = walk(heroTitle);
    heroTitle.innerHTML = "";
    nodes.forEach((n) => heroTitle.appendChild(n));
    heroTitle.classList.add("ipe3-text-reveal", "ipe3-anim");
    if (!supportsNative) {
      animObserver.observe(heroTitle);
    }
    requestAnimationFrame(() => {
      setTimeout(() => heroTitle.classList.add("ipe3-anim--visible"), 120);
    });
  }

  /* --- Stagger cards in about section --- */
  document.querySelectorAll(".about .card, .contact-details").forEach((el) => {
    el.classList.add("ipe3-anim", "ipe3-anim--slide-left");
  });

})();