// nserver.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDatasets, comparativeScores } from './dataset_pipeline.js';

const app = express();
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.resolve(__dirname, '..');
app.use(express.static(staticDir));
app.use(express.json());

// --- Dataset processing (cached in memory, refreshed on demand) ---
let processed = null;
let flatSessions = [];
let liveCursor = 0;
function ensureProcessed() {
    if (!processed) {
        const root = path.resolve(__dirname, '..', 'datasets');
        processed = processDatasets(root);
        indexSessions();
    }
    return processed;
}
app.get('/api/datasets/refresh', (req, res) => {
    const root = path.resolve(__dirname, '..', 'datasets');
    processed = processDatasets(root);
    indexSessions();
    res.json({ ok: true, stats: processed.stats });
});

app.get('/api/research/comparative', (req, res) => {
    try {
        const ds = ensureProcessed();
        const mode = String(req.query.mode || '').toLowerCase();
        if (mode === 'live') {
            const mini = nextLiveDataset();
            const scores = comparativeScores(mini);
            return res.json({ stats: mini.stats, scores, clusters: mini.clusterSummary || null });
        }
        const scores = comparativeScores(ds);
        res.json({ stats: ds.stats, scores, clusters: ds.clusterSummary });
    } catch (e) {
        res.status(500).json({ error: e.message || String(e) });
    }
});

// Preview a sample of aggregated signals for live-like visualization
app.get('/api/datasets/preview', (req, res) => {
    try {
        const ds = ensureProcessed();
        const subjects = ds.subjects || [];
        let sample = null;
        for (const s of subjects) {
            if (s.sessions && s.sessions.length) {
                const sess = s.sessions[0];
                sample = {
                    subject: s.subject,
                    session: sess.session,
                    hr: (sess.hr?.series || []).slice(0, 300),
                    eda: (sess.eda?.series || []).slice(0, 300),
                };
                break;
            }
        }
        res.json({
            stats: ds.stats,
            sample,
            timestamp: Date.now(),
        });
    } catch (e) {
        res.status(500).json({ error: e.message || String(e) });
    }
});

function indexSessions() {
    flatSessions = [];
    liveCursor = 0;
    const subj = processed?.subjects || [];
    subj.forEach(s => {
        (s.sessions || []).forEach(sess => {
            flatSessions.push({ subject: s.subject, session: sess.session, hr: sess.hr?.series || [] });
        });
    });
}

function lag1(series) {
    const xs = (series || []).map(p => p.v).filter(v => typeof v === 'number' && !isNaN(v));
    if (xs.length < 3) return 0;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    let num = 0, den = 0;
    for (let i = 1; i < xs.length; i++) num += (xs[i] - mean) * (xs[i - 1] - mean);
    for (let i = 0; i < xs.length; i++) den += (xs[i] - mean) * (xs[i] - mean);
    return den ? num / den : 0;
}

function movingAvg(xs, k = 10) {
    const out = [];
    for (let i = 0; i < xs.length; i++) {
        const start = Math.max(0, i - k + 1);
        const w = xs.slice(start, i + 1);
        out.push(w.reduce((a, b) => a + b, 0) / w.length);
    }
    return out;
}

function expSmooth(xs, a = 0.2) {
    const out = [];
    let prev = xs[0] || 0;
    for (let i = 0; i < xs.length; i++) {
        const y = a * xs[i] + (1 - a) * prev;
        out.push(y);
        prev = y;
    }
    return out;
}

function ar1(xs) {
    if (xs.length < 3) return xs.slice();
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    let num = 0, den = 0;
    for (let i = 1; i < xs.length; i++) {
        num += (xs[i] - mean) * (xs[i - 1] - mean);
        den += (xs[i - 1] - mean) * (xs[i - 1] - mean);
    }
    const phi = den ? num / den : 0;
    const out = [xs[0]];
    for (let i = 1; i < xs.length; i++) out.push(mean + phi * (xs[i - 1] - mean));
    return out;
}

function mae(a, b) {
    const n = Math.min(a.length, b.length);
    if (!n) return 0;
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
    return s / n;
}

