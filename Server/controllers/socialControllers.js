import { db } from "../config/db.js";
import { ENTITY_TYPES } from "../utils/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const { rows: notifications } = await db.query(`
    SELECT
      n.id,
      n.entity_type,
      n.entity_id,
      n.is_read,
      n.created_at,
      u.name          AS sender_name,
      u.avatar_color  AS sender_avatar_color,
      u.image_url     AS sender_image_url,
      cm_notif.club_id AS club_id,
      bc_notif.name    AS club_name,

      -- book title and id
      COALESCE(b_direct.title, b_comment.title, b_comment_like.title,b_club_review.title) AS book_title,
      COALESCE(b_direct.id,    b_comment.id,    b_comment_like.id,b_club_review.id)    AS book_id,


      -- conversation id for message notifications
      m.conversation_id AS conversation_id,

      -- quote — show parent comment for replies, comment text for comments
      CASE
        WHEN n.entity_type = 'review_comment' THEN rc.comment_text
        WHEN n.entity_type = 'comment_reply'  THEN rc_parent.comment_text
        ELSE NULL
      END AS quote,

      -- target type for reply notifications
      CASE
        WHEN n.entity_type = 'review_comment' THEN 'review'
        WHEN n.entity_type = 'comment_reply'  THEN 'comment'
        ELSE NULL
      END AS target_type,

      -- like target
      CASE
        WHEN n.entity_type = 'review_like'  THEN 'review'
        WHEN n.entity_type = 'comment_like' THEN 'comment'
        ELSE NULL
      END AS like_target,

      -- message preview
      m.message_text AS message_preview

      FROM notifications n
      JOIN users u ON u.id = n.actor_id

    -- review_comment and comment_reply — join the comment
      LEFT JOIN review_comments rc
      ON rc.id = n.entity_id
      AND n.entity_type IN ('review_comment', 'comment_reply')

    -- parent comment for reply context
      LEFT JOIN review_comments rc_parent
      ON rc_parent.id = rc.parent_comment_id
      AND n.entity_type = 'comment_reply'

    -- review from comment (to find book)
    LEFT JOIN reviews rev_from_comment
      ON rev_from_comment.id = rc.review_id
      AND n.entity_type IN ('review_comment', 'comment_reply')

    -- book from comment's review
    LEFT JOIN books b_comment
      ON b_comment.id = rev_from_comment.book_id
      AND n.entity_type IN ('review_comment', 'comment_reply')

    -- review_like — join review directly
    LEFT JOIN reviews rev_direct
      ON rev_direct.id = n.entity_id
      AND n.entity_type = 'review_like'

    -- book from direct review like
    LEFT JOIN books b_direct
      ON b_direct.id = rev_direct.book_id
      AND n.entity_type = 'review_like'

    -- comment_like — join comment, then its review, then book
    LEFT JOIN review_comments rc_liked
      ON rc_liked.id = n.entity_id
      AND n.entity_type = 'comment_like'

    LEFT JOIN reviews rev_from_liked_comment
      ON rev_from_liked_comment.id = rc_liked.review_id
      AND n.entity_type = 'comment_like'

    LEFT JOIN books b_comment_like
      ON b_comment_like.id = rev_from_liked_comment.book_id
      AND n.entity_type = 'comment_like'

      -- FIX: Join the core reviews table using n.entity_id
    LEFT JOIN reviews rev_club
      ON rev_club.id = n.entity_id
      AND n.entity_type = 'club_review'

      LEFT JOIN club_messages cm_notif
        ON cm_notif.id = n.entity_id
        AND n.entity_type = 'club_message'

    LEFT JOIN book_clubs bc_notif
      ON bc_notif.id = cm_notif.club_id

    -- Then join the books table using the book_id found in that review
    LEFT JOIN books b_club_review
      ON b_club_review.id = rev_club.book_id
      AND n.entity_type = 'club_review'

    -- message preview
    LEFT JOIN messages m
      ON m.id = n.entity_id
      AND n.entity_type = 'message'

    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 50
  `, [userId])

  const { rows: unreadRows } = await db.query(`
    SELECT COUNT(*) AS total
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE
  `, [userId])

  const normalized = notifications.map((n) => ({
    id: n.id,
    type: normalizeType(n.entity_type),
    is_read: n.is_read,
    created_at: n.created_at,
    actor: {
      name: n.sender_name,
      avatar_color: n.sender_avatar_color,
      image_url:n.sender_image_url
    },
    meta: {
      book_title:  n.book_title   ?? null,
      quote:       n.quote        ?? null,
      target_type: n.target_type  ?? null,
      target:      n.like_target  ?? null,
      preview:     n.message_preview ?? null,
      book_id:     n.book_id ?? null,
      club_id:     n.club_id,        
      conversation_id: n.conversation_id ?? null,
      entity_type    : n.entity_type??null,
      club_name      :n.club_name ?? null
    }
  }))

  res.status(200).json({
    notifications: normalized,
    unreadCount: parseInt(unreadRows[0].total),
  })
})

const normalizeType = (entity_type) => {
  if (!entity_type) return 'system';

  if (entity_type.startsWith('club_')) {
    return 'club'; 
  }

  switch (entity_type) {
    case 'review_like':
    case 'comment_like':
      return 'like'
    case 'review_comment':
    case 'comment_reply':
      return 'reply'
    case 'message':
      return 'message'
    default:
      return null
  }
}

export const markNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  const result = await db.query(`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [notificationId, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'No notification found' });
  }

  res.status(200).json({ message: 'Notification marked as read' });
});

