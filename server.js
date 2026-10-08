require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

app.use(express.static(path.join(__dirname, 'public')));

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanPhone(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^0-9+()\-\s]/g, '').trim().slice(0, 30);
}

function html(value) {
  return validator.escape(String(value || '')).replace(/\n/g, '<br>');
}

function looksLikeSpam(message) {
  const lower = message.toLowerCase();
  const urls = (message.match(/https?:\/\//gi) || []).length;
  const suspiciousTerms = [
    'casino', 'viagra', 'crypto investment', 'seo service', 'guest post', 'backlink'
  ];
  return urls > 2 || suspiciousTerms.some((term) => lower.includes(term));
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'zordan-lead-api' });
});

app.post('/api/leads', leadLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    const nome = cleanText(body.nome, 100);
    const email = typeof body.email === 'string' ? validator.normalizeEmail(body.email.trim()) : '';
    const telefone = cleanPhone(body.telefone);
    const mensagem = cleanText(body.mensagem, 2500);
    const cidade = cleanText(body.cidade, 100);
    const area = cleanText(body.area, 100);
    const processo = cleanText(body.processo, 80);
    const origem = cleanText(body.origem, 80) || 'Google Ads';
    const pagina = cleanText(body.pagina, 500);
    const gclid = cleanText(body.gclid, 200);
    const utmSource = cleanText(body.utm_source, 120);
    const utmMedium = cleanText(body.utm_medium, 120);
    const utmCampaign = cleanText(body.utm_campaign, 180);
    const utmTerm = cleanText(body.utm_term, 180);

    const errors = [];
    if (nome.length < 3) errors.push('Nome inválido.');
    if (!email || !validator.isEmail(email)) errors.push('E-mail inválido.');
    if (telefone.replace(/\D/g, '').length < 10) errors.push('Telefone inválido.');
    if (mensagem.length < 10) errors.push('Mensagem muito curta.');
    if (looksLikeSpam(mensagem)) errors.push('Conteúdo identificado como spam.');

    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }

    const receivedAt = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const subject = `Novo lead do Google Ads - ${nome}`;

    const fields = [
      ['Origem', origem],
      ['Data/Hora', receivedAt],
      ['Nome', nome],
      ['E-mail', email],
      ['Telefone', telefone],
      ['Cidade', cidade || '-'],
      ['Área', area || '-'],
      ['Processo', processo || '-'],
      ['GCLID', gclid || '-'],
      ['UTM Source', utmSource || '-'],
      ['UTM Medium', utmMedium || '-'],
      ['UTM Campaign', utmCampaign || '-'],
      ['UTM Term', utmTerm || '-'],
      ['Página', pagina || '-'],
    ];

    const textBody = [
      'Novo contato recebido pela Landing Page.',
      '',
      ...fields.map(([label, value]) => `${label}: ${value}`),
      '',
      'Mensagem:',
      mensagem,
    ].join('\n');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="color:#0f2747">Novo lead vindo do Google Ads</h2>
        ${fields.map(([label, value]) => `<p><strong>${html(label)}:</strong> ${html(value)}</p>`).join('')}
        <hr>
        <p><strong>Mensagem:</strong></p>
        <p>${html(mensagem)}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL || 'flaviozordan.adv@gmail.com',
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return res.status(201).json({
      ok: true,
      message: 'Contato recebido com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    return res.status(500).json({
      ok: false,
      error: 'Não foi possível enviar seu contato agora. Tente novamente em alguns minutos.',
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Zordan Landing Page disponível na porta ${PORT}`);
});
