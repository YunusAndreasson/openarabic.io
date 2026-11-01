// Loaded only after a visitor agrees at /analytics-choice. Nothing else on this site talks to Google. Ported from the consent work in the abandoned site fix.
(function () {
  var ID = 'G-00Q1GM3YQP';
  var KEY = 'oa-analytics-consent';
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(script);

  // Refusing must stop this page too, and every other tab, with nothing left in the queue.
  function stop() {
    window['ga-disable-' + ID] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    dataLayer.length = 0;
    var labels = location.hostname.split('.');
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^(_ga(_.*)?|_gid|_gat.*)$/.test(name)) return;
      for (var i = 0; i <= labels.length - 1; i += 1) {
        var domain = i === 0 ? '' : '; domain=' + labels.slice(i - 1).join('.');
        document.cookie = name + '=; Max-Age=0; path=/' + domain;
      }
    });
  }
  window.oaStopAnalytics = stop;
  addEventListener('storage', function (event) {
    if (event.key === KEY && event.newValue !== 'granted') stop();
  });
})();