export const markAllRead=asyncHandler(async (req,res) => {
  const userId=req.user.id
  await db.query(`
    UPDATE notifications SET is_read=true where user_id=$1 AND is_read=FALSE
    `,[userId])
    res.json({message:'All Notifications marked as read'})
  
})

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id
  await db.query(
    `DELETE FROM notifications WHERE user_id = $1`,
    [userId]
  )
  res.json({ message: 'Notifications cleared' })
})

export const likeReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const reviewOwner = await db.query(
    `SELECT user_id FROM reviews WHERE id = $1`,
    [reviewId]
  );

  if (reviewOwner.rows.length === 0) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const ownerId = reviewOwner.rows[0].user_id;

  if (ownerId === userId) {
    return res.status(400).json({ error: 'Cannot like your own review' });
  }

  const likeResult = await db.query(
    `INSERT INTO review_likes (review_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *`,
    [reviewId, userId]
  );

  if (likeResult.rows.length > 0) {
    await db.query(
      `INSERT INTO notifications (user_id, actor_id, entity_type, entity_id, type)
       VALUES ($1,$2,$3,$4,$5)`,
      [ownerId, userId, ENTITY_TYPES.REVIEW_LIKE, reviewId, 'like']
    );
  }

  res.status(200).json({ message: 'Review liked' });
});

export const unlikeReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const deletedResult = await db.query(`
    DELETE FROM review_likes
    WHERE review_id = $1 AND user_id = $2
    RETURNING *
  `, [reviewId, userId]);

  if (deletedResult.rows.length === 0) {
    return res.status(404).json({ message: 'Like not found' });
  }

  res.status(200).json({ message: 'Unliked successfully' });
});

export const getReviewComments = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const result = await db.query(`
    SELECT review_comments.id, review_comments.comment_text,review_comments.user_id,
      review_comments.created_at,review_comments.parent_comment_id, users.name AS commenter_name,
      users.avatar_color,users.image_url,
      COUNT (comment_likes.id) AS like_count,
      CASE WHEN comment_likes.user_id IS NOT NULL THEN true ELSE false END AS is_liked
    FROM review_comments
    JOIN users ON users.id = review_comments.user_id
    LEFT JOIN comment_likes ON comment_likes.comment_id = review_comments.id
    AND comment_likes.user_id = $2 
    WHERE review_comments.review_id = $1
    GROUP BY review_comments.id, users.name, users.avatar_color,comment_likes.user_id,users.image_url
    ORDER BY review_comments.created_at ASC
  `, [reviewId,req.user.id]);

  const normalized=result.rows.map((r)=>({
    id:r.id,
    body:r.comment_text,
    created_at:r.created_at,
    parent_comment_id: r.parent_comment_id,
    like_count: parseInt(r.like_count),
    is_liked:r.is_liked,
    is_own: r.user_id === req.user.id,
    user:{ name: r.commenter_name, avatar_color: r.avatar_color, image_url:r.image_url }
  }))
  const topLevel = normalized.filter((c) => c.parent_comment_id === null)
  const replies  = normalized.filter((c) => c.parent_comment_id !== null)


  const nested = topLevel.map((comment) => ({
  ...comment,
  replies: replies.filter((r) => r.parent_comment_id === comment.id)
  }))

  res.json({ comments: nested })
  
});

