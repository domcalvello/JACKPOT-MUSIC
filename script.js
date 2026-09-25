(() => {
  "use strict";

  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initializeLuxuryMotion() {
    const cursor = document.querySelector(".gold-cursor");
    const cursorLabel = cursor?.querySelector(".gold-cursor__label");
    const logo = document.querySelector("[data-jackpot-logo]");
    const burst = document.querySelector(".jackpot-burst");
    const reels = document.querySelector(".slot-reels");
    const kineticType = document.querySelector(".kinetic-type");
    const tiltCards = document.querySelectorAll(".media-bay, .u-win-art-bezel");
    const reactiveSurfaces = document.querySelectorAll(".hero-marquee-inner, .pcloud-player");

    if (motionAllowed && window.matchMedia("(hover: hover) and (pointer: fine)").matches && cursor) {
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let currentX = targetX;
      let currentY = targetY;
      let lastCoinX = targetX;
      let lastCoinY = targetY;
      let lastCoinTime = 0;
      let cursorFrame = null;
      let hasPointer = false;
      let coinIndex = 0;

      const coinSymbols = ["J", "$", "7", "♠"];
      const coinPool = Array.from({ length: 40 }, (_, index) => {
        const coin = document.createElement("span");
        coin.className = "gold-cursor__coin";
        coin.textContent = coinSymbols[index % coinSymbols.length];
        document.body.append(coin);
        return coin;
      });

      const spawnCoin = (x, y) => {
        const coin = coinPool[coinIndex % coinPool.length];
        const variant = coinIndex % 7;
        const direction = coinIndex % 2 ? 1 : -1;
        const driftX = direction * (8 + variant * 2.4);
        const driftY = 22 + (variant % 4) * 7;
        const rotation = direction * (70 + variant * 19);
        const startScale = 0.56 + (variant % 3) * 0.1;
        coinIndex += 1;

        coin.getAnimations().forEach((animation) => animation.cancel());
        coin.textContent = coinSymbols[coinIndex % coinSymbols.length];
        coin.style.willChange = "transform, opacity";
        const animation = coin.animate([
          {
            opacity: 0.86,
            transform: `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0) rotateY(0deg) rotateZ(0deg) scale(${startScale})`,
          },
          {
            offset: 0.42,
            opacity: 0.7,
            transform: `translate3d(${x + driftX * 0.55}px, ${y + driftY * 0.28}px, 0) translate3d(-50%, -50%, 0) rotateY(155deg) rotateZ(${rotation * 0.45}deg) scale(${startScale + 0.18})`,
          },
          {
            opacity: 0,
            transform: `translate3d(${x + driftX}px, ${y + driftY}px, 0) translate3d(-50%, -50%, 0) rotateY(360deg) rotateZ(${rotation}deg) scale(${startScale * 0.72})`,
          },
        ], {
          duration: 2000,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        });
        animation.finished.then(() => {
          animation.cancel();
          coin.style.willChange = "auto";
        }, () => {});
      };

      const renderCursor = (now) => {
        currentX += (targetX - currentX) * 0.19;
        currentY += (targetY - currentY) * 0.19;
        cursor.style.setProperty("--cursor-x", `${currentX}px`);
        cursor.style.setProperty("--cursor-y", `${currentY}px`);

        const coinDistance = Math.hypot(currentX - lastCoinX, currentY - lastCoinY);
        if (coinDistance > 11 && now - lastCoinTime > 52) {
          spawnCoin(currentX, currentY);
          lastCoinX = currentX;
          lastCoinY = currentY;
          lastCoinTime = now;
        }

        if (Math.hypot(targetX - currentX, targetY - currentY) > 0.12) {
          cursorFrame = requestAnimationFrame(renderCursor);
        } else {
          cursorFrame = null;
        }
      };

      window.addEventListener("pointermove", (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (!hasPointer) {
          currentX = targetX;
          currentY = targetY;
          lastCoinX = targetX;
          lastCoinY = targetY;
          cursor.style.setProperty("--cursor-x", `${currentX}px`);
          cursor.style.setProperty("--cursor-y", `${currentY}px`);
          hasPointer = true;
        }
        cursor.classList.add("is-visible");
        const interactive = event.target.closest("[data-cursor-label], a, button, iframe");
        cursor.classList.toggle("is-interactive", Boolean(interactive));
        cursorLabel.textContent = interactive?.dataset.cursorLabel || (interactive?.tagName === "IFRAME" ? "LISTEN" : interactive ? "OPEN" : "");
        if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
      }, { passive: true });
      document.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
      document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));
      document.addEventListener("pointerleave", (event) => {
        if (event.relatedTarget === null) cursor.classList.remove("is-visible");
      });
    }

    if (motionAllowed && reels && kineticType) {
      let ticking = false;
      const updateParallax = () => {
        const scrollY = window.scrollY;
        reels.style.transform = `translate3d(0, ${scrollY * -0.055}px, 0)`;
        kineticType.style.transform = `translate3d(0, ${scrollY * -0.025}px, 0)`;
        ticking = false;
      };
      window.addEventListener("scroll", () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateParallax);
        }
      }, { passive: true });
      updateParallax();
    }

    if (motionAllowed) {
      tiltCards.forEach((card) => {
        card.classList.add("is-tiltable");
        let frame = null;
        let bounds = null;
        let pointerX = 0;
        let pointerY = 0;
        card.addEventListener("pointerenter", () => {
          bounds = card.getBoundingClientRect();
          card.classList.add("is-tilt-active");
        }, { passive: true });
        card.addEventListener("pointermove", (event) => {
          if (!bounds) return;
          pointerX = (event.clientX - bounds.left) / bounds.width;
          pointerY = (event.clientY - bounds.top) / bounds.height;
          if (!frame) {
            frame = requestAnimationFrame(() => {
              const rotateY = (pointerX - 0.5) * 5;
              const rotateX = (pointerY - 0.5) * -5;
              card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
              card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
              card.style.setProperty("--sheen-x", `${((pointerX - 0.5) * 16).toFixed(2)}%`);
              card.style.setProperty("--sheen-y", `${((pointerY - 0.5) * 10).toFixed(2)}%`);
              frame = null;
            });
          }
        }, { passive: true });
        card.addEventListener("pointerleave", () => {
          bounds = null;
          card.classList.remove("is-tilt-active");
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--sheen-x", "0%");
          card.style.setProperty("--sheen-y", "0%");
        });
      });

      reactiveSurfaces.forEach((surface) => {
        const glint = document.createElement("span");
        glint.className = "surface-glint";
        surface.classList.add("is-surface-reactive");
        surface.append(glint);

        let bounds = null;
        let frame = null;
        let x = 0;
        let y = 0;
        surface.addEventListener("pointerenter", () => {
          bounds = surface.getBoundingClientRect();
          surface.classList.add("is-surface-active");
        }, { passive: true });
        surface.addEventListener("pointermove", (event) => {
          if (!bounds) return;
          x = event.clientX - bounds.left;
          y = event.clientY - bounds.top;
          if (!frame) {
            frame = requestAnimationFrame(() => {
              glint.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate3d(-50%, -50%, 0)`;
              frame = null;
            });
          }
        }, { passive: true });
        surface.addEventListener("pointerleave", () => {
          bounds = null;
          surface.classList.remove("is-surface-active");
        });
      });
    }

    const celebrate = () => {
      if (!burst) return;
      burst.replaceChildren();
      burst.classList.remove("is-active");
      void burst.offsetWidth;
      burst.classList.add("is-active");
      burst.setAttribute("aria-label", "JACKPOT");
      ["777", "$", "♠", "◆", "J", "★", "$", "777"].forEach((symbol, index) => {
        const chip = document.createElement("span");
        const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
        chip.textContent = symbol;
        chip.style.setProperty("--burst-x", `${Math.cos(angle) * (74 + (index % 2) * 30)}px`);
        chip.style.setProperty("--burst-y", `${Math.sin(angle) * (74 + (index % 3) * 18)}px`);
        chip.style.setProperty("--burst-delay", `${index * 18}ms`);
        burst.append(chip);
      });
      window.setTimeout(() => burst.classList.remove("is-active"), 1050);
    };

    logo?.addEventListener("click", (event) => {
      if (event.detail === 3) celebrate();
    });
    logo?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") celebrate();
    });
  }

  initializeLuxuryMotion();

  const profileFrame = document.querySelector("#soundcloud-profile");
  const uWinFrame = document.querySelector("#soundcloud-uwin");
  const youtubeFrame = document.querySelector("#youtube-player");
  const shells = new Map(
    [...document.querySelectorAll("[data-player-shell]")].map((element) => [
      element.dataset.playerShell,
      element,
    ]),
  );

  let activePlayer = null;
  let youtubePlayer = null;
  let youtubeReady = false;
  const soundCloudWidgets = new Map();

  function setActive(player) {
    activePlayer = player;
    for (const [id, shell] of shells) {
      shell.classList.toggle("is-active", id === player);
    }
  }

  function pauseSoundCloud(except) {
    for (const [id, widget] of soundCloudWidgets) {
      if (id !== except) widget.pause();
    }
  }

  function initializeSoundCloud() {
    if (!window.SC || soundCloudWidgets.size || !profileFrame || !uWinFrame) return;

    const factory = window.SC.Widget;
    const entries = [
      ["soundcloud", factory(profileFrame)],
      ["uwin", factory(uWinFrame)],
    ];

    for (const [id, widget] of entries) {
      soundCloudWidgets.set(id, widget);

      widget.bind(factory.Events.PLAY, () => {
        pauseSoundCloud(id);
        if (youtubeReady && youtubePlayer) youtubePlayer.pauseVideo();
        setActive(id);
      });

      const clearActive = () => {
        if (activePlayer === id) setActive(null);
      };

      widget.bind(factory.Events.PAUSE, clearActive);
      widget.bind(factory.Events.FINISH, clearActive);
      widget.bind(factory.Events.ERROR, clearActive);
    }
  }

  function initializeYouTube() {
    if (!window.YT || !window.YT.Player || !youtubeFrame || youtubePlayer) return;

    youtubePlayer = new window.YT.Player(youtubeFrame, {
      events: {
        onReady() {
          youtubeReady = true;
        },
        onStateChange(event) {
          const state = window.YT.PlayerState;

          if (event.data === state.BUFFERING || event.data === state.PLAYING) {
            pauseSoundCloud(null);
          }

          if (event.data === state.PLAYING) {
            setActive("youtube");
          } else if (
            (event.data === state.PAUSED || event.data === state.ENDED) &&
            activePlayer === "youtube"
          ) {
            setActive(null);
          }
        },
      },
    });
  }

  if (youtubeFrame) {
    const videoId = youtubeFrame.dataset.videoId;
    const parameters = new URLSearchParams({
      enablejsapi: "1",
      origin: window.location.origin,
      autoplay: "0",
      playsinline: "1",
      rel: "0",
    });
    youtubeFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${parameters}`;
  }

  const soundCloudApi = document.createElement("script");
  soundCloudApi.src = "https://w.soundcloud.com/player/api.js";
  soundCloudApi.async = true;
  soundCloudApi.addEventListener("load", initializeSoundCloud, { once: true });
  document.head.appendChild(soundCloudApi);

  window.onYouTubeIframeAPIReady = initializeYouTube;
  const youtubeApi = document.createElement("script");
  youtubeApi.src = "https://www.youtube.com/iframe_api";
  youtubeApi.async = true;
  document.head.appendChild(youtubeApi);
})();

(function () {
  
  const PCLOUD_FOLDER_CODE = 'kZ0VW4JZARhG2q8K4nQdUzNBKJpeEk1uaayk';
  const listEl = document.getElementById('pcloud-player-list');
  let activeAudio = null;
  let activeBtn = null;

  async function loadTracks() {
    try {
      const res = await fetch(`https://api.pcloud.com/showpublink?code=${PCLOUD_FOLDER_CODE}`);
      const data = await res.json();
      if (data.result !== 0 || !data.metadata || !data.metadata.contents) {
        throw new Error('pCloud folder not found or not public');
      }
      const tracks = data.metadata.contents.filter(
        (f) => !f.isfolder && /\.(mp3|wav|m4a|flac)$/i.test(f.name)
      );
      listEl.innerHTML = '';
      if (!tracks.length) {
        listEl.innerHTML = '<p class="pcloud-player__status">No tracks found yet.</p>';
        return;
      }
      tracks.forEach(renderTrack);
    } catch (err) {
      console.error('pCloud player error:', err);
      listEl.innerHTML =
        '<p class="pcloud-player__status">Couldn\'t load tracks right now.</p>';
    }
  }

  async function getDirectUrl(fileid) {
    const res = await fetch(
      `https://api.pcloud.com/getpublinkdownload?code=${PCLOUD_FOLDER_CODE}&fileid=${fileid}`
    );
    const data = await res.json();
    if (data.result !== 0) throw new Error('Could not resolve file link');
    return `https://${data.hosts[0]}${data.path}`;
  }

  function renderTrack(file) {
    const row = document.createElement('div');
    row.className = 'track-row';

    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = file.name.replace(/\.[^/.]+$/, '');

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = 'PLAY';
    playBtn.dataset.cursorLabel = 'PLAY';

    const downloadBtn = document.createElement('a');
    downloadBtn.textContent = 'GET FILE';
    downloadBtn.dataset.cursorLabel = 'OPEN';
    downloadBtn.href = '#';

    let audioEl = null;
    let cachedUrl = null;

    async function ensureUrl() {
      if (!cachedUrl) cachedUrl = await getDirectUrl(file.fileid);
      return cachedUrl;
    }

    playBtn.addEventListener('click', async () => {
      const url = await ensureUrl();

      if (activeAudio && activeAudio !== audioEl) {
        activeAudio.pause();
        if (activeBtn) activeBtn.textContent = 'PLAY';
      }

      if (!audioEl) {
        audioEl = new Audio(url);
        audioEl.addEventListener('ended', () => {
          playBtn.textContent = 'PLAY';
        });
      }

      if (audioEl.paused) {
        audioEl.play();
        playBtn.textContent = 'PAUSE';
        activeAudio = audioEl;
        activeBtn = playBtn;
      } else {
        audioEl.pause();
        playBtn.textContent = 'PLAY';
      }
    });

    downloadBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = await ensureUrl();
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    row.appendChild(name);
    row.appendChild(playBtn);
    row.appendChild(downloadBtn);
    listEl.appendChild(row);
  }

  loadTracks();
})();
