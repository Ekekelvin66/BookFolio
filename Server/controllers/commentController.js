import { ENTITY_TYPES } from '../utils/constants.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {db} from '../config/db.js'

export const replyComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user.id
    const { comment_text } = req.body

    const parentCommentResult = await db.query(
        `SELECT id, review_id, user_id FROM review_comments WHERE id = $1`,
        [commentId]
    )
    if (parentCommentResult.rowCount === 0) {
        return res.status(404).json({ message: 'Comment not found' })
    }

    const reviewId = parentCommentResult.rows[0].review_id
    const ownerId = parentCommentResult.rows[0].user_id

    const newResult = await db.query(
        `INSERT INTO review_comments (user_id, review_id, comment_text, parent_comment_id, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [userId, reviewId, comment_text, commentId]
    )

    if (ownerId !== userId) {
        await db.query(
            `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [ownerId, userId, 'reply', ENTITY_TYPES.COMMENT_REPLY, newResult.rows[0].id]
        )
    }

    res.status(201).json({ newComment: newResult.rows[0], message: 'Reply added' })
})

export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user.id

    const commentResult = await db.query(
        `SELECT user_id FROM review_comments WHERE id = $1`,
        [commentId]
    )
    if (commentResult.rowCount === 0) {
        return res.status(404).json({ message: 'Comment not found' })
    }

    if (commentResult.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' })
    }

    await db.query(
        `DELETE FROM review_comments WHERE id = $1`,
        [commentId]
    )

    res.status(200).json({ message: 'Comment deleted' })
})

export const getReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    const result = await db.query(
        `SELECT review_comments.id, review_comments.comment_text, review_comments.created_at, users.name, users.avatar_color
         FROM review_comments
         JOIN users ON users.id = review_comments.user_id
         WHERE parent_comment_id = $1
         ORDER BY created_at ASC`,
        [commentId]
    )

    res.status(200).json({ replies: result.rows })
})

export const likeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user.id

    const commentResult = await db.query(
        `SELECT user_id FROM review_comments WHERE id = $1`,
        [commentId]
    )
    if (commentResult.rowCount === 0) {
        return res.status(404).json({ message: 'Comment not found' })
    }

    const ownerId = commentResult.rows[0].user_id

    await db.query(
        `INSERT INTO comment_likes (comment_id, user_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [commentId, userId]
    )

    if (ownerId !== userId) {
        await db.query(
            `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [ownerId, userId, 'like', ENTITY_TYPES.COMMENT_LIKE, commentId]
        )
    }

    res.status(201).json({ message: 'Comment liked' })
})

export const unlikeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user.id

    await db.query(
        `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId]
    )
    await db.query(
        `DELETE FROM notifications
         WHERE entity_id = $1 AND entity_type = $2 AND type = 'like' AND actor_id=$3`,
        [commentId, ENTITY_TYPES.COMMENT_LIKE,userId]
      );

    res.status(200).json({ message: 'Comment unliked' })
})