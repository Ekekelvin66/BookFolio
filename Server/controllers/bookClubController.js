import { db } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ENTITY_TYPES } from '../utils/constants.js';
import { uploadClubCover,deleteImage } from '../config/cloudinary.js';

const notifyClubMembers = async (clubId, actorId, entityType, entityId) => {
  const { rows: members } = await db.query(
    `SELECT user_id FROM club_members WHERE club_id = $1 AND user_id != $2`,
    [clubId, actorId]
  );

  if (members.length === 0) return;

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

  await db.query(
    `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id )
     VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params
  );
};
const normalizeGenre = (genre) => {
  if (!genre?.trim()) return null
  return genre.trim().replace(/\b\w/g, (c) => c.toUpperCase())
}

const getClubMember = (clubId, userId) => db.query(
  `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2`,
  [clubId, userId]
);

const isClubMember = async (clubId, userId) => {
  const result = await getClubMember(clubId, userId);
  return result.rows.length > 0;
};

const requireClubMember = async (clubId, userId, res, { status = 403, message = 'You are not a member of this club' } = {}) => {
  const memberResult = await getClubMember(clubId, userId);
  if (memberResult.rows.length === 0) {
    res.status(status).json({ error: message });
    return null;
  }
  return memberResult.rows[0];
};

const requireClubOwner = async (
  clubId,
  userId,
  res,
  {
    notMemberStatus = 403,
    notMemberMessage = 'You are not a member of this club',
    notOwnerStatus = 403,
    notOwnerMessage = 'Only owners can perform this action',
  } = {}
) => {
  const memberResult = await getClubMember(clubId, userId);
  if (memberResult.rows.length === 0) {
    res.status(notMemberStatus).json({ error: notMemberMessage });
    return null;
  }
  if (memberResult.rows[0].role !== 'owner') {
    res.status(notOwnerStatus).json({ error: notOwnerMessage });
    return null;
  }
  return memberResult.rows[0];
};

export const getClubGenres= asyncHandler(async (req,res) => {
  const {rows}=await db.query(`
    SELECT DISTINCT genre
    FROM book_clubs
    WHERE is_private = FALSE AND genre IS NOT NULL
    ORDER BY genre ASC
    `);
    res.json({genres:rows.map((r)=>r.genre)})
})

export const getClubs = asyncHandler(async (req, res) => {
  const userId = req.user.id??null
  const {genre,search} =req.query

  const searchTerm = search?.trim() ? `%${search.trim()}%` : null;

  const { rows } = await db.query(`
    SELECT
      bc.id,
      bc.name,
      bc.motto,
      bc.genre,
      bc.description,
      bc.cover_url,
      bc.is_private,
      bc.created_at,
      COUNT(DISTINCT cm.user_id) AS member_count,
      EXISTS (
        SELECT 1 FROM club_members
        WHERE club_id = bc.id AND user_id = $1
      ) AS is_member,
      (
        SELECT status FROM club_join_requests
        WHERE club_id = bc.id AND user_id = $1
      )  AS request_status,
      -- current book
      b.id        AS current_book_id,
      b.title     AS current_book_title,
      b.cover_url AS current_book_cover,
      b.author    AS current_book_author
    FROM book_clubs bc
    LEFT JOIN club_members cm ON cm.club_id = bc.id
    LEFT JOIN club_reading_list crl ON crl.club_id = bc.id AND crl.is_current = TRUE
    LEFT JOIN books b ON b.id = crl.book_id
      AND ($2::text IS NULL OR bc.genre ILIKE $2)
      AND ($3::text IS NULL OR bc.name ILIKE $3 OR bc.description ILIKE $3 OR bc.genre ILIKE $3)
    GROUP BY bc.id, b.id
    ORDER BY bc.created_at DESC
  `, [userId,genre??null,searchTerm]);

  res.json({ clubs: rows });
});

export const getMyClubs = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { rows } = await db.query(`
    SELECT
      bc.id,
      bc.name,
      bc.motto,
      bc.description,
      bc.cover_url,
      bc.is_private,
      bc.genre,
      bc.created_at,
      cm_me.role,
      COUNT(DISTINCT cm_all.user_id)  AS member_count,
      (
        SELECT COUNT(*) FROM club_messages
        WHERE club_id = bc.id
          AND sender_id != $1
          AND is_read = FALSE
      )                               AS unread_count,
      (
        SELECT message_text FROM club_messages
        WHERE club_id = bc.id
        ORDER BY created_at DESC LIMIT 1
      ) AS last_message_text,

      (
        SELECT created_at FROM club_messages
        WHERE club_id = bc.id
        ORDER BY created_at DESC LIMIT 1
      ) AS last_message_at,

      (
        SELECT u.name FROM club_messages cm
        JOIN users u ON u.id = cm.sender_id
        WHERE cm.club_id = bc.id
        ORDER BY cm.created_at DESC LIMIT 1
      ) AS last_sender_name , 
       
       EXISTS (
        SELECT 1 FROM club_notification_mutes
        WHERE user_id = $1 AND club_id = bc.id
      ) AS is_muted,
 
      b.id        AS current_book_id,
      b.title     AS current_book_title,
      b.cover_url AS current_book_cover,
      b.author    AS current_book_author
      
    FROM club_members cm_me
    JOIN book_clubs bc ON bc.id = cm_me.club_id
    LEFT JOIN club_members cm_all ON cm_all.club_id = bc.id
    LEFT JOIN club_reading_list crl ON crl.club_id = bc.id AND crl.is_current = TRUE

    LEFT JOIN books b ON b.id = crl.book_id
    WHERE cm_me.user_id = $1
    GROUP BY bc.id, cm_me.role, b.id
    ORDER BY bc.created_at DESC
  `, [userId]);

  res.json({ clubs: rows });
});

export const getClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;
 
  const clubResult = await db.query(`
    SELECT
      bc.*,
      COUNT(DISTINCT cm.user_id) AS member_count,
      EXISTS (
        SELECT 1 FROM club_members
        WHERE club_id = bc.id AND user_id = $2
      ) AS is_member,
      (
        SELECT role FROM club_members
        WHERE club_id = bc.id AND user_id = $2
      ) AS my_role,
      (
        SELECT status FROM club_join_requests
        WHERE club_id = bc.id AND user_id = $2
      ) AS request_status
    FROM book_clubs bc
    LEFT JOIN club_members cm ON cm.club_id = bc.id
    WHERE bc.id = $1
    GROUP BY bc.id
  `, [clubId, userId]);
 
  if (clubResult.rows.length === 0) {
    return res.status(404).json({ error: 'Club not found' });
  }
 
  const club = clubResult.rows[0];
 
  if (club.is_private && !club.is_member) {
    return res.status(403).json({ error: 'This club is private' });
  }
 

  const currentBookResult = await db.query(`
    SELECT
      b.id, b.title, b.author, b.cover_url,
      crl.is_current, crl.added_at, crl.current_chapter,
      u.name AS added_by_name
    FROM club_reading_list crl
    JOIN books b ON b.id = crl.book_id
    JOIN users u ON u.id = crl.added_by
    WHERE crl.club_id = $1 AND crl.is_current = TRUE
    LIMIT 1
  `, [clubId]);
 
  const currentBook = currentBookResult.rows[0] ?? null;
 

  if (!club.is_member) {
    const previewMembersResult = await db.query(`
      SELECT u.id, u.name, u.avatar_color,u.image_url
      FROM club_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = $1
      LIMIT 5
    `, [clubId]);
 
    return res.json({
      club,
      current_book: currentBook,
      members: previewMembersResult.rows,
      reading_list: [],
      recent_activity: [],
      is_preview: true,
    });
  }
 
 
  const membersResult = await db.query(`
    SELECT
      u.id, u.name, u.avatar_color,u.image_url,
      cm.role, cm.joined_at,
      COUNT(r.id) AS review_count
    FROM club_members cm
    JOIN users u ON u.id = cm.user_id
    LEFT JOIN reviews r ON r.user_id = u.id
    WHERE cm.club_id = $1
    GROUP BY u.id, cm.role, cm.joined_at
    ORDER BY cm.role DESC, cm.joined_at ASC
  `, [clubId]);
 
  const readingListResult = await db.query(`
    SELECT
      b.id, b.title, b.author, b.cover_url,
      crl.is_current, crl.added_at, crl.current_chapter,
      u.name AS added_by_name
    FROM club_reading_list crl
    JOIN books b ON b.id = crl.book_id
    JOIN users u ON u.id = crl.added_by
    WHERE crl.club_id = $1
    ORDER BY crl.is_current DESC, crl.added_at DESC
  `, [clubId]);
 
 
  const activityResult = await db.query(`
    SELECT
      'message'       AS activity_type,
      cm.id,
      cm.message_text AS content,
      cm.created_at,
      u.id            AS actor_id,
      u.name          AS actor_name,
      u.avatar_color  AS actor_avatar_color,
      u.image_url     AS actor_image_url,
      NULL            AS book_title,
      NULL            AS book_id
    FROM club_messages cm
    JOIN users u ON u.id = cm.sender_id
    WHERE cm.club_id = $1
 
    UNION ALL
 
    SELECT
      'review'        AS activity_type,
      r.id,
      r.review   AS content,
      r.created_at,
      u.id            AS actor_id,
      u.name          AS actor_name,
      u.avatar_color  AS actor_avatar_color,
      u.image_url     AS actor_image_url,
      b.title         AS book_title,
      b.id            AS book_id
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN books b ON b.id = r.book_id
    JOIN club_members cm ON cm.club_id = $1 AND cm.user_id = r.user_id
 
    ORDER BY created_at DESC
    LIMIT 10
  `, [clubId]);
 
  res.json({
    club,
    current_book: currentBook,
    members: membersResult.rows,
    reading_list: readingListResult.rows,
    recent_activity: activityResult.rows,
    is_preview: false,
  });
});


export const createClub = asyncHandler(async (req, res) => {
  const { 
    name, motto, description, is_private, genre, 
    initialBookId, initialTitle, initialAuthor, initialCoverUrl, initialPageCount,initialDescription, initialPreviewLink,      
    initialAverageRating, initialRatingsCount,   
    initialPublishDate, initialPublishYear,    
  } = req.body;
  const userId = req.user.id;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Club name is required' });
  }

 
  let finalCoverUrl = null;
  let finalCoverPublicId = null;

  if (req.file) {
    finalCoverUrl = req.file.path;
    finalCoverPublicId = req.file.filename;
  }
  const clubResult = await db.query(`
    INSERT INTO book_clubs (name, motto, description, cover_url, cover_public_id, is_private, genre, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    name.trim(), 
    motto?.trim() ?? null, 
    description?.trim() ?? null, 
    finalCoverUrl, 
    finalCoverPublicId, 
    is_private ?? false, 
    normalizeGenre(genre), 
    userId
  ]);

  const club = clubResult.rows[0];

  await db.query(`
    INSERT INTO club_members (club_id, user_id, role)
    VALUES ($1, $2, 'owner')
  `, [club.id, userId]);

  if (initialBookId) {
    let resolvedBookId = null;

    if (!isNaN(Number(initialBookId))) {
      const existingCheck = await db.query(
        `SELECT id FROM books WHERE id = $1`,
        [initialBookId]
      );
      if (existingCheck.rows.length > 0) {
        resolvedBookId = existingCheck.rows[0].id;
      } else {
        return res.status(400).json({ error: 'Book not found in database' });
      }
    }

    if (!resolvedBookId) {
      const googleCheck = await db.query(`
        SELECT id FROM books WHERE google_id = $1
      `, [initialBookId]);
      
      if (googleCheck.rows.length > 0) {
        resolvedBookId = googleCheck.rows[0].id;
      } else {
        const inserted = await db.query(`
          INSERT INTO books (
            google_id, title, author, cover_url,
            page_count, description, preview_link,
            average_rating, ratings_count,
            publish_date, publish_year,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
          RETURNING id
        `, [
          initialBookId,
          initialTitle,
          initialAuthor,
          initialCoverUrl ?? null,
          initialPageCount ?? null,
          initialDescription ?? null,
          initialPreviewLink ?? null,
          initialAverageRating ?? null,
          initialRatingsCount ?? null,
          initialPublishDate ?? null,
          initialPublishYear ?? null,
        ])
        resolvedBookId = inserted.rows[0].id
      }
    }

    await db.query(`
      INSERT INTO club_reading_list (club_id, book_id, added_by, is_current)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (club_id, book_id) DO NOTHING
    `, [club.id, resolvedBookId, userId]);
  }

  res.status(201).json({ club });
});

