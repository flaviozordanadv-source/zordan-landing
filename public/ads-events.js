/* Google Ads: conversao especifica de clique no WhatsApp do site.
   Identifica cliques; nao comprova mensagem enviada nem contratacao.
   Nao coleta nome, telefone ou conteudo da conversa. */
(function () {
  var GOOGLE_ADS_ID = 'AW-16606395478';
  var WHATSAPP_CONVERSION = 'AW-16606395478/T9joCJyDsrEdENb4xe49';

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ADS_ID);

  if (!document.querySelector('script[data-zordan-google-tag]')) {
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_ADS_ID);
    tag.setAttribute('data-zordan-google-tag', 'true');
    document.head.appendChild(tag);
  }

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
      var target = new URL(link.href, window.location.href);
      if (target.protocol !== 'https:' ||
          (target.hostname !== 'wa.me' && target.hostname !== 'api.whatsapp.com')) return;

      window.dataLayer.push({
        event: 'whatsapp_click',
        contact_channel: 'whatsapp',
        contact_area: area(),
        page_path: window.location.pathname
      });

      window.gtag('event', 'conversion', {
        send_to: WHATSAPP_CONVERSION,
        value: 1.0,
        currency: 'BRL'
      });
    } catch (_) {
      // Falhas ao interpretar o link nao devem impedir a navegacao.
    }
  });
})();