export const addReviewComment = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { comment_text } = req.body;
  const userId = req.user.id;

  const reviewOwner = await db.query(
    `SELECT user_id FROM reviews WHERE id = $1`, [reviewId]
  );

  if (reviewOwner.rows.length === 0) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const ownerId = reviewOwner.rows[0].user_id;

  const result = await db.query(
    `INSERT INTO review_comments (review_id, user_id, comment_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [reviewId, userId, comment_text]
  );

  const commentId = result.rows[0].id;

  if (ownerId !== userId) {
    await db.query(
      `INSERT INTO notifications (user_id, actor_id, entity_type, entity_id, type)
       VALUES ($1,$2,$3,$4,$5)`,
      [ownerId, userId, ENTITY_TYPES.REVIEW_COMMENT, commentId, 'reply']
    );
  }

  res.status(201).json({ comment: result.rows[0] });
});

export const deleteReviewComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await db.query(
    `DELETE FROM review_comments
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [commentId, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  await db.query(
    `DELETE FROM notifications
     WHERE entity_id = $1 AND entity_type = $2 AND type = 'reply'`,
    [commentId, ENTITY_TYPES.REVIEW_COMMENT]
  );

  res.json({ message: 'Comment deleted' });
});

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await db.query(`
    SELECT conversations.id,
      CASE WHEN conversations.user_one_id = $1 THEN u2.name ELSE u1.name END AS other_user_name,
      CASE WHEN conversations.user_one_id = $1 THEN u2.avatar_color ELSE u1.avatar_color END AS other_user_avatar,
      CASE WHEN conversations.user_one_id = $1 THEN u2.image_url ELSE u1.image_url END AS other_user_image,
      CASE WHEN conversations.user_one_id = $1 THEN u2.id ELSE u1.id END AS other_user_id,
      (SELECT message_text FROM messages WHERE messages.conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages WHERE messages.conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM messages WHERE messages.conversation_id = conversations.id AND messages.sender_id != $1 AND messages.is_read = FALSE) AS unread_count,
       EXISTS ( SELECT 1 FROM conversation_mutes WHERE user_id = $1 AND conversation_id = conversations.id ) AS is_muted
    FROM conversations
    JOIN users u1 ON u1.id = conversations.user_one_id
    JOIN users u2 ON u2.id = conversations.user_two_id
    WHERE conversations.user_one_id = $1 OR conversations.user_two_id = $1
    AND NOT EXISTS ( SELECT 1 FROM conversation_hidden WHERE user_id = $1 AND conversation_id = conversations.id) 
    ORDER BY conversations.updated_at DESC
  `, [userId])

    const normalized = result.rows.map((c)=>({
      id:c.id,
      type: 'private',
      is_muted: c.is_muted,
      unread_count: parseInt(c.unread_count) || 0,
      user: {
        id: c.other_user_id,
        name: c.other_user_name,
        avatar_color: c.other_user_avatar,
        image_url:c.other_user_image,
      },
      last_message: {
        body: c.last_message,
        created_at: c.last_message_at,
      },
  }))

  res.status(200).json({ conversations: normalized});
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversationCheck = await db.query(
    `SELECT conversations.user_one_id, conversations.user_two_id,
      CASE WHEN conversations.user_one_id = $1 THEN u2.id ELSE u1.id END AS id,
      CASE WHEN conversations.user_one_id = $1 THEN u2.name ELSE u1.name END AS name,
      CASE WHEN conversations.user_one_id = $1 THEN u2.avatar_color ELSE u1.avatar_color END AS avatar_color,
      CASE WHEN conversations.user_one_id = $1 THEN u2.image_url ELSE u1.image_url END AS other_user_image
     FROM conversations
     JOIN users u1 ON u1.id = conversations.user_one_id
     JOIN users u2 ON u2.id = conversations.user_two_id
     WHERE conversations.id = $2
       AND ($1 = conversations.user_one_id OR $1 = conversations.user_two_id)`,
    [userId, conversationId]
  );

  if (conversationCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = await db.query(`
    SELECT messages.id, messages.message_text, messages.created_at,
      messages.is_read, messages.sender_id, messages.reply_to_message_id,
      users.name AS sender_name, users.avatar_color, users.image_url,
      m_parent.message_text AS parent_message_text,
      u_parent.name AS parent_sender_name
    FROM messages
    JOIN users ON users.id = messages.sender_id
    LEFT JOIN messages m_parent ON messages.reply_to_message_id = m_parent.id
    LEFT JOIN users u_parent ON m_parent.sender_id = u_parent.id
    WHERE messages.conversation_id = $1
    ORDER BY messages.created_at ASC
  `, [conversationId]);

  await db.query(
    `UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2`,
    [conversationId, userId]
  );
  await db.query(`UPDATE notifications SET is_read=TRUE
    WHERE user_id=$1
    AND entity_type='message'
    AND entity_id IN (
      SELECT id FROM messages WHERE conversation_id=$2
    )`, [userId, conversationId]);

  const normalized = result.rows.map((m) => ({
    id: m.id,
    message_text: m.message_text,
    created_at: m.created_at,
    is_read: m.is_read,
    is_sent: m.sender_id === userId,
    sender: {
      id: m.sender_id,
      name: m.sender_name,
      avatar_color: m.avatar_color,
      image_url: m.image_url
    },
    replyTo: m.reply_to_message_id ? {
      id: m.reply_to_message_id,
      message_text: m.parent_message_text,
      sender: { name: m.parent_sender_name }
    } : null
  }))

  const otherUser = conversationCheck.rows[0];

  res.status(200).json({ messages: normalized, otherUser });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { message_text } = req.body;
  const userId = req.user.id;

  const conversationCheck = await db.query(
    `SELECT user_one_id, user_two_id FROM conversations
     WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
    [conversationId, userId]
  );

  if (conversationCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = await db.query(
    `INSERT INTO messages (conversation_id, sender_id, message_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [conversationId, userId, message_text]
  );

  await db.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  const { user_one_id, user_two_id } = conversationCheck.rows[0];
  const recipientId = user_one_id === userId ? user_two_id : user_one_id;

  await db.query(
    `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [recipientId, userId, 'message', ENTITY_TYPES.MESSAGE, result.rows[0].id]
  );

  res.status(201).json({ message: result.rows[0] });
});

export const startConversation = asyncHandler(async (req, res) => {
  const { otherUserId } = req.body;
  const userId = req.user.id;

  if (otherUserId === userId) {
    return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
  }

  const userCheck = await db.query(
    `SELECT id FROM users WHERE id = $1`,
    [otherUserId]
  );

  if (userCheck.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const existing = await db.query(`
    SELECT id FROM conversations
    WHERE (user_one_id = $1 AND user_two_id = $2)
       OR (user_one_id = $2 AND user_two_id = $1)
  `, [userId, otherUserId]);

  if (existing.rows.length > 0) {
    return res.json({ conversationId: existing.rows[0].id });
  }

  const result = await db.query(
    `INSERT INTO conversations (user_one_id, user_two_id) VALUES ($1,$2) RETURNING id`,
    [userId, otherUserId]
  );

  res.status(201).json({ conversationId: result.rows[0].id });
});

export const muteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params
  const userId = req.user.id
 
  await db.query(`
    INSERT INTO conversation_mutes (user_id, conversation_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, conversationId])
 
  res.json({ muted: true })
})

export const unmuteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params
  const userId = req.user.id
 
  await db.query(`
    DELETE FROM conversation_mutes
    WHERE user_id = $1 AND conversation_id = $2
  `, [userId, conversationId])
 
  res.json({ muted: false })
})

export const deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params
  const userId = req.user.id
 
  const check = await db.query(
    `SELECT id FROM conversations
     WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
    [conversationId, userId]
  )
  if (check.rows.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' })
  }
 
  await db.query(`
    INSERT INTO conversation_hidden (user_id, conversation_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, conversationId])
 
  res.json({ message: 'Conversation removed from your list' })
})