export const joinClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;

  const clubResult = await db.query(
    `SELECT id, is_private FROM book_clubs WHERE id = $1`,
    [clubId]
  );

  if (clubResult.rows.length === 0) {
    return res.status(404).json({ error: 'Club not found' });
  }

  if (clubResult.rows[0].is_private) {
    return res.status(403).json({ error: 'This club is private — you need to send a request to join' });
  }

  await db.query(`
    INSERT INTO club_members (club_id, user_id, role)
    VALUES ($1, $2, 'member')
    ON CONFLICT DO NOTHING
  `, [clubId, userId]);

  res.status(201).json({ message: 'Joined club successfully' });
});

export const editClubInfo=asyncHandler(async (req,res) => {
   const { clubId } = req.params;
   const { name, description,genre,motto, is_private } = req.body;
   const userId=req.user.id

   const memberResult = await requireClubOwner(clubId, userId, res, {
      notMemberStatus: 404,
     notOwnerStatus: 401,
     notOwnerMessage: 'Only owners are allowed to edit club details',
   });
   if (!memberResult) return;

   let finalCoverUrl=null
   let finalCoverPublicId=null

   if(req.file){
    finalCoverUrl=req.file.path
    finalCoverPublicId=req.file.filename
   }

    const oldImageQuery = await db.query(
      `SELECT cover_public_id FROM book_clubs WHERE id = $1`,
      [clubId]
    );
    const oldPublicId = oldImageQuery.rows[0]?.cover_public_id;

    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

   const updatedResult=await db.query(`
      UPDATE book_clubs 
      SET 
      name = COALESCE($1,name),
      motto = COALESCE($2, motto),
      description=COALESCE($3,description),
      cover_url = COALESCE($4, cover_url),
      cover_public_id = COALESCE($5, cover_public_id),
      is_private= COALESCE($6,is_private),
      genre       = COALESCE($7, genre),
      updated_at=NOW()
      WHERE id=$8
      RETURNING *
      `,[name ?? null, motto ?? null, description ?? null,finalCoverUrl,finalCoverPublicId, is_private ?? null,normalizeGenre(genre), clubId]);

      res.json({ club:updatedResult.rows[0],message:'Club details updated succesfully'})
})

