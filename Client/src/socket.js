import { io } from 'socket.io-client'

let socket = null

export const getSocket = () => {
  if (!socket) {
    const url =  import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const origin =new URL(url).origin
    socket = io(origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: { userId: null },
      path: '/socket.io/',
    })

  }
  return socket
}

export default getSocket




 