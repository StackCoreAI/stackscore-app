// Runs after DOM is ready; removes inline locks some libs set.
(function () {
  var elms = [document.documentElement, document.body];
  requestAnimationFrame(function () {
    elms.forEach(function (el) {
      el.style.overflow = "auto";
      el.style.overflowY = "auto";
      el.style.position = "static";
      el.style.height = "auto";
      el.style.minHeight = "100%";
    });
  });
})();