export const requestToJoin=asyncHandler(async (req,res) => {
  const {clubId}=req.params;
  const userId=req.user.id;

  const clubResult=await db.query(`
    SELECT id,is_private FROM book_clubs WHERE id=$1
    `,[clubId])
    
    if(clubResult.rows.length===0){
      return res.status(404).json({ error: 'Club not found' });
    }
    if (!clubResult.rows[0].is_private) {
      return res.status(400).json({ error: 'This club is public — use Join Club' });
    }
     const alreadyMember = await db.query(
    `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );
 
  if (alreadyMember.rows.length > 0) {
    return res.status(400).json({ error: 'You are already a member' });
  }
 
  const existingRequest = await db.query(
    `SELECT status FROM club_join_requests WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );
 
  if (existingRequest.rows.length > 0) {
    return res.status(400).json({ error: `Request already ${existingRequest.rows[0].status}` });
  }
 
  await db.query(`
    INSERT INTO club_join_requests (club_id, user_id, status)
    VALUES ($1, $2, 'pending')
  `, [clubId, userId]);
 
  res.status(201).json({ message: 'Join request sent' });
})

export const getJoinRequests = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;
 
  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can view join requests',
  });
  if (!memberResult) return;
 
  const { rows } = await db.query(`
    SELECT
      cjr.id, cjr.status, cjr.created_at,
      u.id AS user_id, u.name, u.avatar_color,u.image_url
    FROM club_join_requests cjr
    JOIN users u ON u.id = cjr.user_id
    WHERE cjr.club_id = $1 AND cjr.status = 'pending'
    ORDER BY cjr.created_at ASC
  `, [clubId]);
 
  res.json({ requests: rows });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const { clubId, requestUserId } = req.params;
  const userId = req.user.id;
 
  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can approve requests',
  });
  if (!memberResult) return;
 
  await db.query(`
    UPDATE club_join_requests
    SET status = 'approved'
    WHERE club_id = $1 AND user_id = $2
  `, [clubId, requestUserId]);
 
  await db.query(`
    INSERT INTO club_members (club_id, user_id, role)
    VALUES ($1, $2, 'member')
    ON CONFLICT DO NOTHING
  `, [clubId, requestUserId]);
 
  await db.query(`
    INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id)
    VALUES ($1, $2, 'club_activity', $3, $4)
  `, [requestUserId, userId, ENTITY_TYPES.CLUB_JOIN_APPROVED, Number(clubId)]);
 
  res.json({ message: 'Request approved' });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { clubId, requestUserId } = req.params;
  const userId = req.user.id;
 
  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can reject requests',
  });
  if (!memberResult) return;
 
  await db.query(`
    UPDATE club_join_requests
    SET status = 'rejected'
    WHERE club_id = $1 AND user_id = $2
  `, [clubId, requestUserId]);
 
  await db.query(`
    INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id)
    VALUES ($1, $2, 'club_activity', $3, $4)
  `, [requestUserId, userId, ENTITY_TYPES.CLUB_JOIN_REJECTED, Number(clubId)]);
 
  res.json({ message: 'Request rejected' });
});