function nextLiveDataset() {
    if (!flatSessions.length) indexSessions();
    const idx = liveCursor % flatSessions.length;
    liveCursor = (liveCursor + 1) % flatSessions.length;
    const sess = flatSessions[idx] || { hr: [] };
    const xs = (sess.hr || []).map(p => p.v).filter(v => typeof v === 'number' && !isNaN(v));
    const r1 = lag1(sess.hr || []);
    const ma = movingAvg(xs, 10);
    const es = expSmooth(xs, 0.2);
    const ar = ar1(xs);
    const maErr = mae(xs, ma);
    const esErr = mae(xs, es);
    const arErr = mae(xs, ar);
    return {
        subjects: [],
        points: [[0,0,0]],
        clusterSummary: { kmeans: null, silhouette: 0 },
        stats: {
            subjects: 1,
            sessions: 1,
            hr_autocorr_lag1: r1,
            smoothing_mae: { moving_average: maErr, exp_smooth: esErr, ar1: arErr },
            cluster_silhouette: 0,
        },
    };
}

// --- Scraper Logic Function ---
async function scrapeNews(query) {
    if (!query) return [];

    // URL targets Google News for the specified query, focused on India
    const url = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    
    // Attempt to fetch the page content
    const html = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
    }).then(r => {
        if (!r.ok) {
            throw new Error(`Google News Fetch failed with status: ${r.status}`);
        }
        return r.text();
    });

    const $ = cheerio.load(html);

    const articles = [];
    $('article').each((i, el) => {
        const title = $(el).find('h3').text();
        let link = $(el).find('a').attr('href') || '';
        // Using a combination of known snippet selectors
        const snippet = $(el).find('.xBbh9, .sn547B').text() || ''; 

        if (title && link && articles.length < 10) {
            // Correct the link to be a full URL
            if (link.startsWith('./')) link = link.replace('./', '');
            const fullLink = link.startsWith('http') ? link : `https://news.google.com/${link}`;
            
            articles.push({
                title,
                url: fullLink,
                snippet
            });
        }
    });

    return articles;
}

// --- Main Route Handler with Fallback Strategy ---
app.get('/scrape', async (req, res) => {
    try {
        const { q: specificQuery } = req.query;
        if (!specificQuery) return res.status(400).json({ error: 'Missing query q' });

        const requiredCount = 10;
        let articles = [];
        
        // 1. Try Specific Query (from frontend: e.g., "Start End traffic")
        articles = await scrapeNews(specificQuery);

        // 2. Fallback 1: Broad Traffic/Accident keywords
        if (articles.length < requiredCount) {
            console.log(`[SCRAPE] Fallback 1: Only found ${articles.length} results. Trying broader query.`);
            const fallbackQuery1 = 'traffic accident congestion roadworks "lane closure" near ' + specificQuery.split(' ')[0];
            const fallbackArticles = await scrapeNews(fallbackQuery1);
            articles.push(...fallbackArticles);
        }

        // 3. Fallback 2: General Traffic News
        if (articles.length < requiredCount) {
            console.log(`[SCRAPE] Fallback 2: Still only ${articles.length} results. Trying general traffic news.`);
            const fallbackQuery2 = 'Latest India traffic updates road conditions';
            const fallbackArticles = await scrapeNews(fallbackQuery2);
            articles.push(...fallbackArticles);
        }
        
        // Deduplicate and trim to required count
        const uniqueArticles = Array.from(new Set(articles.map(a => a.title)))
            .map(title => articles.find(a => a.title === title));
            
        const finalArticles = uniqueArticles.slice(0, requiredCount);

        // 4. Guaranteed Output: Send a specific, link-less message if no articles are found
        if (finalArticles.length === 0) {
             const defaultArticle = {
                // The requested custom message
                title: "NO NEWS OUT THERE FOR YOUR ROUTE", 
                // Set URL to empty string to remove all links in the front-end
                url: "", 
                // Minimal snippet for a clean, simple look
                snippet: "Everything seems clear! Enjoy the easy ride."
            };
            finalArticles.push(defaultArticle);
        }

        res.json({ articles: finalArticles });
        
    } catch (err) {
        console.error('Server error during scraping:', err);
        // Ensure the error message is clear when sending 500
        res.status(500).json({ error: `Server failed to execute scraping logic. Details: ${err.message}` });
    }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
