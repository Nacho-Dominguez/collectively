(() => {
  const mission = document.querySelector('.mission');
  const buttons = [...(mission?.querySelectorAll('[data-mission-layout]') || [])];
  if (!mission || buttons.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      mission.dataset.layout = button.dataset.missionLayout;
      buttons.forEach((option) => {
        option.setAttribute('aria-pressed', String(option === button));
      });
    });
  });
})();