export const leaveClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;

  const memberResult = await requireClubMember(clubId, userId, res, {
    status: 404,
  });
  if (!memberResult) return;

  if (memberResult.role === 'owner') {
    return res.status(400).json({
      error: 'Owners cannot leave. Transfer ownership or delete the club.',
    });
  }

  await db.query(
    `DELETE FROM club_members WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );

  res.json({ message: 'Left club successfully' });
});


export const deleteClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;

  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only the club owner can delete this club',
  });
  if (!memberResult) return;

  await db.query(`DELETE FROM book_clubs WHERE id = $1`, [clubId]);

  res.json({ message: 'Club deleted successfully' });
});


export const transferOwnership = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const { newOwnerId } = req.body;
  const userId = req.user.id;
 
  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only the owner can transfer ownership',
  });
  if (!memberResult) return;
 
  const newOwnerCheck = await db.query(
    `SELECT 1 FROM club_members WHERE club_id = $1 AND user_id = $2`,
    [clubId, newOwnerId]
  );
 
  if (newOwnerCheck.rows.length === 0) {
    return res.status(400).json({ error: 'New owner must already be a member' });
  }
 
  await db.query(
    `UPDATE club_members SET role = 'member' WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );
 
  await db.query(
    `UPDATE club_members SET role = 'owner' WHERE club_id = $1 AND user_id = $2`,
    [clubId, newOwnerId]
  );
 
  res.json({ message: 'Ownership transferred successfully' });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { clubId, memberId } = req.params;
  const userId = req.user.id;
 
  const memberResult = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can remove members',
  });
  if (!memberResult) return;
 
  if (Number(memberId) === userId) {
    return res.status(400).json({ error: 'You cannot remove yourself' });
  }
 
  await db.query(
    `DELETE FROM club_members WHERE club_id = $1 AND user_id = $2`,
    [clubId, memberId]
  );
 
  res.json({ message: 'Member removed' });
});

