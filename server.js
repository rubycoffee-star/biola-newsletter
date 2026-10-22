require('dotenv').config();
const path = require('path');
const express = require('express');
const { getTopStories } = require('./src/news');
const { buildNewsletter } = require('./src/newsletter');
const { sendNewsletter } = require('./src/mailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Fetch news, build the email, and send it — all in one click.
app.post('/api/send', async (req, res) => {
  try {
    const stories = await getTopStories();
    if (stories.length === 0) {
      return res.status(502).json({ ok: false, error: 'No coffee news stories were found right now. Please try again later.' });
    }
    const newsletter = buildNewsletter(stories);
    const sentTo = await sendNewsletter(newsletter);
    console.log(`Sent "${newsletter.subject}" to ${sentTo} with ${stories.length} stories.`);
    res.json({ ok: true, sentTo, storyCount: stories.length, subject: newsletter.subject });
  } catch (err) {
    console.error('Newsletter failed:', err);
    res.status(500).json({ ok: false, error: err.message || 'Something went wrong.' });
  }
});

// Preview the newsletter in the browser without sending an email.
app.get('/preview', async (req, res) => {
  try {
    const stories = await getTopStories();
    res.send(buildNewsletter(stories).html);
  } catch (err) {
    res.status(500).send(`Could not build preview: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`The Daily Grind is running at http://localhost:${PORT}`);
});
