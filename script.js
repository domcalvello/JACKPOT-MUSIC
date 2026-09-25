(() => {
  "use strict";

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
    playBtn.textContent = '▶ Preview';

    const downloadBtn = document.createElement('a');
    downloadBtn.textContent = '⬇ Download';
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
        if (activeBtn) activeBtn.textContent = '▶ Preview';
      }

      if (!audioEl) {
        audioEl = new Audio(url);
        audioEl.addEventListener('ended', () => {
          playBtn.textContent = '▶ Preview';
        });
      }

      if (audioEl.paused) {
        audioEl.play();
        playBtn.textContent = '⏸ Pause';
        activeAudio = audioEl;
        activeBtn = playBtn;
      } else {
        audioEl.pause();
        playBtn.textContent = '▶ Preview';
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
