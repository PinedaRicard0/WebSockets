using Microsoft.AspNetCore.Http;
using NetCoreSockets.Util;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace NetCoreSockets.Middleware
{
    public class WebSocketServerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly WebSocketServerConnectionManager _manager;

        public WebSocketServerMiddleware(RequestDelegate next, WebSocketServerConnectionManager manager){
            _next = next;
            _manager = manager;
        }

        public async Task InvokeAsync(HttpContext context) {
            if (context.WebSockets.IsWebSocketRequest)
            {
                WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                //Adding socket to collection with and id
                string ConnID = _manager.AddSocket(webSocket);
                await SendMessageAsync(webSocket, "Connected", ConnID);
                await NotifyNewConnection(ConnID);

                await ReceiveMessage(webSocket, async (result, buffer) =>
                {
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        Console.WriteLine($"Message: {Encoding.UTF8.GetString(buffer, 0, result.Count)}");
                        return;
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        Console.WriteLine("Received close message");
                        return;
                    }
                });
            }
            else
            {
                Console.WriteLine("Hello from the 2nd request delegate");
                await _next(context);
            }
        }

        private async Task SendMessageAsync(WebSocket socket, string type, string message) {
            ResponseMessage response = new ResponseMessage {
                Type = type,
                Message = message
            };            
            var buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(response));
            await socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
        }

        private async Task ReceiveMessage(WebSocket socket, Action<WebSocketReceiveResult, byte[]> handleMessage)
        {

            var buffer = new byte[1024 * 4];
            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer: new ArraySegment<byte>(buffer), cancellationToken: CancellationToken.None);

                handleMessage(result, buffer);
            }
        }

        private async Task NotifyNewConnection(string currentSocketId) {
            ConcurrentDictionary<string, WebSocket> sockets =  _manager.GetAllSockets();
            string socketsId = String.Join('|', sockets.Keys);
            foreach (var obj in sockets) {
                await SendMessageAsync(obj.Value, "NewUser", socketsId);
            }
        }
    }
}
