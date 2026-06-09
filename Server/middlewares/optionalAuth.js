import jwt from 'jsonwebtoken'

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null

  if (!token) {
    req.user = null
    return next()
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    req.user = null
  }

  next()
}