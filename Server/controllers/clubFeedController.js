import { db } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const parseCursor = (cursorStr) => {
  if (!cursorStr) return { cursorDate: null, cursorId: null };
  const lastUnderscore = cursorStr.lastIndexOf('_');
  if (lastUnderscore === -1) return { cursorDate: null, cursorId: null };

  const cursorDate = cursorStr.slice(0, lastUnderscore);
  const cursorId = parseInt(cursorStr.slice(lastUnderscore + 1), 10);
  return { cursorDate, cursorId };
};
 
const buildCursor = (items) => {
  if (!items.length) return null;
  const last = items[items.length - 1];
  const dateStr = new Date(last.created_at).toISOString();
  return `${dateStr}_${last.id}`;
};

const normalizeFeedRows = (rows) =>
  rows.map((r) => ({
    activity_type: r.activity_type,
    id:            r.id,
    content:       r.content,
    created_at:    r.created_at,
    rating:        r.rating ? Number(r.rating) : null,
    like_count:    Number(r.like_count || 0),
    comment_count: Number(r.comment_count || 0),
    is_liked:      r.is_liked,
    book: {
      id:     r.book_id,
      title:  r.book_title,
      author: r.book_author,
    },
    actor: {
      id:           r.actor_id,
      name:         r.actor_name,
      avatar_color: r.actor_avatar_color,
      image_url:    r.actor_image_url
    },
    parent: r.parent_id ? {
      id:      r.parent_id,
      type:    r.parent_type,
      snippet: r.parent_snippet,
    } : null,
  }));

  const assertMember = async (clubId, userId) => {
  const check = await db.query(
    `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );
  return check.rows.length > 0;
};

const FEED_BASE_QUERY = (isBookFeedOnly = false) => `
SELECT
  activity_type, id, content, created_at, rating, like_count, comment_count, is_liked,
  book_id, book_title, book_author, actor_id, actor_name, actor_avatar_color,actor_image_url,
  parent_id, parent_type, parent_snippet
FROM (

  -- ── REVIEWS BRANCH ──
  SELECT
    'review' AS activity_type, r.id, r.review AS content, r.created_at, r.rating,
    COUNT(DISTINCT rl.id) AS like_count,
    COUNT(DISTINCT rc.id) AS comment_count,
    EXISTS (SELECT 1 FROM review_likes WHERE review_id = r.id AND user_id = $2) AS is_liked,
    b.id AS book_id, b.title AS book_title, b.author AS book_author,
    NULL::int AS parent_id, NULL::text AS parent_type, NULL::text AS parent_snippet,
    u.id AS actor_id, u.name AS actor_name, u.avatar_color AS actor_avatar_color,u.image_url AS actor_image_url
  FROM reviews r
  JOIN users u         ON u.id = r.user_id
  JOIN books b         ON b.id = r.book_id
  JOIN club_members cm ON cm.club_id = $1 AND cm.user_id = r.user_id
  ${isBookFeedOnly ? 'JOIN club_reading_list crl ON crl.club_id = $1 AND crl.book_id = b.id' : ''}
  LEFT JOIN review_likes rl    ON rl.review_id = r.id
  LEFT JOIN review_comments rc ON rc.review_id = r.id AND rc.parent_comment_id IS NULL
  WHERE ($3::timestamptz IS NULL OR (r.created_at, r.id) < ($3::timestamptz, $4::int))
  GROUP BY r.id, u.id, b.id

  UNION ALL

  -- ── TOP-LEVEL COMMENTS BRANCH ──
  SELECT
    'comment' AS activity_type, rc.id, rc.comment_text AS content, rc.created_at, NULL::numeric AS rating,
    COUNT(DISTINCT cl.id) AS like_count, 0 AS comment_count,
    EXISTS (SELECT 1 FROM comment_likes WHERE comment_id = rc.id AND user_id = $2) AS is_liked,
    b.id AS book_id, b.title AS book_title, b.author AS book_author,
    r.id AS parent_id, 'review'::text AS parent_type, LEFT(r.review, 120) AS parent_snippet,
    u.id AS actor_id, u.name AS actor_name, u.avatar_color AS actor_avatar_color,u.image_url AS actor_image_url
  FROM review_comments rc
  JOIN users u         ON u.id = rc.user_id
  JOIN reviews r       ON r.id = rc.review_id
  JOIN books b         ON b.id = r.book_id
  JOIN club_members cm ON cm.club_id = $1 AND cm.user_id = rc.user_id
  ${isBookFeedOnly ? 'JOIN club_reading_list crl ON crl.club_id = $1 AND crl.book_id = b.id' : ''}
  LEFT JOIN comment_likes cl ON cl.comment_id = rc.id
  WHERE rc.parent_comment_id IS NULL
    AND ($3::timestamptz IS NULL OR (rc.created_at, rc.id) < ($3::timestamptz, $4::int))
  GROUP BY rc.id, u.id, r.id, b.id

  UNION ALL

  -- ── REPLIES BRANCH ──
  SELECT
    'reply' AS activity_type, rc.id, rc.comment_text AS content, rc.created_at, NULL::numeric AS rating,
    0 AS like_count, 0 AS comment_count, false AS is_liked,
    b.id AS book_id, b.title AS book_title, b.author AS book_author,
    parent_rc.id AS parent_id, 'comment'::text AS parent_type, LEFT(parent_rc.comment_text, 120) AS parent_snippet,
    u.id AS actor_id, u.name AS actor_name, u.avatar_color AS actor_avatar_color,u.image_url AS actor_image_url
  FROM review_comments rc
  JOIN users u                  ON u.id = rc.user_id
  JOIN review_comments parent_rc ON parent_rc.id = rc.parent_comment_id
  JOIN reviews r                ON r.id = rc.review_id
  JOIN books b                  ON b.id = r.book_id
  JOIN club_members cm          ON cm.club_id = $1 AND cm.user_id = rc.user_id
  ${isBookFeedOnly ? 'JOIN club_reading_list crl ON crl.club_id = $1 AND crl.book_id = b.id' : ''}
  WHERE rc.parent_comment_id IS NOT NULL
    AND ($3::timestamptz IS NULL OR (rc.created_at, rc.id) < ($3::timestamptz, $4::int))

) feed
ORDER BY created_at DESC, id DESC
LIMIT $5;
`

export const getClubActivityFeed = asyncHandler(async (req,res) => {
  const { clubId } = req.params;
  const userId     = req.user.id; 
  const limit      = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { cursorDate, cursorId } = parseCursor(req.query.cursor);

  if (!(await assertMember(clubId, userId))) {
    return res.status(403).json({ error: 'You are not a member of this club.' });
  }

  const { rows } = await db.query(FEED_BASE_QUERY(false), [
    clubId,
    userId,
    cursorDate,
    cursorId,
    limit + 1
  ]);

  const hasMore  = rows.length > limit;
  const items    = hasMore ? rows.slice(0, limit) : rows;
  const activity = normalizeFeedRows(items);

  res.json({
    activity,
    next_cursor: hasMore ? buildCursor(items) : null,
    has_more:    hasMore,
  })
})

export const getClubBookFeed = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId     = req.user.id;
  const limit      = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { cursorDate, cursorId } = parseCursor(req.query.cursor);

  if (!(await assertMember(clubId, userId))) {
    return res.status(403).json({ error: 'You are not a member of this club.' });
  }

  const { rows } = await db.query(FEED_BASE_QUERY(true), [
    clubId,
    userId,
    cursorDate,
    cursorId,
    limit + 1
  ]);

  const hasMore  = rows.length > limit;
  const items    = hasMore ? rows.slice(0, limit) : rows;
  const activity = normalizeFeedRows(items);

  res.json({
    activity,
    next_cursor: hasMore ? buildCursor(items) : null,
    has_more:    hasMore,
  });
});