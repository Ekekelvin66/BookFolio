import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { Server } from 'socket.io'
import {createServer} from 'http'
import { registerSocketHandlers } from './config/SocketHandler.js'
import {requireAuth} from './middlewares/requireAuth.js'
import authRoutes from './routes/authRoutes.js'
import bookRoutes from './routes/bookRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import userRoutes from './routes/userRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import socialRoutes from './routes/socialRoutes.js'
import bookClubRoutes from './routes/bookClubRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import { apiLimiter } from './middlewares/rateLimiter.js'
import homeRoutes from './routes/homeRoutes.js'
import { handleUploadError } from './config/cloudinary.js'

import passport from './config/passport.js';
dotenv.config();

const port=process.env.PORT || 3000
const app=express();
app.set('trust proxy', 1);
const allowedOrigin = process.env.VITE_URL || 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin }))
app.use(express.json())


app.use(passport.initialize());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use('/api',authRoutes)
app.use('/api',apiLimiter,bookRoutes)
app.use('/api',apiLimiter,homeRoutes)
app.use('/api',requireAuth,apiLimiter,reviewRoutes)
app.use('/api',requireAuth,apiLimiter,userRoutes)
app.use('/api/',requireAuth,apiLimiter,dashboardRoutes)
app.use('/api',requireAuth,apiLimiter,socialRoutes)
app.use('/api',requireAuth,apiLimiter,commentRoutes)
app.use('/api',requireAuth,apiLimiter,bookClubRoutes)

const server=createServer(app)
const io = new Server(server,{
    path: '/socket.io/',
    cors:{
        origin: allowedOrigin,
        methods:['GET','POST'],
        credentials:true
    },
    transports:['websocket','polling']
})
console.log(`[Socket.IO] Initialized with path: /socket.io/ and origin: ${allowedOrigin}`)
registerSocketHandlers(io)

app.use(handleUploadError)

app.use((err, req, res, next) => {
    console.error("LOGGED ERROR:", err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || "An unexpected error occurred",
            status: err.status || 500
        }
    });
});

server.listen(port,()=>{
    console.log(`Server is listening on http://localhost:${port}`)
})