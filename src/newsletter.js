// Biola University brand colors (biola.edu/brand/toolkits-standards/visual-design)
const BRAND = {
  red: '#CC1122', // Biola Red
  black: '#000000',
  white: '#FFFFFF',
  gradBlue: '#1D273B', // Grad Blue
  skyBlue: '#E2EFF8', // Sky Blue
  sycamore: '#E6E3D5', // Sycamore Bark (secondary)
  slate: '#2F3E53', // Talbot East Slate (secondary)
};

// Gotham is Biola's primary typeface; Proxima Nova / Helvetica are the approved substitutes.
// League Spartan (bold only) is the secondary typeface for large headlines.
const FONT_BODY = "Gotham, 'Proxima Nova', Helvetica, Arial, sans-serif";
const FONT_HEADLINE = "'League Spartan', Gotham, Helvetica, Arial, sans-serif";

const HEADER_IMAGE =
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&h=360&fit=crop&auto=format&fm=jpg&q=80';

const TIME_ZONE = 'America/Los_Angeles';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(date, opts) {
  return date.toLocaleDateString('en-US', { timeZone: TIME_ZONE, ...opts });
}

function storyBlock(story, isLast) {
  const date = formatDate(story.date, { month: 'short', day: 'numeric', year: 'numeric' });
  const border = isLast ? '' : `border-bottom:1px solid ${BRAND.sycamore};`;
  return `
          <tr>
            <td style="padding:28px 40px;${border}">
              <p style="margin:0 0 8px 0;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.red};">${escapeHtml(story.topic)}</p>
              <h2 style="margin:0 0 8px 0;font-family:${FONT_HEADLINE};font-size:21px;line-height:1.3;font-weight:bold;color:${BRAND.black};">
                <a href="${escapeHtml(story.link)}" style="color:${BRAND.black};text-decoration:none;">${escapeHtml(story.headline)}</a>
              </h2>
              <p style="margin:0 0 12px 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.slate};">
                <strong>${escapeHtml(story.source)}</strong> &nbsp;&middot;&nbsp; ${escapeHtml(date)}
              </p>
              <p style="margin:0 0 16px 0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:#333333;">${escapeHtml(story.summary)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:${BRAND.red};border-radius:3px;">
                    <a href="${escapeHtml(story.link)}" style="display:inline-block;padding:10px 20px;font-family:${FONT_BODY};font-size:13px;font-weight:bold;letter-spacing:0.5px;color:${BRAND.white};text-decoration:none;">Read more &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function buildNewsletter(stories, now = new Date()) {
  const today = formatDate(now, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const subject = `The Daily Grind — ${formatDate(now, { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const storiesHtml = stories.map((s, i) => storyBlock(s, i === stories.length - 1)).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.sycamore};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.sycamore};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${BRAND.white};">

          <!-- Brand bar -->
          <tr>
            <td style="background-color:${BRAND.red};padding:12px 40px;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${BRAND.white};">
              Biola University
            </td>
          </tr>

          <!-- Masthead -->
          <tr>
            <td style="padding:36px 40px 28px 40px;border-bottom:4px solid ${BRAND.black};">
              <h1 style="margin:0;font-family:${FONT_HEADLINE};font-size:40px;line-height:1.1;font-weight:bold;color:${BRAND.black};">The Daily Grind</h1>
              <p style="margin:8px 0 0 0;font-family:${FONT_BODY};font-size:15px;font-weight:bold;color:${BRAND.red};">Coffee Business News with Purpose</p>
              <p style="margin:14px 0 0 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.slate};">${escapeHtml(today)}</p>
            </td>
          </tr>

          <!-- Header image -->
          <tr>
            <td style="padding:0;">
              <img src="${HEADER_IMAGE}" width="600" alt="Freshly roasted coffee beans" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 8px 40px;background-color:${BRAND.skyBlue};">
              <p style="margin:0 0 24px 0;font-family:${FONT_BODY};font-size:16px;line-height:1.65;color:${BRAND.gradBlue};">
                Good morning! Here are this week's top stories from across the coffee world — with an eye on the farmers who grow it, the communities that depend on it, and the businesses working to source it fairly and sustainably. Pour a cup and read on.
              </p>
            </td>
          </tr>

          <!-- Stories -->
${storiesHtml}

          <!-- Faith & Business -->
          <tr>
            <td style="padding:36px 40px;background-color:${BRAND.gradBlue};">
              <p style="margin:0 0 12px 0;font-family:${FONT_BODY};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${BRAND.white};">
                <span style="border-bottom:2px solid ${BRAND.red};padding-bottom:4px;">Faith &amp; Business</span>
              </p>
              <p style="margin:20px 0 6px 0;font-family:${FONT_HEADLINE};font-size:19px;line-height:1.45;font-weight:bold;color:${BRAND.white};">
                &ldquo;He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness, and to walk humbly with your God?&rdquo;
              </p>
              <p style="margin:0 0 20px 0;font-family:${FONT_BODY};font-size:13px;color:${BRAND.skyBlue};">Micah 6:8 (ESV)</p>
              <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${BRAND.white};">
                Every cup of coffee begins with someone's labor — often a smallholder farmer earning far less than the drink is worth. Doing justice in business means paying fairly and trading honestly. Loving kindness means seeing those growers as neighbors, not just suppliers. And walking humbly means stewarding the land and climate God entrusted to us, so the farms that feed us today can flourish for generations. As future business leaders, we have the chance to let even our coffee choices reflect His heart for justice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:${BRAND.black};font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:#BBBBBB;">
              <strong style="color:${BRAND.white};">The Daily Grind</strong> &middot; Biola University &middot; La Mirada, California<br>
              Stories gathered automatically from Google News. Header photo via Unsplash.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'THE DAILY GRIND — Coffee Business News with Purpose',
    `Biola University · ${today}`,
    '',
    ...stories.flatMap((s) => [
      `${s.headline}`,
      `${s.source} · ${formatDate(s.date, { month: 'short', day: 'numeric', year: 'numeric' })}`,
      s.summary,
      `Read more: ${s.link}`,
      '',
    ]),
    'FAITH & BUSINESS',
    '"He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness, and to walk humbly with your God?" — Micah 6:8 (ESV)',
  ].join('\n');

  return { subject, html, text };
}

module.exports = { buildNewsletter };
