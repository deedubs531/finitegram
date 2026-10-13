// ==UserScript==
// @name         FiniteGram
// @namespace    finity
// @version      5.3.0
// @description  Replaces the instagram.com home feed with stories from lists you choose. No ads, reels or endless scrolling.
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @downloadURL  https://deedubs531.github.io/finitegram/finitegram.user.js
// @updateURL    https://deedubs531.github.io/finitegram/finitegram.user.js
// @homepageURL  https://deedubs531.github.io/finitegram/
// ==/UserScript==

// How it works: on the home page, this script shows its own simple page with stories from the list
// you pick, using the same request Instagram's story bar makes with your logged-in session. A
// sorting screen lists the accounts you follow so you can put them into lists, and a short setup
// walks new people through it. It never reads Instagram's page layout, so redesigns don't break it.
// Everything stays in this browser.

(function () {
  'use strict';

  const VERSION = '5.3';
  const APP_NAME = 'FiniteGram'; // the name offered when adding to the home screen
  const SETTINGS_KEY = 'finity-close-friends';
  const STORIES_KEY = 'finity-cf-stories';
  const FOLLOWING_KEY = 'finity-cf-following';
  const OLD_KEYS = ['finity-cf-cache', 'finity-cf-cache-v2', 'finity-cf-ids']; // from 3.x, which also tried to load posts
  const VIEW_KEY = 'finity-cf-view'; // where you were on the sorting screen, kept while you look at a profile
  const ME_KEY = 'finity-cf-me'; // which account is logged in, checked once per visit
  const QUEUE_KEY = 'finity-cf-queue'; // the rest of the list's new stories, while you're watching
  const NAV_KEY = 'finity-cf-nav'; // the previous page, the last conversation, and the reel opened from it
  const PULL_TRIGGER = 64; // how far to pull down (after damping) before letting go refreshes
  const PAGE_PAUSE_MS = 1500; // between pages of the following list
  const DEFAULT_LISTS = [
    { id: 'close', name: 'Close friends' },
    { id: 'art', name: 'Art / collage' },
    { id: 'ny', name: 'NY' },
  ];
  const ICON = 'data:image/png;base64,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'; // home-screen icon: a story ring that stops

  // ---------- pure helpers (tested) ----------

  const USERNAME = /^[a-z0-9._]{1,30}$/;

  /** Lowercases a username and strips an @ or a profile link around it. */
  function normalizeName(raw) {
    let s = String(raw).trim().toLowerCase();
    const fromUrl = s.match(/instagram\.com\/(?:_u\/)?([a-z0-9._]+)/);
    if (fromUrl) s = fromUrl[1];
    return s.replace(/^@/, '').replace(/\/+$/, '');
  }

  /** Usernames from typed text or an Instagram data-download file (JSON or HTML). */
  function namesFromText(text) {
    const s = String(text);
    let parts;
    if (/[{<]/.test(s)) {
      parts = [];
      for (const m of s.matchAll(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]{1,30})/g)) parts.push(m[1]);
      for (const m of s.matchAll(/"(?:value|title|username)"\s*:\s*"([A-Za-z0-9._]{1,30})"/g)) parts.push(m[1]);
    } else {
      parts = s.split(/[\s,]+/);
    }
    return [...new Set(parts.map(normalizeName).filter((n) => USERNAME.test(n)))];
  }

  /**
   * Saved settings, cleaned up: which lists exist (in order), who is in each, which one is showing,
   * whether setup is done, and the main account (whose story bar this follows). Older saves keep
   * working: they had the three standard lists and no setup, and belonged to @deedubs531.
   */
  function readSettings(saved) {
    const s = saved && typeof saved === 'object' ? saved : {};
    let info = (Array.isArray(s.listInfo) ? s.listInfo : [])
      .filter((l) => l && /^[a-z0-9-]{1,40}$/.test(l.id) && typeof l.name === 'string' && l.name.trim())
      .map((l) => ({ id: l.id, name: l.name.trim().slice(0, 40) }))
      .filter((l, i, all) => all.findIndex((x) => x.id === l.id) === i);
    if (!info.length) info = DEFAULT_LISTS.map((l) => ({ ...l }));
    const saveLists = (typeof s.lists === 'object' && s.lists) || {};
    const lists = {};
    for (const l of info) lists[l.id] = Array.isArray(saveLists[l.id]) ? namesFromText(saveLists[l.id].join('\n')) : [];
    if (Array.isArray(s.friends)) lists[info[0].id] = namesFromText([...lists[info[0].id], ...s.friends].join('\n'));
    const hasPeople = Object.values(lists).some((m) => m.length);
    const fromBefore5 = !('onboarded' in s) && hasPeople;
    return {
      info,
      lists,
      active: info.some((l) => l.id === s.active) ? s.active : info[0].id,
      onboarded: s.onboarded === true || fromBefore5,
      mainAccount: normalizeName(s.mainAccount || '') || (fromBefore5 ? 'deedubs531' : ''),
      dmReels: s.dmReels !== false,
    };
  }

  /** A short label for a list's tag button: its first word, at most 8 letters. */
  function shortLabel(name) {
    const first = String(name).trim().split(/[\s/]+/)[0] || name;
    return first.length > 8 ? first.slice(0, 7) + '…' : first;
  }

  /** An id for a new list that doesn't clash with existing ones. */
  function newListId(name, info) {
    const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'list';
    let id = base;
    for (let i = 2; info.some((l) => l.id === id); i++) id = `${base}-${i}`;
    return id;
  }

  /**
   * What to do with an address: show our 'home', 'story' (allowed), a single 'reel' (decided by
   * reelDecision), 'block' it, send 'to-search', or leave it 'ok'.
   */
  function routeFor(pathname, people) {
    const path = pathname.toLowerCase();
    if (path === '/' || path === '') return 'home';
    if (/^\/reels?\/?$/.test(path) || /^\/[a-z0-9._]+\/reels\/?$/.test(path)) return 'block'; // the Reels feed and profile Reels tabs
    if (/^\/reels?\/[^/]+/.test(path)) return 'reel';
    if (/^\/explore\/search(\/|$)/.test(path)) return 'ok';
    if (/^\/explore(\/|$)/.test(path)) return 'to-search';
    const story = path.match(/^\/stories\/([^/]+)/);
    if (story) return story[1] === 'highlights' || people.has(story[1]) ? 'story' : 'block';
    return 'ok';
  }

  /**
   * A single reel: 'allow' it when it was opened from Messages (or is the one already allowed),
   * 'back' to the conversation when Instagram moves on to the next reel, otherwise 'block'.
   */
  /** The reel code in a link or address (/reel/CODE/, /reels/CODE/), or ''. */
  function reelCode(href) {
    const m = String(href || '').match(/\/reels?\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  }

  /** Instagram's number for a post or reel, from the letters in its address. */
  function mediaId(code) {
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = 0n;
    for (const c of String(code).slice(0, 11)) {
      const i = abc.indexOf(c);
      if (i < 0) return '';
      id = id * 64n + BigInt(i);
    }
    return code ? id.toString() : '';
  }

  /** The video (and who posted it) from Instagram's answer about one post. */
  function reelVideo(json) {
    const item = json?.items?.[0];
    if (!item) return null;
    const media = item.video_versions ? item : (item.carousel_media || []).find((m) => m?.video_versions);
    const url = media?.video_versions?.[0]?.url;
    if (!url) return null;
    return {
      url,
      poster: media.image_versions2?.candidates?.[0]?.url || '',
      user: item.user?.username || '',
      caption: item.caption?.text || '',
    };
  }

  function reelDecision(code, prevPath, allowedCode, enabled) {
    if (!enabled) return 'block';
    if (code && code === allowedCode) return 'allow';
    if (String(prevPath || '').startsWith('/direct/')) return 'allow';
    return allowedCode ? 'back' : 'block';
  }

  /**
   * Who in the list has a story up, from Instagram's story-bar answer, split into new and seen
   * (in Instagram's order). Instagram marks each with when its newest part went up and when you
   * last watched it; `watched` adds stories opened from this page.
   */
  function storyGroups(json, people, watched = {}) {
    const fresh = [];
    const seen = [];
    for (const t of json?.tray || []) {
      const n = normalizeName(t?.user?.username || '');
      if (!people.has(n) || fresh.includes(n) || seen.includes(n)) continue;
      const latest = Number(t.latest_reel_media) || 0;
      const lastSeen = Math.max(Number(t.seen) || 0, watched[n] || 0);
      (latest && lastSeen >= latest ? seen : fresh).push(n);
    }
    return { fresh, seen };
  }

  /** [username, full name, profile picture] for each account on a page of Instagram's following list. */
  function usersFromPage(json) {
    return (json?.users || [])
      .map((u) => [normalizeName(u?.username || ''), String(u?.full_name || ''), String(u?.profile_pic_url || '')])
      .filter(([n]) => USERNAME.test(n));
  }

  /**
   * Rows for the sorting screen: everyone you follow (from any account loaded here) plus anyone
   * already in a list, matching the search and filter: '' everyone, 'none' not in a list, a list id,
   * or 'acct:<id>' for the accounts one of your accounts follows.
   */
  function sortRows(followingByAccount, lists, query = '', filter = '') {
    const names = new Map(); // username → { full, pic }, filled from whichever account knows the most
    for (const acct of Object.values(followingByAccount || {})) {
      for (const [n, full = '', pic = ''] of acct.users || []) {
        const had = names.get(n);
        names.set(n, { full: had?.full || full, pic: had?.pic || pic });
      }
    }
    const fromAcct = filter.startsWith('acct:') ? new Set((followingByAccount?.[filter.slice(5)]?.users || []).map(([n]) => n)) : null;
    for (const members of Object.values(lists)) for (const n of members) if (!names.has(n)) names.set(n, { full: '', pic: '' });
    const q = normalizeName(query);
    const inAny = (n) => Object.values(lists).some((m) => m.includes(n));
    return [...names]
      .filter(([n, { full }]) => !q || n.includes(q) || full.toLowerCase().includes(q))
      .filter(([n]) => (fromAcct ? fromAcct.has(n) : filter === 'none' ? !inAny(n) : filter ? lists[filter]?.includes(n) : true))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, { full, pic }]) => ({ name, full, pic }));
  }

  /** How many accounts each loaded account follows, and how many people that makes altogether. */
  function followingSummary(followingByAccount) {
    const accounts = Object.entries(followingByAccount || {}).map(([id, a]) => ({
      id, name: a.name || '', loaded: (a.users || []).length, expected: Number(a.expected) || 0,
    }));
    const all = new Set(Object.values(followingByAccount || {}).flatMap((a) => (a.users || []).map(([n]) => n)));
    const total = accounts.reduce((sum, a) => sum + a.loaded, 0);
    return { accounts, unique: all.size, overlap: total - all.size };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // ---------- talking to Instagram ----------

  function cookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  /** GET one of Instagram's own JSON addresses with your session; gives up after 15 seconds. */
  async function igGet(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(path, {
        credentials: 'include',
        signal: controller.signal,
        headers: { 'X-IG-App-ID': '936619743392459', 'X-ASBD-ID': '129477', 'X-CSRFToken': cookie('csrftoken'), 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw Object.assign(new Error(`Instagram answered ${res.status}`), { status: res.status });
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error("Instagram didn't answer in 15 seconds");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- storage ----------

  function load(key, store = localStorage) {
    try {
      return JSON.parse(store.getItem(key) || 'null');
    } catch {
      return null;
    }
  }

  function save(key, value, store = localStorage) {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: things will just load again next time.
    }
  }

  // ---------- the page ----------

  const ICONS = {
    stories: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    messages: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="M10 13l4-4"/>',
    sort: '<path d="M4 6h16M4 12h10M4 18h6"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const CSS = `
    a[href="/reels/"], a[href$="/reels/"] { display: none !important; } /* the Reels tab and profile Reels tabs */
    html.cf-on, html.cf-on body { overflow: hidden !important; }
    /* In Instagram's story viewer, stop iPhone's long-press menu and text selection from stealing
       the press-and-hold that pauses a story, and taps that skip ahead. */
    html.cf-story, html.cf-story * { -webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important; }
    html.cf-story img, html.cf-story video { pointer-events: none !important; }
    /* Our own player for a reel sent in Messages: one video, nothing under it to scroll to. */
    html.cf-reel, html.cf-reel body { overflow: hidden !important; overscroll-behavior: none !important; }
    html.cf-reel video:not(#cf-video) { visibility: hidden !important; }
    #cf-player { position: fixed; inset: 0; z-index: 2147483647; background: #000; color: #fff; display: flex; flex-direction: column;
      font: 15px/1.4 -apple-system, system-ui, sans-serif; touch-action: none; overscroll-behavior: none;
      padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px); }
    #cf-player .top { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
    #cf-player button { font: inherit; color: #fff; background: rgba(255,255,255,.14); border: 0; border-radius: 18px; padding: 8px 14px; }
    #cf-player .who { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cf-player .stage { flex: 1; min-height: 0; display: grid; place-items: center; }
    #cf-player video { max-width: 100%; max-height: 100%; touch-action: manipulation; }
    #cf-player .msg { padding: 24px; text-align: center; color: #bbb; }
    #cf-player .cap { padding: 8px 14px 14px; color: #ccc; font-size: 14px; max-height: 4.4em; overflow: hidden; }
    html.cf-story input, html.cf-story textarea, html.cf-story [contenteditable] { -webkit-user-select: text !important; user-select: text !important; }
    #cf { --bg: #fafafa; --card: #fff; --fg: #111; --muted: #6b6b6b; --line: #e3e3e3; --accent: #1f7a4d; --on-accent: #fff;
      position: fixed; inset: 0; z-index: 2147483646; overflow-y: auto; -webkit-overflow-scrolling: touch;
      background: var(--bg); color: var(--fg); font: 15px/1.45 -apple-system, system-ui, sans-serif;
      padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 84px); box-sizing: border-box; }
    @media (prefers-color-scheme: dark) {
      #cf { --bg: #000; --card: #121212; --fg: #eee; --muted: #8e8e8e; --line: #2a2a2a; --accent: #2e9e66; }
    }
    #cf * { box-sizing: border-box; }
    #cf { overscroll-behavior: contain; }
    /* Only the content moves when pulled; the tab bar and Done bar stay put. */
    #cf #cf-main > .wrap { transform: translateY(calc(var(--pull, 0) * 1px)); }
    #cf.cf-settle #cf-main > .wrap { transition: transform .45s cubic-bezier(.2, 1.4, .4, 1); } /* a little overshoot: the bounce */
    #cf #cf-ptr { position: absolute; left: 0; right: 0; top: calc(env(safe-area-inset-top, 0px) + 10px); display: flex; justify-content: center;
      align-items: center; gap: 8px; color: var(--muted); font-size: 13px; opacity: min(1, calc(var(--pull, 0) / 48)); pointer-events: none; }
    #cf #cf-ptr .spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--line); border-top-color: var(--muted);
      transform: rotate(calc(var(--pull, 0) * 4deg)); }
    #cf.cf-ready #cf-ptr { color: var(--fg); }
    #cf.cf-settle.cf-ready #cf-ptr .spin { animation: cf-spin .8s linear infinite; }
    @keyframes cf-spin { to { transform: rotate(360deg); } }
    #cf .wrap { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
    #cf .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    #cf .lists { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
    #cf .lists button { flex: none; }
    #cf button, #cf .chip { font: inherit; font-size: 14px; padding: 7px 13px; border-radius: 17px; border: 1px solid var(--line);
      background: var(--card); color: var(--fg); text-decoration: none; cursor: pointer; }
    #cf button:disabled { opacity: .5; }
    #cf [aria-pressed="true"], #cf .primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
    #cf h1 { font-size: 24px; margin: 8px 0 0; text-wrap: balance; }
    #cf h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 6px 0 0; }
    #cf p { margin: 0; }
    #cf .lead { font-size: 16px; }
    #cf .status { color: var(--muted); font-size: 14px; }
    #cf .error { color: #c0392b; }
    #cf ol.steps { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 6px; }
    #cf ul.points { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
    #cf .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    #cf code { font: 13px ui-monospace, monospace; background: var(--line); padding: 2px 5px; border-radius: 5px; overflow-wrap: anywhere; }
    #cf input[type=search], #cf input[type=text], #cf select { font: inherit; width: 100%; padding: 9px 11px; border-radius: 10px;
      border: 1px solid var(--line); background: var(--card); color: var(--fg); }
    #cf .person { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line);
      content-visibility: auto; contain-intrinsic-size: auto 60px; }
    #cf .person .who { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; }
    #cf .person .who span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cf .person .who small { display: block; color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
    #cf .person img, #cf .person .nopic { flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--line); object-fit: cover; }
    #cf .person .tags { flex: none; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; max-width: 58%; }
    #cf .person button { font-size: 13px; padding: 5px 9px; }
    #cf textarea { width: 100%; height: 30vh; font: 14px/1.4 ui-monospace, monospace; padding: 10px; border-radius: 10px;
      border: 1px solid var(--line); background: var(--card); color: var(--fg); }
    #cf details summary { color: var(--muted); font-size: 14px; cursor: pointer; }
    #cf .stories { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 16px 8px; }
    #cf .story { display: flex; flex-direction: column; align-items: center; gap: 6px; color: inherit; text-decoration: none; min-width: 0; }
    #cf .story .ring { border-radius: 50%; padding: 2.5px; background: conic-gradient(from 200deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75); }
    #cf .story.seen .ring { background: var(--line); }
    #cf .story.seen .face, #cf .story.seen .handle { opacity: .55; }
    #cf .story .face { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; border: 2.5px solid var(--bg);
      object-fit: cover; color: rgba(255,255,255,.9); font-weight: 600; font-size: 18px; background: var(--line); }
    #cf .story .handle { font-size: 13px; text-align: center; overflow-wrap: anywhere; line-height: 1.25; }
    #cf .tabbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1; display: flex; justify-content: space-around;
      padding: 6px 8px calc(env(safe-area-inset-bottom, 0px) + 6px); background: var(--bg); border-top: 1px solid var(--line); }
    #cf .tab { all: unset; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px;
      color: var(--muted); cursor: pointer; text-align: center; }
    #cf .tab.here, #cf .tab.unread { color: var(--fg); }
    #cf .tab.unread { font-weight: 700; }
    #cf .tab.unread svg { stroke-width: 2.4; }
    #cf .donebar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1; display: flex; justify-content: center;
      padding: 10px 16px calc(env(safe-area-inset-bottom, 0px) + 8px); background: linear-gradient(transparent, var(--bg) 30%); }
    #cf .donebar button { min-width: 60%; padding: 11px 20px; font-size: 16px; }
    #cf .end { text-align: center; color: var(--muted); padding: 12px 0; font-size: 13px; }
    #cf .end a { color: inherit; }
  `;

  function start() {
    let settings = readSettings(load(SETTINGS_KEY));
    const stories = Object.assign({ tray: null, at: 0, watched: {}, unread: 0 }, load(STORIES_KEY));
    const following = Object.assign({}, load(FOLLOWING_KEY)); // account id → { at, name, expected, users: [[username, name, pic]] }
    try {
      for (const k of OLD_KEYS) localStorage.removeItem(k);
    } catch {
      // Nothing to tidy.
    }
    let view = settings.onboarded ? 'stories' : 'setup'; // 'stories', 'sort' or 'setup'
    let step = 0; // which setup page
    let loading = false;
    let problem = '';
    let fetching = ''; // progress text while loading the following list
    let notice = ''; // a short confirmation
    let searchTimer = 0;
    let query = '';
    let filter = '';
    let needsLogin = false;
    let me = load(ME_KEY, sessionStorage); // { id, name } of the logged-in account, once known
    let root = null;

    const people = () => new Set(settings.lists[settings.active]);
    const listName = (id = settings.active) => settings.info.find((l) => l.id === id)?.name || '';
    const acctLabel = (id) => (following[id]?.name ? '@' + following[id].name : `account ${Object.keys(following).indexOf(id) + 1}`);
    const saveSettings = () => save(SETTINGS_KEY, {
      ...load(SETTINGS_KEY), listInfo: settings.info, lists: settings.lists, active: settings.active,
      onboarded: settings.onboarded, mainAccount: settings.mainAccount, dmReels: settings.dmReels,
    });

    // --- routing ---
    // Checked a few times a second rather than by listening to Instagram's navigation, because
    // userscripts may run walled off from the page and never hear about it. This also puts our
    // page, styles and home-screen icon back if Instagram's own code removes them.
    let lastPath = null;
    let player = null; // our player for a reel sent in Messages, while it's open

    // Instagram's reel viewer always lines up suggested reels after the one you were sent, so a
    // sent reel never opens there: tapping it in a chat opens our own player with just that video.
    document.addEventListener('click', (e) => {
      if (!location.pathname.startsWith('/direct/') || !settings.dmReels || e.target.closest?.('#cf-player')) return;
      const link = e.target.closest?.('a[href]');
      const code = link && reelCode(link.getAttribute('href'));
      if (!code) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openPlayer(code, false);
    }, true);
    // Instagram's own video players stay silent and still while ours is open.
    document.addEventListener('play', (e) => {
      if (player && e.target !== player.querySelector('video')) { e.target.muted = true; e.target.pause(); }
    }, true);

    function tick() {
      addHead();
      const path = location.pathname;
      const route = routeFor(path, people());
      document.documentElement?.classList.toggle('cf-story', route === 'story');
      document.documentElement?.classList.toggle('cf-reel', !!player);
      if (player) {
        if (!player.isConnected) (document.body || document.documentElement)?.appendChild(player); // also before the page has drawn
        for (const v of document.querySelectorAll('video:not(#cf-video)')) if (!v.paused) { v.muted = true; v.pause(); }
      }
      if (path !== lastPath) {
        lastPath = path;
        // Remembered across page loads: where you just were, and your last conversation.
        const nav = load(NAV_KEY, sessionStorage) || {};
        const prev = nav.path;
        nav.path = path;
        if (path.startsWith('/direct/')) nav.direct = path;
        if (route === 'reel') {
          // Opened a reel's address from a chat without our tap catching it: cover Instagram's
          // viewer with our player, which plays only that reel.
          const code = reelCode(path);
          const verdict = reelDecision(code, prev, nav.reel, settings.dmReels);
          nav.reel = verdict === 'allow' ? code : '';
          save(NAV_KEY, nav, sessionStorage);
          if (verdict === 'back') return location.replace(nav.direct || '/direct/inbox/'); // no moving on to more reels
          if (verdict === 'block') return location.replace('/');
          if (player?.dataset.code !== code) openPlayer(code, true);
          return;
        }
        nav.reel = '';
        save(NAV_KEY, nav, sessionStorage);
        if (player) closePlayer(false);
        if (route === 'block') return location.replace(path.startsWith('/stories/') ? nextStory(path) : '/');
        if (route === 'to-search') return location.replace('/explore/search/');
        if (route === 'story') takeFromQueue(path);
      }
      if (route === 'home' && !needsLogin && !loginShowing()) show();
      else hide();
    }

    // One video, a way back, and nothing else.
    function openPlayer(code, onReelPage) {
      if (player) player.remove();
      player = document.createElement('div');
      player.id = 'cf-player';
      player.dataset.code = code;
      player.dataset.page = onReelPage ? '1' : '';
      player.innerHTML = '<div class="top"><button type="button" class="back">‹ Back to chat</button><span class="who"></span></div>'
        + '<div class="stage"><div class="msg">Loading the reel…</div></div><div class="cap"></div>';
      player.querySelector('.back').addEventListener('click', () => closePlayer(true));
      (document.body || document.documentElement)?.appendChild(player); // or on the next check, if the page isn't there yet
      document.documentElement?.classList.add('cf-reel');
      for (const v of document.querySelectorAll('video')) { v.muted = true; v.pause(); }
      const mine = player;
      const id = mediaId(code);
      (id ? igGet(`/api/v1/media/${id}/info/`) : Promise.reject(new Error('no code')))
        .then((json) => {
          if (player !== mine) return;
          const reel = reelVideo(json);
          if (!reel) throw new Error('no video');
          const v = Object.assign(document.createElement('video'), { id: 'cf-video', src: reel.url, poster: reel.poster, controls: true, loop: true, playsInline: true });
          v.setAttribute('playsinline', '');
          mine.querySelector('.stage').replaceChildren(v);
          mine.querySelector('.who').textContent = reel.user ? '@' + reel.user : '';
          mine.querySelector('.cap').textContent = reel.caption;
          v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); // iPhone may only allow silent autoplay; the sound button is in the controls
        })
        .catch(() => {
          if (player !== mine) return;
          mine.querySelector('.stage').innerHTML = '<div class="msg">Instagram wouldn\'t load this reel here. It may be private or removed.</div>';
        });
    }

    function closePlayer(goBack) {
      const onReelPage = player?.dataset.page;
      player?.remove();
      player = null;
      document.documentElement?.classList.remove('cf-reel');
      if (goBack && onReelPage) {
        const nav = load(NAV_KEY, sessionStorage) || {};
        location.replace(nav.direct || '/direct/inbox/');
      }
    }

    // Watching stories: when Instagram moves on to someone who isn't on the list, go to the next
    // person on the list who has a new story, instead of back to the start.
    function nextStory(blockedPath) {
      const blocked = normalizeName(blockedPath.split('/')[2] || '');
      const queue = (load(QUEUE_KEY, sessionStorage) || []).filter((n) => n !== blocked && people().has(n));
      const next = queue.shift();
      save(QUEUE_KEY, queue, sessionStorage);
      return next ? `/stories/${encodeURIComponent(next)}/` : '/';
    }

    function takeFromQueue(path) {
      const n = normalizeName(path.split('/')[2] || '');
      const queue = load(QUEUE_KEY, sessionStorage);
      if (Array.isArray(queue) && queue.includes(n)) save(QUEUE_KEY, queue.filter((x) => x !== n), sessionStorage);
      if (stories.tray) {
        const t = stories.tray.find((x) => normalizeName(x?.user?.username || '') === n);
        if (t) {
          // Marked here, so it's already under Seen when you come back; no reload needed.
          stories.watched = { ...stories.watched, [n]: Number(t.latest_reel_media) || Math.floor(Date.now() / 1000) };
          save(STORIES_KEY, stories);
        }
      }
    }

    // Instagram's login form is on screen (logged out): stay out of its way.
    function loginShowing() {
      return [...document.querySelectorAll('input[type="password"]')].some((i) => i.offsetParent !== null && !i.closest('#cf'));
    }

    function show() {
      if (!document.body || (root && document.body.contains(root))) return;
      const first = !root;
      if (first) {
        root = document.createElement('div');
        root.id = 'cf';
        root.innerHTML = '<div id="cf-ptr" aria-hidden="true"><span class="spin"></span><span class="label"></span></div><div id="cf-main"></div>';
        shown = '';
        root.addEventListener('click', onClick);
        root.addEventListener('input', onInput);
        root.addEventListener('change', onChange);
        addPullToRefresh(root);
      }
      document.body.appendChild(root);
      document.documentElement.classList.add('cf-on');
      const back = first && restoreSpot();
      render();
      if (back) root.scrollTop = back.scroll || 0;
      // Stories only reload when you pull down (or the very first time), so nothing moves under your finger.
      if (first) {
        if (stories.tray) refreshUnread();
        else refreshStories();
        checkAccount();
      }
    }

    // Coming back from a profile opened on the sorting screen: same search, filter and scroll.
    function restoreSpot() {
      const spot = load(VIEW_KEY, sessionStorage);
      try {
        sessionStorage.removeItem(VIEW_KEY);
      } catch {
        // Nothing to clear.
      }
      if (spot?.view !== 'sort') return null;
      view = 'sort';
      query = String(spot.query || '');
      filter = String(spot.filter || '');
      return spot;
    }

    // Pull down on the stories page and let go to refresh, with a bounce back like Instagram's.
    function addPullToRefresh(el) {
      let pull = null; // { y0, d } while a pull is under way
      const set = (d, settle, label = '') => {
        el.classList.toggle('cf-settle', settle);
        el.style.setProperty('--pull', String(d)); // a plain number of pixels
        el.querySelector('#cf-ptr .label').textContent = label;
        el.classList.toggle('cf-ready', label === 'Release to refresh' || label === 'Refreshing…');
      };
      el.addEventListener('touchstart', (e) => {
        pull = view === 'stories' && !loading && el.scrollTop <= 0 && e.touches.length === 1 ? { y0: e.touches[0].clientY, d: 0 } : null;
      }, { passive: true });
      el.addEventListener('touchmove', (e) => {
        if (!pull) return;
        const dy = e.touches[0].clientY - pull.y0;
        if (dy <= 0 || el.scrollTop > 0) return set((pull.d = 0), false);
        e.preventDefault(); // we're doing the stretching, not Safari
        pull.d = Math.min(140, dy * 0.5);
        set(pull.d, false, pull.d >= PULL_TRIGGER ? 'Release to refresh' : 'Pull to refresh');
      }, { passive: false });
      const release = () => {
        if (!pull) return;
        const go = pull.d >= PULL_TRIGGER;
        pull = null;
        if (!go) return set(0, true);
        set(56, true, 'Refreshing…');
        refreshStories().then(() => set(0, true));
      };
      el.addEventListener('touchend', release);
      el.addEventListener('touchcancel', release);
    }

    function hide() {
      if (!root) return;
      root.remove();
      root = null;
      document.documentElement?.classList.remove('cf-on');
    }

    // --- loading ---
    // Stories: one request for who has a story up, plus the unread-messages count.
    async function refreshStories() {
      if (loading) return;
      loading = true;
      problem = '';
      render();
      try {
        const json = await igGet('/api/v1/feed/reels_tray/');
        // Keep only what's needed: who, their picture, when their newest story went up, when you last watched.
        stories.tray = (json.tray || []).map((t) => ({
          user: { username: t?.user?.username, pic: t?.user?.profile_pic_url },
          latest_reel_media: t?.latest_reel_media,
          seen: t?.seen,
        }));
        stories.at = Date.now();
      } catch (err) {
        if (err.status === 401) needsLogin = true; // logged out: show Instagram (and its login) instead
        problem = `Couldn't load stories (${err.message}). Pull down to try again.`;
      }
      await refreshUnread();
      save(STORIES_KEY, stories);
      loading = false;
      render();
    }

    // Whether Messages has something unread: only the tab's look changes, nothing else moves.
    async function refreshUnread() {
      try {
        stories.unread = Number((await igGet('/api/v1/direct_v2/get_badge_count/?no_raven=1'))?.badge_count) || 0;
        save(STORIES_KEY, stories);
        root?.querySelector('.tab[href="/direct/inbox/"]')?.classList.toggle('unread', stories.unread > 0);
      } catch {
        // Unknown: Messages just looks as usual.
      }
    }

    // Which account is logged in: from the cookie and loaded follows when possible, otherwise one
    // small request, remembered for the rest of the visit.
    async function checkAccount() {
      const id = cookie('ds_user_id');
      if (me && (!id || me.id === id)) return adoptMainAccount();
      if (id && following[id]?.name) me = { id, name: following[id].name };
      else {
        try {
          const user = (await igGet('/api/v1/accounts/current_user/?edit=true'))?.user;
          if (user?.username) me = { id: String(user.pk || id), name: normalizeName(user.username) };
        } catch {
          return; // can't tell; say nothing
        }
      }
      save(ME_KEY, me, sessionStorage);
      adoptMainAccount();
    }

    // The first account seen becomes the main one (the account whose stories this shows).
    function adoptMainAccount() {
      if (me?.name && !settings.mainAccount) {
        settings.mainAccount = me.name;
        saveSettings();
      }
      render();
    }

    // The accounts the logged-in account follows: a page of 200 at a time, with a pause between,
    // then a check against how many Instagram says it follows.
    async function loadFollowing() {
      if (fetching) return;
      problem = '';
      fetching = 'Loading the accounts you follow…';
      notice = '';
      renderPart();
      try {
        let id = cookie('ds_user_id');
        let name = '';
        try {
          const user = (await igGet('/api/v1/accounts/current_user/?edit=true'))?.user;
          id = id || String(user?.pk || '');
          name = normalizeName(user?.username || '');
        } catch {
          // Use the account number alone.
        }
        if (!id) throw new Error("couldn't tell which account is logged in");
        const users = [];
        let maxId = '';
        for (let page = 0; page < 60; page++) {
          const json = await igGet(`/api/v1/friendships/${id}/following/?count=200` + (maxId ? '&max_id=' + encodeURIComponent(maxId) : ''));
          users.push(...usersFromPage(json));
          fetching = `Loading the accounts you follow… ${users.length} so far.`;
          renderPart();
          maxId = json?.next_max_id || '';
          if (!maxId) break;
          await new Promise((r) => setTimeout(r, PAGE_PAUSE_MS));
        }
        let expected = 0;
        try {
          expected = Number((await igGet(`/api/v1/users/${id}/info/`))?.user?.following_count) || 0;
        } catch {
          // Can't double-check the count; that's fine.
        }
        const unique = [...new Map(users.map((u) => [u[0], u])).values()];
        following[id] = { at: Date.now(), users: unique, name: name || following[id]?.name || '', expected };
        save(FOLLOWING_KEY, following);
        if (name) {
          me = { id, name };
          save(ME_KEY, me, sessionStorage);
          if (!settings.mainAccount) settings.mainAccount = name;
        }
        if (view === 'sort') filter = 'acct:' + id; // show just this account's follows, ready to tag or add all at once
        notice = `Loaded ${unique.length} accounts followed by ${acctLabel(id)}.` +
          (expected && unique.length < expected ? ` Instagram says it follows ${expected}, so ${expected - unique.length} may be missing; try again later.` : '');
      } catch (err) {
        problem = `Couldn't load the accounts you follow (${err.message}). Try again in a while.`;
      }
      fetching = '';
      render();
    }

    // --- drawing ---
    let shown = '';
    function render() {
      if (!root) return;
      const body = view === 'sort' ? sortView() : view === 'setup' ? setupView() : storiesView();
      const bottom = view === 'sort'
        ? '<div class="donebar"><button type="button" class="primary" data-act="done">Done</button></div>'
        : view === 'setup' && !settings.onboarded ? '' : tabbar(); // first-time setup stays on its steps
      const html = `<div class="wrap">${body}</div>${bottom}`;
      if (html === shown) return; // nothing changed: leave the page alone so taps aren't lost
      shown = html;
      const top = root.scrollTop;
      root.querySelector('#cf-main').innerHTML = html;
      root.scrollTop = top;
    }

    // Update just the parts that change, so typing in search isn't interrupted.
    function renderPart() {
      if (!root) return;
      shown = ''; // the page is being changed piece by piece; the next full draw must happen
      if (view !== 'sort') return render();
      root.querySelector('#cf-lists').innerHTML = listButtons();
      root.querySelector('#cf-status').innerHTML = statusLines();
      root.querySelector('#cf-rows').innerHTML = rowsHtml();
    }

    function listButtons() {
      return settings.info.map((l) =>
        `<button type="button" data-list="${l.id}" aria-pressed="${view === 'stories' && l.id === settings.active}">${escapeHtml(l.name)} (${settings.lists[l.id].length})</button>`).join('');
    }

    // Stories · Search · Messages · Sort accounts, like Instagram's own tab bar. Messages is bold when
    // something is unread and grey when not.
    function tabbar() {
      const tab = (cls, href, act, name, label) => href
        ? `<a class="tab ${cls}" href="${href}">${icon(name)}${label}</a>`
        : `<button type="button" class="tab ${cls}" data-act="${act}">${icon(name)}${label}</button>`;
      return `<nav class="tabbar" aria-label="Sections">
        ${tab(view === 'stories' ? 'here' : '', '', 'home', 'stories', 'Stories')}
        ${tab('', '/explore/search/', '', 'search', 'Search')}
        ${tab(stories.unread ? 'unread' : '', '/direct/inbox/', '', 'messages', 'Messages')}
        ${tab('', '', 'sort', 'sort', 'Sort accounts')}
      </nav>`;
    }

    // A ringed profile picture with the full handle under it, like Instagram's story bar.
    function storyCell(n, seen) {
      const pic = (stories.tray || []).find((t) => normalizeName(t?.user?.username || '') === n)?.user?.pic;
      const hue = [...n].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
      const face = pic
        ? `<img class="face" src="${escapeHtml(pic)}" alt="">`
        : `<span class="face" style="background:hsl(${hue} 45% 42%)">${escapeHtml(n.replace(/[^a-z]/g, '').slice(0, 2).toUpperCase())}</span>`;
      return `<a class="story${seen ? ' seen' : ''}" data-user="${escapeHtml(n)}" href="/stories/${encodeURIComponent(n)}/"><span class="ring">${face}</span><span class="handle">@${escapeHtml(n)}</span></a>`;
    }

    function storiesView() {
      const names = settings.lists[settings.active];
      const { fresh, seen } = stories.tray ? storyGroups({ tray: stories.tray }, people(), stories.watched) : { fresh: [], seen: [] };
      let body;
      if (!names.length) body = `<p class="status">No one in ${escapeHtml(listName())} yet. Tap Sort accounts to add people.</p>`;
      else if (!stories.tray) body = `<p class="status" role="status">${problem ? '' : 'Loading…'}</p>`;
      else {
        body = `${fresh.length ? `<div class="stories">${fresh.map((n) => storyCell(n, false)).join('')}</div>` : `<p class="status">You're caught up.</p>`}
          ${seen.length ? `<h2>Seen</h2><div class="stories">${seen.map((n) => storyCell(n, true)).join('')}</div>` : ''}`;
      }
      const wrongAccount = me?.name && settings.mainAccount && me.name !== settings.mainAccount;
      return `<div class="lists" id="cf-lists">${listButtons()}</div>
        ${problem ? `<p class="status error" role="alert">${escapeHtml(problem)}</p>` : ''}
        ${wrongAccount ? `<p class="status error" role="alert">You're logged in as @${escapeHtml(me.name)}, so these are the stories that account follows. Switch to @${escapeHtml(settings.mainAccount)} on Instagram to see yours.</p>` : ''}
        <h2>Stories · ${escapeHtml(listName())}</h2>
        ${body}
        <p class="end">${stories.at ? `Updated ${ago(stories.at)} · pull down to refresh` : 'Pull down to refresh'}<br>
          Finity ${VERSION} · <a href="#" data-act="setup">Setup & help</a></p>`;
    }

    function ago(t) {
      const min = Math.round((Date.now() - t) / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return `${min} min ago`;
      const h = Math.round(min / 60);
      return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
    }

    function statusLines() {
      const sum = followingSummary(following);
      const per = sum.accounts.map((a) => `${escapeHtml(acctLabel(a.id))} follows ${a.loaded}${a.expected && a.expected > a.loaded ? ` of ${a.expected}` : ''}`).join(' · ');
      return `${fetching ? `<p class="status" role="status">${escapeHtml(fetching)}</p>` : ''}
        ${problem ? `<p class="status error" role="alert">${escapeHtml(problem)}</p>` : ''}
        ${notice ? `<p class="status" role="status">${escapeHtml(notice)}</p>` : ''}
        ${!fetching && sum.accounts.length ? `<p class="status">${per}. ${sum.unique} different accounts in all${sum.overlap ? ` (${sum.overlap} followed by more than one)` : ''}.</p>` : ''}
        ${!fetching && sum.accounts.some((a) => a.loaded && !(following[a.id].users || []).some((u) => u[2])) ? '<p class="status">Tap Load accounts I follow again to add profile pictures.</p>' : ''}`;
    }

    function sortView() {
      const options = settings.info.map((l) => `<option value="${l.id}"${filter === l.id ? ' selected' : ''}>In ${escapeHtml(l.name)}</option>`).join('');
      return `<div class="lists" id="cf-lists">${listButtons()}</div>
        <h1>Sort accounts</h1>
        <p class="status">Tap a list next to someone to add them; tags save as you go. Tap a photo or name to see who it is.</p>
        <div class="row"><button type="button" data-act="following"${fetching ? ' disabled' : ''}>Load accounts I follow</button></div>
        <p class="status">This loads the account you're logged into now. Have another account? Switch to it on Instagram, come back, and tap Load again: both are combined here.</p>
        <div id="cf-status">${statusLines()}</div>
        <input type="search" id="cf-search" placeholder="Search names or usernames, or type one to add" value="${escapeHtml(query)}"
          autocapitalize="none" autocomplete="off" spellcheck="false" aria-label="Search">
        <select id="cf-filter" aria-label="Show">
          <option value=""${filter === '' ? ' selected' : ''}>Everyone</option>
          <option value="none"${filter === 'none' ? ' selected' : ''}>Not in any list yet</option>${options}
          ${Object.keys(following).map((id) => `<option value="acct:${escapeHtml(id)}"${filter === 'acct:' + id ? ' selected' : ''}>Followed by ${escapeHtml(acctLabel(id))}</option>`).join('')}
        </select>
        <div id="cf-rows">${rowsHtml()}</div>
        <details${notice.startsWith('List') ? ' open' : ''}><summary>Your lists: add, rename or remove</summary>
          <div class="card">
            ${settings.info.map((l) => `<div class="row"><input type="text" data-rename="${l.id}" value="${escapeHtml(l.name)}" aria-label="Name of ${escapeHtml(l.name)}" style="flex:1;width:auto">
              <button type="button" data-remove="${l.id}"${settings.info.length < 2 ? ' disabled' : ''}>Remove</button></div>`).join('')}
            <div class="row"><input type="text" id="cf-newlist" placeholder="New list name, e.g. Family" style="flex:1;width:auto">
              <button type="button" class="primary" data-act="addlist">Add list</button></div>
          </div>
        </details>
        <details><summary>Paste or load a list of usernames</summary>
          <p class="status">One per line, or load a file (a list of names, or the close_friends / following file from Instagram's "Download your information").</p>
          <textarea id="cf-paste" spellcheck="false" autocapitalize="none" autocomplete="off" aria-label="Usernames"></textarea>
          <div class="row">${settings.info.map((l) => `<button type="button" data-paste="${l.id}">Add to ${escapeHtml(l.name)}</button>`).join('')}
            <button type="button" data-act="file">Load a file</button></div>
        </details>
        <input type="file" id="cf-file" accept=".txt,.json,.html,.htm,text/plain,application/json,text/html" hidden>`;
    }

    function rowsHtml() {
      const rows = sortRows(following, settings.lists, query, filter);
      const typed = normalizeName(query);
      const addable = USERNAME.test(typed) && !rows.length; // nobody matches: offer to add what was typed
      const bulk = rows.length > 1
        ? `<div class="row">${settings.info.map((l) => `<button type="button" data-bulk="${l.id}">Add all ${rows.length} shown to ${escapeHtml(l.name)}</button>`).join('')}</div>`
        : '';
      // Tapping the photo or name opens their profile; Back brings you to the same spot here.
      const person = ({ name, full, pic }) => `<div class="person">
        <a class="who" data-profile href="/${encodeURIComponent(name)}/">${pic ? `<img src="${escapeHtml(pic)}" alt="" loading="lazy">` : '<span class="nopic"></span>'}
          <span>@${escapeHtml(name)}${full ? `<small>${escapeHtml(full)}</small>` : ''}</span></a>
        <span class="tags">${settings.info.map((l) => `<button type="button" data-tag="${l.id}" data-user="${escapeHtml(name)}" aria-pressed="${settings.lists[l.id].includes(name)}" aria-label="${escapeHtml(l.name)}">${escapeHtml(shortLabel(l.name))}</button>`).join('')}</span></div>`;
      return `${bulk}
        ${rows.length ? `<p class="status">${rows.length} ${rows.length === 1 ? 'account' : 'accounts'} shown.</p>` : ''}
        ${addable ? person({ name: typed, full: '', pic: '' }) : ''}
        ${rows.map(person).join('')}
        ${!rows.length && !addable ? `<p class="status">${Object.keys(following).length ? 'No one matches.' : 'Tap Load accounts I follow to see everyone here.'}</p>` : ''}`;
    }

    // --- setup, for anyone starting from scratch (and "Setup & help" later) ---
    function setupView() {
      const steps = [
        `<h1>Instagram, with an ending.</h1>
        <p class="lead">${APP_NAME} keeps the part of Instagram that's about people you care about, and drops the rest.</p>
        <ul class="points">
          <li>No ads, no reels, no suggested posts and no endless scrolling.</li>
          <li>Just the stories of people you choose, sorted into your own lists: close friends, a hobby, a city.</li>
          <li>Each list ends with "You're caught up." When you want more, open someone's profile or a message on purpose.</li>
        </ul>
        <p>Setup takes about five minutes. Everything stays on this phone.</p>`,

        `<h2>Step 1 of 3</h2><h1>Bring in who you follow</h1>
        <p>Load the accounts you follow so you can sort them. It takes a minute and goes gently so Instagram doesn't mind.</p>
        <div class="row"><button type="button" class="primary" data-act="following"${fetching ? ' disabled' : ''}>Load accounts I follow</button></div>
        <div id="cf-status">${statusLines()}</div>
        <div class="card"><b>More than one account?</b>
          <ol class="steps"><li>On Instagram, tap your profile picture and switch to the other account.</li>
          <li>Come back to this page (Setup & help at the bottom) and tap Load again.</li>
          <li>Everyone ends up in one place to sort. Switch back to your main account afterwards.</li></ol></div>`,

        `<h2>Step 2 of 3</h2><h1>Make your lists</h1>
        <p>You start with ${settings.info.map((l) => `<b>${escapeHtml(l.name)}</b>`).join(', ')}. Rename them, remove them or add your own on the Sort accounts page.</p>
        <div class="row"><button type="button" class="primary" data-act="sort">Sort accounts</button></div>
        <div class="card"><b>Copy your Instagram Close Friends list (optional)</b>
          <ol class="steps">
            <li>In the Instagram app: Profile → ☰ → <b>Accounts Center</b> → <b>Your information and permissions</b> → <b>Download your information</b>.</li>
            <li>Choose <b>Some of your information</b> → <b>Followers and following</b>, then <b>Download to device</b>, format <b>JSON</b>.</li>
            <li>Instagram emails you when it's ready (minutes to a day). Download it and open the zip in Files.</li>
            <li>Tap below and pick <code>connections/followers_and_following/close_friends.json</code>.</li>
          </ol>
          <div class="row"><button type="button" data-act="closefile">Load close_friends file</button></div></div>`,

        `<h2>Step 3 of 3</h2><h1>Put it on your home screen</h1>
        <ol class="steps">
          <li>In Safari, on this page, tap <b>Share</b> (the square with an arrow).</li>
          <li>Tap <b>Add to Home Screen</b>. The name (${APP_NAME}) and icon are filled in; change the name if you like.</li>
          <li>Tap <b>Add</b>. The new icon always opens in Safari, even if another browser is your default.</li>
        </ol>
        <p class="status">Then move the Instagram app off your home screen (or set a Screen Time limit on it), so this is where you go.</p>
        <details><summary>Prefer a Shortcut?</summary>
          <p class="status">In Shortcuts, make a shortcut with <b>Open URLs</b> set to the address below (it opens in Safari, not your default browser, on iOS 17 and later), then Add to Home Screen with any photo as the icon.</p>
          <p><code>x-safari-https://www.instagram.com</code> <button type="button" data-act="copyurl">Copy</button></p>
        </details>`,
      ];
      step = Math.max(0, Math.min(step, steps.length - 1));
      const last = step === steps.length - 1;
      return `${steps[step]}
        <div class="row" style="justify-content:space-between;margin-top:8px">
          ${step ? '<button type="button" data-act="back">Back</button>' : '<span></span>'}
          <button type="button" class="primary" data-act="${last ? 'finish' : 'next'}">${last ? 'Start' : step ? 'Next' : 'Get started'}</button>
        </div>
        ${settings.onboarded ? `<div class="card"><b>Options</b>
          <label class="row" style="flex-wrap:nowrap"><input type="checkbox" id="cf-dmreels"${settings.dmReels ? ' checked' : ''}>
            <span>Play reels people send me in Messages (just the one they sent, in a plain player)</span></label></div>
          <p class="end"><a href="#" data-act="home">Back to stories</a></p>` : ''}`;
    }

    // --- actions ---
    function toggle(listId, name) {
      const members = settings.lists[listId];
      const i = members.indexOf(name);
      if (i >= 0) members.splice(i, 1);
      else members.push(name);
      saveSettings();
    }

    function addAll(listId, names) {
      settings.lists[listId] = [...new Set([...settings.lists[listId], ...names])];
      saveSettings();
    }

    function addList(name) {
      const clean = String(name).trim().slice(0, 40);
      if (!clean) return;
      const id = newListId(clean, settings.info);
      settings.info.push({ id, name: clean });
      settings.lists[id] = [];
      saveSettings();
      notice = `List "${clean}" added.`;
    }

    function removeList(id) {
      if (settings.info.length < 2) return;
      const gone = listName(id);
      settings.info = settings.info.filter((l) => l.id !== id);
      delete settings.lists[id];
      if (settings.active === id) settings.active = settings.info[0].id;
      if (filter === id) filter = '';
      saveSettings();
      notice = `List "${gone}" removed.`;
    }

    let fileTarget = 'paste'; // where a loaded file's usernames go: the paste box, or straight into Close friends
    function onInput(e) {
      if (e.target.id === 'cf-search') {
        query = e.target.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(renderPart, 150);
      }
    }

    async function onChange(e) {
      if (e.target.id === 'cf-filter') {
        filter = e.target.value;
        renderPart();
      } else if (e.target.id === 'cf-dmreels') {
        settings.dmReels = e.target.checked;
        saveSettings();
      } else if (e.target.dataset.rename) {
        const l = settings.info.find((x) => x.id === e.target.dataset.rename);
        const name = e.target.value.trim().slice(0, 40);
        if (l && name) {
          l.name = name;
          saveSettings();
          notice = `List renamed to "${name}".`;
          render();
        }
      } else if (e.target.id === 'cf-file' && e.target.files[0]) {
        const names = namesFromText(await e.target.files[0].text());
        e.target.value = '';
        if (fileTarget === 'close') {
          const target = settings.info.find((l) => l.id === 'close') || settings.info[0];
          addAll(target.id, names);
          notice = `Added ${names.length} people to ${target.name}.`;
          return render();
        }
        const area = root.querySelector('#cf-paste');
        if (area) area.value = [...new Set([...namesFromText(area.value), ...names])].join('\n');
      }
    }

    function onClick(e) {
      if (e.target.closest('a[data-profile]')) {
        save(VIEW_KEY, { view, query, filter, scroll: root.scrollTop }, sessionStorage);
        return;
      }
      const story = e.target.closest('a.story');
      if (story) {
        // Line up everyone else on the list with a new story, to play straight through.
        const { fresh } = storyGroups({ tray: stories.tray || [] }, people(), stories.watched);
        save(QUEUE_KEY, fresh.filter((n) => n !== story.dataset.user), sessionStorage);
        return;
      }
      const b = e.target.closest('button, a[data-act]');
      if (!b) return;
      if (b.dataset.act && b.tagName === 'A') e.preventDefault();
      if (b.dataset.list) {
        settings.active = b.dataset.list;
        saveSettings();
        view = 'stories';
        return render();
      }
      if (b.dataset.tag) {
        toggle(b.dataset.tag, b.dataset.user);
        b.setAttribute('aria-pressed', String(settings.lists[b.dataset.tag].includes(b.dataset.user)));
        shown = '';
        root.querySelector('#cf-lists').innerHTML = listButtons();
        return;
      }
      if (b.dataset.bulk) {
        addAll(b.dataset.bulk, sortRows(following, settings.lists, query, filter).map((r) => r.name));
        return renderPart();
      }
      if (b.dataset.paste) {
        const area = root.querySelector('#cf-paste');
        const names = namesFromText(area.value);
        addAll(b.dataset.paste, names);
        area.value = '';
        notice = `Added ${names.length} to ${listName(b.dataset.paste)}.`;
        return renderPart();
      }
      if (b.dataset.remove) {
        removeList(b.dataset.remove);
        return render();
      }
      switch (b.dataset.act) {
        case 'home': view = 'stories'; root.scrollTop = 0; render(); break;
        case 'sort': view = 'sort'; filter = ''; problem = ''; notice = ''; root.scrollTop = 0; render(); break;
        case 'done': view = settings.onboarded ? 'stories' : 'setup'; query = ''; problem = ''; notice = ''; root.scrollTop = 0; render(); break;
        case 'setup': view = 'setup'; step = 0; root.scrollTop = 0; render(); break;
        case 'next': step++; root.scrollTop = 0; render(); break;
        case 'back': step--; root.scrollTop = 0; render(); break;
        case 'finish':
          settings.onboarded = true;
          saveSettings();
          view = 'stories';
          root.scrollTop = 0;
          render();
          refreshStories();
          break;
        case 'following': loadFollowing(); break;
        case 'addlist': {
          addList(root.querySelector('#cf-newlist').value);
          render();
          break;
        }
        case 'file': fileTarget = 'paste'; root.querySelector('#cf-file').click(); break;
        case 'closefile': {
          fileTarget = 'close';
          let input = root.querySelector('#cf-file');
          if (!input) {
            input = Object.assign(document.createElement('input'), { type: 'file', id: 'cf-file', hidden: true, accept: '.json,.html,.htm,.txt' });
            root.appendChild(input);
          }
          input.click();
          break;
        }
        case 'copyurl':
          navigator.clipboard?.writeText('x-safari-https://www.instagram.com').then(() => { b.textContent = 'Copied'; }, () => {});
          break;
      }
    }

    // --- start up ---
    // Our styles, plus the name and icon iPhone uses for "Add to Home Screen".
    function addHead() {
      const head = document.head || document.documentElement;
      if (!head) return;
      if (!document.getElementById('cf-style')) {
        const style = document.createElement('style');
        style.id = 'cf-style';
        style.textContent = CSS;
        head.appendChild(style);
      }
      if (!document.head || document.getElementById('cf-icon')) return;
      for (const old of document.querySelectorAll('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], meta[name="apple-mobile-web-app-title"]')) old.remove();
      const link = Object.assign(document.createElement('link'), { id: 'cf-icon', rel: 'apple-touch-icon', href: ICON });
      link.setAttribute('sizes', '180x180');
      const title = Object.assign(document.createElement('meta'), { name: 'apple-mobile-web-app-title', content: APP_NAME });
      document.head.append(link, title);
    }
    tick(); // leaves reels before the page draws
    setInterval(tick, 400);
  }

  const api = { reelDecision, reelCode, mediaId, reelVideo, normalizeName, namesFromText, readSettings, shortLabel, newListId, routeFor, storyGroups, usersFromPage, sortRows, followingSummary };
  if (typeof window !== 'undefined' && window.__FINITY_CF_TEST__) window.__FINITY_CF_TEST__ = api;
  else start();
})();
