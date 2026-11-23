const $lightbox = document.getElementById('lightbox');
const $stage = document.getElementById('lightbox-stage');
const lightboxState = { gallery: [], index: 0, hls: null };
const mediaStyle = 'max-width: 92vw; max-height: 88vh; border-radius: 6px; background: #000;';
const videoStyle = `${mediaStyle} width: min(92vw, calc(88vh * 16 / 9)); aspect-ratio: 16 / 9;`;

const galleryItems = ($card) => [...$card.querySelectorAll('[data-full]')];

const createImage = (src) => Object.assign(document.createElement('img'), { src, style: mediaStyle });

const createVideo = (src) => {
  const $video = Object.assign(document.createElement('video'), { controls: true, autoplay: true, style: videoStyle });
  if ($video.canPlayType('application/vnd.apple.mpegurl')) $video.src = src;
  else if (window.Hls?.isSupported()) {
    lightboxState.hls = new Hls();
    lightboxState.hls.loadSource(src);
    lightboxState.hls.attachMedia($video);
  }

  return $video;
};

const clearStage = () => {
  lightboxState.hls?.destroy();
  lightboxState.hls = null;
  $stage.replaceChildren();
};

const renderLightbox = () => {
  clearStage();
  const { dataset: { type, full } } = lightboxState.gallery[lightboxState.index];
  $stage.appendChild(type === 'video' ? createVideo(full) : createImage(full));
};

const openLightbox = ($item) => {
  lightboxState.gallery = galleryItems($item.closest('.backlog-card'));
  lightboxState.index = lightboxState.gallery.indexOf($item);
  $lightbox.style.display = 'flex';
  renderLightbox();
};

const closeLightbox = () => {
  clearStage();
  $lightbox.style.display = 'none';
};

const moveLightbox = (step) => {
  const { length } = lightboxState.gallery;
  lightboxState.index = (lightboxState.index + step + length) % length;
  renderLightbox();
};

document.querySelectorAll('[data-full]').forEach($item => $item.addEventListener('click', () => openLightbox($item)));
document.getElementById('lightbox-prev').addEventListener('click', event => { event.stopPropagation(); moveLightbox(-1); });
document.getElementById('lightbox-next').addEventListener('click', event => { event.stopPropagation(); moveLightbox(1); });
$lightbox.addEventListener('click', event => { if (event.target === $lightbox || event.target === $stage) closeLightbox(); });
document.addEventListener('keydown', ({ key }) => {
  if ($lightbox.style.display === 'none') return;
  if (key === 'Escape') closeLightbox();
  if (key === 'ArrowLeft') moveLightbox(-1);
  if (key === 'ArrowRight') moveLightbox(1);
});
