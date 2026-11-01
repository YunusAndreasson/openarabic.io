// The one place a visitor can turn Google Analytics on or off. No banner anywhere, by the owner's choice.
(function () {
  var KEY = 'oa-analytics-consent';
  var panel = document.getElementById('choice');
  var status = document.getElementById('choice-status');
  var TEXT = { granted: 'You allowed Google Analytics, so it is on.', denied: 'You refused, so Google Analytics is off.' };
  var NONE = 'You have not made a choice, so Google Analytics is off.';
  var thisVisit = null;
  function read() { try { return localStorage.getItem(KEY) || thisVisit; } catch (e) { return thisVisit; } }
  function show() {
    var choice = read();
    status.textContent = TEXT[choice] || NONE;
    panel.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.choice === choice)); });
  }
  function save(choice) {
    thisVisit = choice;
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    if (choice === 'denied') { if (window.oaStopAnalytics) window.oaStopAnalytics(); }
    else if (!window.oaStopAnalytics) { var s = document.createElement('script'); s.src = '/ga.js'; document.head.appendChild(s); }
    show();
  }
  panel.hidden = false;
  panel.addEventListener('click', function (event) { var c = event.target.dataset && event.target.dataset.choice; if (c) save(c); });
  show();
})();
