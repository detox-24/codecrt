const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const { encoding, decoding } = require('lib0');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const docs = new Map();
const conns = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const startServer = (httpServer) => {
  // Using the exact same path structure that y-websocket client expects
  const wss = new WebSocket.Server({ server: httpServer, path: '/yjs' });
  
  wss.on('connection', (conn, req) => {
    // Parse cookies from request headers
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      conn.close(1008, 'Unauthorized: Missing token');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;

      // Proceed with connection setup
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;
      const roomname = pathname.slice(pathname.lastIndexOf('/') + 1);
      
      console.log(`New connection to room: ${roomname} by user: ${req.userId}`);
      
      let doc = docs.get(roomname);
      if (!doc) {
        doc = new Y.Doc();
        docs.set(roomname, doc);
      }
      
      const awareness = doc.awareness || new awarenessProtocol.Awareness(doc);
      doc.awareness = awareness;
      
      const conn_info = {
        conn,
        roomname,
        doc,
        awareness,
        messageQueueId: null
      };
      
      conns.set(conn, conn_info);
      
      conn.on('close', () => {
        awarenessProtocol.removeAwarenessStates(
          awareness,
          [conn_info.messageQueueId],
          'connection closed'
        );
        
        conns.delete(conn);
        
        setTimeout(() => {
          const roomConns = Array.from(conns.values()).filter(c => c.roomname === roomname);
          if (roomConns.length === 0) {
            docs.delete(roomname);
            console.log(`Room ${roomname} cleaned up due to inactivity`);
          }
        }, 30000);
      });
      
      conn.on('message', (message) => {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);
        
        switch (messageType) {
          case 0: syncProtocol.readSyncStep1(decoder, encoder, doc); break;
          case 1: syncProtocol.readSyncStep2(decoder, encoder, doc); break;
          case 2:
            awarenessProtocol.applyAwarenessUpdate(
              awareness,
              decoding.readVarUint8Array(decoder),
              conn
            );
            break;
        }
        
        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder));
        }
      });
      
      // Send initial sync and awareness
      const encoder = encoding.createEncoder();
      syncProtocol.writeSyncStep1(encoder, doc);
      conn.send(encoding.toUint8Array(encoder));
      
      if (awareness.getStates().size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, 2);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
        );
        conn.send(encoding.toUint8Array(awarenessEncoder));
      }
    } catch (error) {
      conn.close(1008, 'Unauthorized: Invalid token');
      return;
    }
  });
  
  console.log(`✅ Yjs WebSocket server attached to Express on /yjs`);
};

module.exports = { startServer };