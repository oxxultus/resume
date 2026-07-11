const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const POST_MANIFEST_URL = 'https://oxxultus.github.io/resume/blog/posts.json';

function corsHeaders(request, env) {
    const origin = request.headers.get('origin');
    const allowed = origin === env.ALLOWED_ORIGIN || origin?.startsWith('http://127.0.0.1:') || origin?.startsWith('http://localhost:');
    return {
        'access-control-allow-origin': allowed ? origin : env.ALLOWED_ORIGIN,
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
        'vary': 'Origin'
    };
}

function json(request, env, data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...JSON_HEADERS, ...corsHeaders(request, env), 'cache-control': 'no-store' }
    });
}

function normalizePath(value) {
    if (typeof value !== 'string') return null;
    const path = value.trim().split(/[?#]/)[0];
    if (!path.startsWith('/resume/blog/') || path.length > 240) return null;
    return path.endsWith('/') ? path : `${path}/`;
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function visitorIdentity(request, env) {
    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const agent = request.headers.get('user-agent') || 'unknown';
    return {
        day,
        visitorHash: await sha256(`${env.VISITOR_SALT}:${day}:${ip}:${agent}`),
        stableVisitorHash: await sha256(`${env.VISITOR_SALT}:like:${ip}:${agent}`)
    };
}

async function recordVisit(request, env) {
    const { day, visitorHash } = await visitorIdentity(request, env);
    await env.DB.batch([
        env.DB.prepare(`
            INSERT INTO daily_site_visits (day, visits) VALUES (?1, 1)
            ON CONFLICT(day) DO UPDATE SET visits = daily_site_visits.visits + 1
        `).bind(day),
        env.DB.prepare('INSERT OR IGNORE INTO daily_visitors (day, visitor_hash) VALUES (?1, ?2)').bind(day, visitorHash)
    ]);
    return json(request, env, { ok: true });
}

async function recordView(request, env) {
    const payload = await request.json().catch(() => null);
    const path = normalizePath(payload?.path);
    const title = typeof payload?.title === 'string' ? payload.title.trim().slice(0, 160) : '';
    if (!path || !title) return json(request, env, { error: 'Invalid post data' }, 400);

    const now = new Date();
    const { day, visitorHash, stableVisitorHash } = await visitorIdentity(request, env);

    await env.DB.batch([
        env.DB.prepare(`
            INSERT INTO posts (path, title, views, last_viewed_at)
            VALUES (?1, ?2, 1, ?3)
            ON CONFLICT(path) DO UPDATE SET
                title = excluded.title,
                views = posts.views + 1,
                last_viewed_at = excluded.last_viewed_at
        `).bind(path, title, now.toISOString()),
        env.DB.prepare(`
            INSERT INTO daily_page_views (day, path, views)
            VALUES (?1, ?2, 1)
            ON CONFLICT(day, path) DO UPDATE SET views = daily_page_views.views + 1
        `).bind(day, path),
        env.DB.prepare(`INSERT OR IGNORE INTO daily_visitors (day, visitor_hash) VALUES (?1, ?2)`).bind(day, visitorHash)
        ,env.DB.prepare(`
            INSERT INTO daily_site_visits (day, visits) VALUES (?1, 1)
            ON CONFLICT(day) DO UPDATE SET visits = daily_site_visits.visits + 1
        `).bind(day)
    ]);

    const [post, liked] = await env.DB.batch([
        env.DB.prepare('SELECT views, likes FROM posts WHERE path = ?1').bind(path),
        env.DB.prepare('SELECT 1 AS liked FROM post_likes WHERE path = ?1 AND visitor_hash = ?2').bind(path, stableVisitorHash)
    ]);
    return json(request, env, {
        path,
        views: post.results[0]?.views || 1,
        likes: post.results[0]?.likes || 0,
        liked: Boolean(liked.results[0]?.liked)
    });
}

async function toggleLike(request, env) {
    const payload = await request.json().catch(() => null);
    const path = normalizePath(payload?.path);
    if (!path) return json(request, env, { error: 'Invalid post path' }, 400);

    const post = await env.DB.prepare('SELECT likes FROM posts WHERE path = ?1').bind(path).first();
    if (!post) return json(request, env, { error: 'Post not found' }, 404);
    const { stableVisitorHash } = await visitorIdentity(request, env);
    const existing = await env.DB.prepare('SELECT 1 AS liked FROM post_likes WHERE path = ?1 AND visitor_hash = ?2')
        .bind(path, stableVisitorHash).first();

    if (existing) {
        await env.DB.batch([
            env.DB.prepare('DELETE FROM post_likes WHERE path = ?1 AND visitor_hash = ?2').bind(path, stableVisitorHash),
            env.DB.prepare('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE path = ?1').bind(path)
        ]);
    } else {
        await env.DB.batch([
            env.DB.prepare('INSERT OR IGNORE INTO post_likes (path, visitor_hash, created_at) VALUES (?1, ?2, ?3)')
                .bind(path, stableVisitorHash, new Date().toISOString()),
            env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE path = ?1').bind(path)
        ]);
    }

    const updated = await env.DB.prepare('SELECT likes FROM posts WHERE path = ?1').bind(path).first();
    return json(request, env, { path, likes: updated?.likes || 0, liked: !existing });
}

async function getStats(request, env) {
    const today = new Date().toISOString().slice(0, 10);
    const [summary, todayVisitors, posts, recent] = await env.DB.batch([
        env.DB.prepare(`
            SELECT
                COALESCE((SELECT SUM(views) FROM posts), 0) AS total_views,
                COALESCE((SELECT COUNT(*) FROM daily_visitors), 0) AS visitor_days,
                COALESCE((SELECT SUM(visits) FROM daily_site_visits), 0) AS total_visits
        `),
        env.DB.prepare('SELECT COUNT(*) AS count FROM daily_visitors WHERE day = ?1').bind(today),
        env.DB.prepare('SELECT path, title, views, likes FROM posts ORDER BY views DESC, last_viewed_at DESC'),
        env.DB.prepare(`
            SELECT day, SUM(views) AS views,
                   (SELECT COUNT(*) FROM daily_visitors visitors WHERE visitors.day = daily_page_views.day) AS visitors
            FROM daily_page_views
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        `)
    ]);

    return json(request, env, {
        totalViews: summary.results[0]?.total_views || 0,
        totalVisits: summary.results[0]?.total_visits || 0,
        visitorDays: summary.results[0]?.visitor_days || 0,
        todayVisitors: todayVisitors.results[0]?.count || 0,
        posts: posts.results,
        recent: recent.results
    });
}

async function syncCurrentPosts(env) {
    const response = await fetch(POST_MANIFEST_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Post manifest returned ${response.status}`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.posts)) throw new Error('Invalid post manifest');

    const currentPaths = new Set(manifest.posts.map(post => normalizePath(post.path)).filter(Boolean));
    const stored = await env.DB.prepare('SELECT path FROM posts').all();
    const stalePaths = stored.results.map(post => post.path).filter(path => !currentPaths.has(path));
    if (!stalePaths.length) return { deleted: 0 };

    const statements = stalePaths.flatMap(path => [
        env.DB.prepare('DELETE FROM posts WHERE path = ?1').bind(path),
        env.DB.prepare('DELETE FROM daily_page_views WHERE path = ?1').bind(path),
        env.DB.prepare('DELETE FROM post_likes WHERE path = ?1').bind(path)
    ]);
    await env.DB.batch(statements);
    return { deleted: stalePaths.length };
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
        const url = new URL(request.url);

        try {
            if (url.pathname === '/api/view' && request.method === 'POST') return await recordView(request, env);
            if (url.pathname === '/api/like' && request.method === 'POST') return await toggleLike(request, env);
            if (url.pathname === '/api/visit' && request.method === 'POST') return await recordVisit(request, env);
            if (url.pathname === '/api/stats' && request.method === 'GET') return await getStats(request, env);
            if (url.pathname === '/health') return json(request, env, { ok: true });
            return json(request, env, { error: 'Not found' }, 404);
        } catch (error) {
            console.error(error);
            return json(request, env, { error: 'Analytics unavailable' }, 500);
        }
    },
    async scheduled(controller, env, ctx) {
        ctx.waitUntil(syncCurrentPosts(env));
    }
};
