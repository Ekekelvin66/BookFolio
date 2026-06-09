import {rateLimit} from 'express-rate-limit'

export const apiLimiter= rateLimit({
    windowMs:10*60*1000,
    max:500,
    standardHeaders:'draft-7',
    legacyHeaders:false,
    message:{
        success:false,
        error:'Too many requests,Pls try again after 10 minutes',
    }
})

export const authLimiter=rateLimit({
    windowMs:10*60*1000,
    max:5,
    statusCode:429,
    standardHeaders:'draft-7',
    legacyHeaders:false,
    skipSuccessfulRequests:true,
    message:{
        success:false,
        error:'Too many authentication attempts. Try again in 10 minutes'
    }
})

export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 40, 
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'You are sending messages too quickly. Please slow down.'
  }
});
