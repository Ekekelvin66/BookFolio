import { db } from './db.js';
import { ENTITY_TYPES } from '../utils/constants.js';

const onlineUsers = new Map();

const normalizeType = (entity_type) => {
  if (!entity_type) return 'system';
  if (entity_type.startsWith('club_')) return 'club'; 
  switch (entity_type) {
    case 'review_like':
    case 'comment_like': return 'like';
    case 'review_comment':
    case 'comment_reply': return 'reply';
    case 'message': return 'message';
    default: return null;
  }
};

const fetchPopulatedNotification = async (notificationId) => {
  try {
    const { rows } = await db.query(`
      SELECT
        n.id,
        n.entity_type,
        n.entity_id,
        n.is_read,
        n.created_at,
        u.id AS actor_id,
        u.name AS actor_name,
        u.avatar_color AS actor_avatar_color,
        u.image_url AS actor_image_url,
        COALESCE(b_direct.title, b_comment.title, b_comment_like.title, b_club_review.title) AS book_title,
        COALESCE(b_direct.id, b_comment.id, b_comment_like.id, b_club_review.id) AS book_id,
        m.conversation_id AS conversation_id,
        CASE
          WHEN n.entity_type = 'review_comment' THEN rc.comment_text
          WHEN n.entity_type = 'comment_reply'  THEN rc_parent.comment_text
          ELSE NULL
        END AS quote,
        m.message_text AS message_preview,
        cm.club_id AS msg_club_id,
        bc.name AS club_name
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      LEFT JOIN review_comments rc ON rc.id = n.entity_id AND n.entity_type IN ('review_comment', 'comment_reply')
      LEFT JOIN review_comments rc_parent ON rc_parent.id = rc.parent_comment_id AND n.entity_type = 'comment_reply'
      LEFT JOIN reviews rev_from_comment ON rev_from_comment.id = rc.review_id AND n.entity_type IN ('review_comment', 'comment_reply')
      LEFT JOIN books b_comment ON b_comment.id = rev_from_comment.book_id AND n.entity_type IN ('review_comment', 'comment_reply')
      LEFT JOIN reviews rev_direct ON rev_direct.id = n.entity_id AND n.entity_type = 'review_like'
      LEFT JOIN books b_direct ON b_direct.id = rev_direct.book_id AND n.entity_type = 'review_like'
      LEFT JOIN review_comments rc_liked ON rc_liked.id = n.entity_id AND n.entity_type = 'comment_like'
      LEFT JOIN reviews rev_from_liked_comment ON rev_from_liked_comment.id = rc_liked.review_id AND n.entity_type = 'comment_like'
      LEFT JOIN books b_comment_like ON b_comment_like.id = rev_from_liked_comment.book_id AND n.entity_type = 'comment_like'
      LEFT JOIN reviews rev_club ON rev_club.id = n.entity_id AND n.entity_type = 'club_review'
      LEFT JOIN books b_club_review ON b_club_review.id = rev_club.book_id AND n.entity_type = 'club_review'
      LEFT JOIN messages m ON m.id = n.entity_id AND n.entity_type = 'message'
      LEFT JOIN club_messages cm ON cm.id = n.entity_id AND n.entity_type = 'club_message'
      LEFT JOIN book_clubs bc ON bc.id = cm.club_id
      WHERE n.id = $1
    `, [notificationId]);

    if (rows.length === 0) return null;
    const n = rows[0];

    return {
      id: n.id,
      type: normalizeType(n.entity_type),
      is_read: n.is_read,
      created_at: n.created_at,
      actor: {
        id: n.actor_id,
        name: n.actor_name,
        avatar_color: n.actor_avatar_color,
        image_url: n.actor_image_url
      },
      meta: {
        book_title: n.book_title ?? null,
        quote: n.quote ?? null,
        preview: n.message_preview ?? null,
        book_id: n.book_id ?? null,
        club_id: n.msg_club_id ?? null,
        conversation_id: n.conversation_id ?? null,
        entity_type: n.entity_type ?? null,
        club_name: n.club_name ?? null
      }
    };
  } catch (err) {
    return null;
  }
};

const getOfflineMembers = async (io, clubId, members) => {
  const socketsInRoom = await io.in(`club_${clubId}`).allSockets();
  return members.filter((m) => {
    const theirSocketId = onlineUsers.get(m.user_id);
    return !theirSocketId || !socketsInRoom.has(theirSocketId);
  });
};

