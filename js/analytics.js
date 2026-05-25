/**
 * AltMaster GA4 helper: queues events safely before gtag boots.
 */
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.amTrack = function (eventName, params) {
    window.gtag("event", eventName, params || {});
  };
})();
