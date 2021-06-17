using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading.Tasks;

namespace NetCoreSockets.Middleware
{
    public class WebSocketServerConnectionManager
    {
        private ConcurrentDictionary<string, WebSocket> _sockets = new ConcurrentDictionary<string, WebSocket>();

        public ConcurrentDictionary<string, WebSocket> GetAllSockets() {
            return _sockets;
        }

        public string AddSocket(WebSocket socket) {
            string connId = Guid.NewGuid().ToString();
            _sockets.TryAdd(connId, socket);
            Console.WriteLine($"Client Added: {connId}");
            return connId;
        }
    }
}
