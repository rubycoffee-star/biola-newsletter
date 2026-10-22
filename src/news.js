const Parser = require('rss-parser');
const { resolveGoogleNewsUrl, getArticleDetails } = require('./articles');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (DailyGrindNewsletter)' },
  customFields: { item: ['source'] },
});

// Each search is quoted so Google News matches the phrase, and limited to the past week.
const SEARCHES = [
  { query: '"coffee industry"', topic: 'Industry', blurb: 'reports on where the coffee business is heading' },
  { query: '"fair trade" coffee', topic: 'Fair Trade', blurb: 'reports on fair trade and how coffee is bought and sold' },
  { query: '"coffee farmers"', topic: 'Farmers', blurb: "reports on the people and communities who grow the world's coffee" },
  { query: '"sustainable coffee"', topic: 'Sustainability', blurb: 'covers sustainability across the coffee supply chain' },
  { query: '"ethical sourcing" coffee', topic: 'Ethical Sourcing', blurb: 'looks at how coffee is sourced and who benefits' },
];

const MAX_STORIES = 6;

function feedUrl(query) {
  const q = encodeURIComponent(`${query} when:7d`);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

// Google News titles look like "Headline - Publication"; split off the publication
// (some headlines also repeat it, e.g. "Headline | Publication").
function splitTitle(rawTitle, sourceName) {
  let title = (rawTitle || '').trim();
  if (sourceName && title.endsWith(` - ${sourceName}`)) {
    title = title.slice(0, -(sourceName.length + 3)).trim();
  } else {
    const idx = title.lastIndexOf(' - ');
    if (idx > 0) title = title.slice(0, idx).trim();
  }
  if (sourceName && title.endsWith(sourceName)) {
    const trimmed = title.slice(0, -sourceName.length).replace(/\s*[|\-–—:]\s*$/, '').trim();
    if (trimmed && trimmed !== title.slice(0, -sourceName.length).trim()) title = trimmed;
  }
  return title;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Fallback when the article's own meta description can't be fetched. Google News RSS
// descriptions usually repeat the headline and publication only, so use a short blurb.
// (The publication is already shown next to the date, so it isn't repeated here.)
function buildSummary(item, headline, source, blurb) {
  let extra = stripHtml(item.content || item.contentSnippet || '');
  extra = extra.replace(headline, '').replace(source, '').trim();
  if (extra.length > 40) {
    return extra.length > 220 ? `${extra.slice(0, 217).trim()}…` : extra;
  }
  return `${blurb[0].toUpperCase()}${blurb.slice(1)}. Tap "Read more" for the full story.`;
}

async function fetchSearch({ query, topic, blurb }) {
  const feed = await parser.parseURL(feedUrl(query));
  return (feed.items || []).map((item) => {
    const source = item.source && (typeof item.source === 'string' ? item.source : item.source._);
    const sourceName = (source || '').trim() || 'Google News';
    const headline = splitTitle(item.title, sourceName);
    return {
      headline,
      source: sourceName,
      link: item.link,
      date: item.isoDate ? new Date(item.isoDate) : new Date(item.pubDate),
      topic,
      summary: buildSummary(item, headline, sourceName, blurb),
    };
  });
}

async function getTopStories() {
  const results = await Promise.allSettled(SEARCHES.map(fetchSearch));
  const stories = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);

  if (stories.length === 0) {
    const reason = results.find((r) => r.status === 'rejected')?.reason;
    throw new Error(`Could not fetch any news from Google News${reason ? `: ${reason.message}` : ''}`);
  }

  stories.sort((a, b) => (b.date || 0) - (a.date || 0));

  const seenLinks = new Set();
  const seenTitles = new Set();
  const unique = [];
  for (const story of stories) {
    if (!story.headline || !story.link || isNaN(story.date)) continue;
    const key = normalize(story.headline);
    if (seenLinks.has(story.link) || seenTitles.has(key)) continue;
    seenLinks.add(story.link);
    seenTitles.add(key);
    unique.push(story);
    if (unique.length === MAX_STORIES) break;
  }

  await Promise.all(
    unique.map(async (story) => {
      // Point "Read more" straight at the publisher; keep the Google News link if that fails.
      try {
        story.link = await resolveGoogleNewsUrl(story.link);
      } catch (err) {
        console.warn(`Could not resolve publisher link for "${story.headline}": ${err.message}`);
        return;
      }
      const { summary, image } = await getArticleDetails(story.link, story.headline);
      if (summary) story.summary = summary;
      story.image = image;
    })
  );
  return unique;
}

module.exports = { getTopStories };
