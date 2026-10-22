const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const TIMEOUT_MS = 8000;
const MAX_SUMMARY_LENGTH = 280;

async function fetchText(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9', ...options.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Google News RSS links don't redirect to the publisher, so ask Google News
// for the real article URL using the signature embedded in its article page.
async function resolveGoogleNewsUrl(link) {
  const url = new URL(link);
  if (url.hostname !== 'news.google.com') return link;

  const id = url.pathname.split('/').pop();
  const page = await fetchText(`https://news.google.com/rss/articles/${id}`);
  const signature = page.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = page.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) throw new Error('Google News page had no decoding signature');

  const payload = [
    'garturlreq',
    [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
    id,
    Number(timestamp),
    signature,
  ];
  const body = `f.req=${encodeURIComponent(JSON.stringify([[['Fbv4je', JSON.stringify(payload), null, 'generic']]]))}`;
  const response = await fetchText('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  });

  const articleUrl = response.match(/\\"garturlres\\",\\"(https?:[^\\"]+)\\"/)?.[1];
  if (!articleUrl) throw new Error('Google News did not return an article URL');
  return articleUrl;
}

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const num = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : match;
    }
    return named[code.toLowerCase()] ?? match;
  });
}

// Find <meta property="og:description"> or <meta name="description">, in any attribute order.
function findMetaDescription(html) {
  const metas = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = {};
    for (const [, name, , value] of tag.matchAll(/([a-z:-]+)\s*=\s*(["'])([\s\S]*?)\2/gi)) {
      attrs[name.toLowerCase()] = value;
    }
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (attrs.content && !(key in metas)) metas[key] = attrs.content;
  }
  return metas['og:description'] || metas.description || '';
}

// Keep the first one or two sentences, capped at a newsletter-friendly length.
function toShortSummary(description) {
  const clean = decodeEntities(description).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+["'”’)]*(\s|$)|[^.!?]+$/g) || [clean];
  let summary = sentences[0].trim();
  if (sentences[1] && summary.length + sentences[1].length <= MAX_SUMMARY_LENGTH) {
    summary = `${summary} ${sentences[1].trim()}`;
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    summary = `${summary.slice(0, MAX_SUMMARY_LENGTH - 1).replace(/\s+\S*$/, '')}…`;
  }
  return summary;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Returns a 1–2 sentence summary from the article's meta description, or null if none is usable.
async function getArticleSummary(articleUrl, headline) {
  try {
    const html = await fetchText(articleUrl);
    const description = findMetaDescription(html);
    if (!description) return null;

    const summary = toShortSummary(description);
    // Skip descriptions that are too thin or just repeat the headline.
    if (summary.length < 40 || normalize(summary) === normalize(headline)) return null;
    return summary;
  } catch (err) {
    console.warn(`No summary for "${headline}": ${err.message}`);
    return null;
  }
}

module.exports = { resolveGoogleNewsUrl, getArticleSummary };