export const getClubMessages = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.id;
  console.log(`[bookClubController] getClubMessages called: clubId=${clubId}, userId=${userId}`);

  const memberCheck = await requireClubMember(clubId, userId, res);
  if (!memberCheck) return;

  const { rows } = await db.query(`
    SELECT
      cm.id,
      cm.message_text,
      cm.created_at,
      cm.is_read,
      cm.reply_to_message_id,
      u.id          AS sender_id,
      u.name        AS sender_name,
      u.avatar_color,
      m_parent.message_text AS parent_message_text,
      u_parent.name AS parent_sender_name
    FROM club_messages cm
    JOIN users u ON u.id = cm.sender_id
    LEFT JOIN club_messages m_parent ON cm.reply_to_message_id = m_parent.id
    LEFT JOIN users u_parent ON m_parent.sender_id = u_parent.id
    WHERE cm.club_id = $1
    ORDER BY cm.created_at ASC
  `, [clubId]);
  
  console.log(`[bookClubController] Query executed. Found ${rows.length} messages.`);

  const messages = rows.map((m) => ({
    id: m.id,
    message_text: m.message_text,
    created_at: m.created_at,
    is_read: m.is_read,
    is_sent: m.sender_id === userId,
    sender: {
      id: m.sender_id,
      name: m.sender_name,
      avatar_color: m.avatar_color,
    },
    replyTo: m.reply_to_message_id ? {
        id: m.reply_to_message_id,
        message_text: m.parent_message_text,
        sender: { name: m.parent_sender_name }
      } : null
  }));

  await db.query(`
    UPDATE club_messages
    SET is_read = TRUE
    WHERE club_id = $1 AND sender_id != $2
  `, [clubId, userId]);

  const clubResult = await db.query(`
    SELECT 
      bc.id, 
      bc.name, 
      bc.cover_url,
      b.title AS current_book_title
    FROM book_clubs bc
    LEFT JOIN club_reading_list crl 
      ON crl.club_id = bc.id AND crl.is_current = TRUE
    LEFT JOIN books b 
      ON b.id = crl.book_id
    WHERE bc.id = $1
    LIMIT 1
    `, [clubId]);
 
  console.log(`[bookClubController] Returning ${messages.length} messages.`);

  res.json({ messages, club:clubResult.rows[0] });
});