const insertNotifications = async (members, actorId, entityType, entityId) => {
  if (members.length === 0) return [];

  const values = members
    .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
    .join(', ');

  const params = members.flatMap((m) => [
    m.user_id,
    actorId,
    'club_activity',
    entityType,
    entityId,
  ]);

  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id)
     VALUES ${values}
     ON CONFLICT DO NOTHING
     RETURNING id, user_id`,
    params
  );
  return rows;
};

const notifyOfflineClubMembers = async (io, clubId, actorId, entityType, entityId) => {
  const { rows: allMembers } = await db.query(
    `SELECT user_id FROM club_members WHERE club_id = $1 AND user_id != $2`,
    [clubId, actorId]
  );

  if (allMembers.length === 0) return;

  const offlineMembers = await getOfflineMembers(io, clubId, allMembers);
  const inserted = await insertNotifications(offlineMembers, actorId, entityType, entityId);

  for (const row of inserted) {
    const theirSocketId = onlineUsers.get(row.user_id)
    if (theirSocketId) {
      const payload = await fetchPopulatedNotification(row.id);
      if (payload) {
        io.to(theirSocketId).emit('new_notification', payload);
      }
    }
  }
};

export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId
      ? Number(socket.handshake.auth.userId)
      : null;

    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.join(`user_${userId}`); 
    } else {
     
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`); // Kept for presence-checking
      console.log(`[Socket] User ${userId} joined conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`[Socket] User ${userId} left conversation_${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, message, senderId, tempId, replyToMessageId }) => {
      try {
        const { rows } = await db.query(
          `WITH inserted_message AS(
            INSERT INTO messages (conversation_id, sender_id, message_text, reply_to_message_id)
            VALUES ($1, $2, $3, $4) RETURNING *
          )
          SELECT m.*, u.name AS sender_name, u.avatar_color,
                 m_parent.message_text AS parent_message_text,
                 u_parent.name AS parent_sender_name
            FROM inserted_message m
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN messages m_parent ON m.reply_to_message_id = m_parent.id
            LEFT JOIN users u_parent ON m_parent.sender_id = u_parent.id`
          ,[conversationId, senderId, message, replyToMessageId || null]
        );

        const saved = rows[0];

        await db.query(
          `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
          [conversationId]
        );

        const { rows: convoRows } = await db.query(
          `SELECT user_one_id, user_two_id FROM conversations WHERE id = $1`,
          [conversationId]
        );

        const { user_one_id, user_two_id } = convoRows[0];
        const recipientId = user_one_id === senderId ? user_two_id : user_one_id;

        const msgBase = {
          id: saved.id,
          tempId: tempId,
          message_text: saved.message_text,
          created_at: saved.created_at,
          is_read: false,
          conversationId: Number(conversationId),
          sender: { id: senderId, name: saved.sender_name, avatar_color: saved.avatar_color },
          replyTo: saved.reply_to_message_id ? {
            id: saved.reply_to_message_id,
            message_text: saved.parent_message_text,
            sender: { name: saved.parent_sender_name }
          } : null
        };

        io.to(`user_${recipientId}`).emit('receive_message', {
          ...msgBase,
          is_sent: false,
        });

        socket.emit('receive_message', {
          ...msgBase,
          is_sent: true,
        });

        const socketsInRoom = await io.in(`conversation_${conversationId}`).allSockets();
        const recipientSocketId = onlineUsers.get(recipientId);
        const recipientIsInRoom = recipientSocketId && socketsInRoom.has(recipientSocketId);

        if (!recipientIsInRoom) {
          const notiResult = await db.query(
            `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [recipientId, senderId, 'message', ENTITY_TYPES.MESSAGE, saved.id]
          );
          
          if (notiResult.rows.length > 0 && recipientSocketId) {
            const payload = await fetchPopulatedNotification(notiResult.rows[0].id);
            if (payload) {
              io.to(recipientSocketId).emit('new_notification', payload);
            }
          }
        }
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('join_club_room', async (clubId) => {
      if (!userId) return;
      try {
        const { rows } = await db.query(
          `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2`,
          [clubId, userId]
        );
        if (rows.length === 0) return socket.emit('error', { message: 'You are not a member of this club' });
        socket.join(`club_${clubId}`);
      } catch (err) {
        console.error('join_club_room error:', err.message);
      }
    });

    socket.on('leave_club_room', (clubId) => {
      socket.leave(`club_${clubId}`);
    });

    socket.on('send_club_message', async ({ clubId, message, replyToMessageId }) => {
      if (!userId) return;
      try {
        const memberCheck = await db.query(
          `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2`,
          [clubId, userId]
        );
        if (memberCheck.rows.length === 0) return socket.emit('error', { message: 'Not a member' });

        const { rows } = await db.query(
          `WITH inserted_message AS (
            INSERT INTO club_messages (club_id, sender_id, message_text, reply_to_message_id)
            VALUES ($1, $2, $3, $4) RETURNING *
           )
           SELECT m.*, u.name, u.avatar_color,
                  m_parent.message_text AS parent_message_text,
                  u_parent.name AS parent_sender_name
           FROM inserted_message m
           JOIN users u ON u.id = m.sender_id
           LEFT JOIN club_messages m_parent ON m.reply_to_message_id = m_parent.id
           LEFT JOIN users u_parent ON m_parent.sender_id = u_parent.id`,
          [clubId, userId, message, replyToMessageId || null]
        );

        const saved = rows[0];
        
        const msgBase = {
          id: saved.id,
          message_text: saved.message_text,
          created_at: saved.created_at,
          is_read: false,
          clubId: Number(clubId),
          sender: { id: userId, name: saved.name, avatar_color: saved.avatar_color },
          replyTo: saved.reply_to_message_id ? {
            id: saved.reply_to_message_id,
            message_text: saved.parent_message_text,
            sender: { name: saved.parent_sender_name }
          } : null
        };

        socket.to(`club_${clubId}`).emit('receive_club_message', { ...msgBase, is_sent: false });
        socket.emit('receive_club_message', { ...msgBase, is_sent: true });

        await notifyOfflineClubMembers(io, clubId, userId, ENTITY_TYPES.CLUB_MESSAGE, saved.id);
      } catch (err) {
        console.error('send_club_message error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      if (userId) onlineUsers.delete(userId);
    });
  });
};