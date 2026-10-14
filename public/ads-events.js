/* Eventos de interacao para futura configuracao no Google Tag Manager/Google Ads.
   Nao envia dados pessoais nem define conversoes por conta propria. */
(function () {
  window.dataLayer = window.dataLayer || [];
  function area() {
    var path = window.location.pathname;
    if (path.indexOf('/familia/') === 0) return 'familia';
    if (path.indexOf('/bancario/') === 0) return 'bancario';
    if (path.indexOf('/civil/') === 0) return 'civil';
    if (path.indexOf('/trabalhista/') === 0) return 'trabalhista';
    if (path.indexOf('/consumidor/') === 0) return 'consumidor';
    return 'geral';
  }
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    try {
      var target = new URL(link.href);
      if ((target.hostname === 'wa.me' || target.hostname === 'api.whatsapp.com') && target.protocol === 'https:') {
        window.dataLayer.push({
          event: 'whatsapp_click',
          contact_channel: 'whatsapp',
          contact_area: area(),
          page_path: window.location.pathname
        });
      }
    } catch (_) {}
  });
})();