export const sendClubMessage = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const { message_text } = req.body;
  const userId = req.user.id;

  const memberCheck = await requireClubMember(clubId, userId, res);
  if (!memberCheck) return;

  const { rows } = await db.query(`
    INSERT INTO club_messages (club_id, sender_id, message_text)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [clubId, userId, message_text]);

  const saved = rows[0];

  await notifyClubMembers(clubId, userId, ENTITY_TYPES.CLUB_MESSAGE, saved.id);

  res.status(201).json({
    message: {
      id: saved.id,
      message_text: saved.message_text,
      created_at: saved.created_at,
      is_sent: true,
      sender: { id: userId },
    },
  });
});


export const addToReadingList = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const { book_id, googleBooksId, title, author, cover_url,description,page_count,preview_link,average_rating,ratings_count,publish_date,publish_year, is_current } = req.body;
  const userId = req.user.id;
 
  const memberCheck = await requireClubMember(clubId, userId, res);
  if (!memberCheck) return;
 
  let resolvedBookId = book_id;

  if (!resolvedBookId && googleBooksId) {
    const existing = await db.query(
      `SELECT id FROM books WHERE google_id = $1`,
      [googleBooksId]
    );
 
    if (existing.rows.length > 0) {
      resolvedBookId = existing.rows[0].id;
    } else {
      const inserted = await db.query(`
          INSERT INTO books (
            google_id, title, author, cover_url, 
            page_count, description, preview_link,
            average_rating, ratings_count,
            publish_date, publish_year,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
          RETURNING id
        `, [
          googleBooksId,
          title,
          author,
          cover_url ?? null,
          page_count ?? null,
          description ?? null,
          preview_link ?? null,
          average_rating ?? null,
          ratings_count ?? null,
          publish_date ?? null,
          publish_year ?? null,
        ])
      resolvedBookId = inserted.rows[0].id;
    }
  }
 
  if (!resolvedBookId) {
    return res.status(400).json({ error: 'A valid book is required' });
  }
 
  if (is_current) {
    await db.query(
      `UPDATE club_reading_list SET is_current = FALSE WHERE club_id = $1`,
      [clubId]
    );
  }
 
  await db.query(`
    INSERT INTO club_reading_list (club_id, book_id, added_by, is_current)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (club_id, book_id)
    DO UPDATE SET is_current = EXCLUDED.is_current
  `, [clubId, resolvedBookId, userId, is_current ?? false]);
 
  res.status(201).json({ message: 'Book added to reading list' });
});



export const removeFromReadingList = asyncHandler(async (req, res) => {
  const { clubId, bookId } = req.params;
  const userId = req.user.id;

  const memberCheck = await requireClubMember(clubId, userId, res);
  if (!memberCheck) return;

  await db.query(
    `DELETE FROM club_reading_list WHERE club_id = $1 AND book_id = $2`,
    [clubId, bookId]
  );

  res.json({ message: 'Book removed from reading list' });
});

export const updateCurrentBook = asyncHandler(async (req, res) => {
  const { clubId, bookId } = req.params;
  const { current_chapter } = req.body;
  const userId = req.user.id;
 
  const memberCheck = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can update the current book',
  });
  if (!memberCheck) return;
 
  const bookInList = await db.query(
  `SELECT 1 FROM club_reading_list WHERE club_id = $1 AND book_id = $2`,
  [clubId, bookId]
)

if (bookInList.rows.length === 0) {
  return res.status(400).json({ error: 'Book is not in the reading list' })
}

  await db.query(
    `UPDATE club_reading_list SET is_current = FALSE WHERE club_id = $1`,
    [clubId]
  );
 
  await db.query(`
    UPDATE club_reading_list
    SET is_current = TRUE,
        current_chapter = COALESCE($1, current_chapter)
    WHERE club_id = $2 AND book_id = $3
  `, [current_chapter ?? null, clubId, bookId]);
 
  res.json({ message: 'Current book updated' });
});
 
 

export const updateCurrentChapter = asyncHandler(async (req, res) => {
  const { clubId } = req.params;
  const { current_chapter } = req.body;
  const userId = req.user.id;
 
  const memberCheck = await requireClubOwner(clubId, userId, res, {
    notOwnerMessage: 'Only owners can update the current chapter',
  });
  if (!memberCheck) return;
 
  await db.query(`
    UPDATE club_reading_list
    SET current_chapter = $1
    WHERE club_id = $2 AND is_current = TRUE
  `, [current_chapter, clubId]);
 
  res.json({ message: 'Current chapter updated' });
});

export const muteClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params
  const userId = req.user.id
 
  await db.query(`
    INSERT INTO club_notification_mutes (user_id, club_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, clubId])
 
  res.json({ muted: true })
})

export const unmuteClub = asyncHandler(async (req, res) => {
  const { clubId } = req.params
  const userId = req.user.id
 
  await db.query(`
    DELETE FROM club_notification_mutes
    WHERE user_id = $1 AND club_id = $2
  `, [userId, clubId])
 
  res.json({ muted: false })
})



export const notifyClubsOfReview = async (userId, reviewId) => {
  const { rows: clubs } = await db.query(
    `SELECT club_id FROM club_members WHERE user_id = $1`,
    [userId]
  );

  for (const { club_id } of clubs) {
    await notifyClubMembers(club_id, userId, ENTITY_TYPES.CLUB_REVIEW, reviewId);
  }
};




