// Safe-area insets as CSS variables (--safe-top / --safe-bottom), used for the solid band under the
// status bar and the tab bar's distance from the bottom. An iPhone home-screen app can run under the
// status bar while reporting no inset; then fall back to typical sizes so content never slides under it.
(function () {
  function apply() {
    var root = document.documentElement;
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
    root.appendChild(p);
    var s = getComputedStyle(p);
    var top = parseFloat(s.paddingTop) || 0, bottom = parseFloat(s.paddingBottom) || 0;
    p.remove();
    var standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
    var fullHeight = Math.abs(screen.height - innerHeight) < 4 || Math.abs(screen.width - innerHeight) < 4;
    if (standalone && fullHeight && top === 0 && innerHeight > innerWidth) {
      root.style.setProperty('--safe-top', '54px');
      root.style.setProperty('--safe-bottom', Math.max(bottom, 34) + 'px');
    } else {
      root.style.removeProperty('--safe-top');
      root.style.removeProperty('--safe-bottom');
    }
  }
  apply();
  addEventListener('resize', apply);
  addEventListener('orientationchange', apply);
})();
