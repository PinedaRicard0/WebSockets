var connectionUrl = document.getElementById("connUrl");
var connectionBtn = document.getElementById("connBtn");
var state = document.getElementById("state");
var sendMsg = document.getElementById("sendMsg");
var sendBtn = document.getElementById("sendBtn");
var msgLogs = document.getElementById("msgLogs");
var closeBtn = document.getElementById("closeBtn");
var recipents = document.getElementById("recipents");
var connId = document.getElementById("connId");
var users = document.getElementById("userConnected");
connectionUrl.value = "ws://localhost:5000";

function onConnBtn(){
    state.innerHTML = "Attempting to connect...";
    socket = new WebSocket(connectionUrl.value);
    socket.onopen = function(event){
        updateState();
    };

    socket.onclose = function(event){
        updateState();
        msgLogs.innerHTML += `<tr> <td colspan="3"> Connection closed. Code: ${htmlEscape(event.code)}
        Reason: ${htmlEscape(event.reason)}</td> </tr>`;
    };

    socket.onerror = updateState();

    socket.onmessage = function(event){
        var jsonResponse = JSON.parse(event.data)
        if (jsonResponse.Type === 'Connected') {
            connId.innerHTML = `${connId.innerText} ${jsonResponse.Message}`;
        }
        else if(jsonResponse.Type === 'NewUser'){
          let socketsIDs = jsonResponse.Message.split('|');
          if(socketsIDs.length > 0){
            users.innerHTML = "";
            socketsIDs.forEach(element => {
              users.innerHTML += `<tr> <td><button id="${element}">${element}</button></td> </tr>`
            });
          }
        }
        else {
            msgLogs.innerHTML += `<tr>
            <td> Server </td>
            <td> Client </td>
            <td> ${htmlEscape(jsonResponse.Message)}</td>
            </tr>`;
        }
    };
}

function onCloseBtn(){
    if (!socket || socket.readyState !== WebSocket.OPEN){
        alert(`Socket not connected`);
    }
    socket.close(1000, "closing from client");
}

function onSendBtn(){
    if (!socket || socket.readyState !== WebSocket.OPEN){
        alert(`Socket not connected`);
    }
    var data = sendMsg.value;
    socket.send(data);
    msgLogs.innerHTML += `<tr>
        <td> Server </td>
        <td> Client </td>
        <td> ${htmlEscape(data)}</td>
        </tr>`;
}

function htmlEscape(str){
    return str.toString().replace(/&/g,'&amp')
        .replace(/"/g,'&quot')
        .replace(/'/g,'&#39')
        .replace(/</g,'&lt')
        .replace(/>/g,'&gt')
}

function updateState(){

    function disable(){
        sendMsg.disabled = true;
        sendBtn.disabled = true;
        closeBtn.disabled = true;
        recipents.disabled = true;
    }

    function enable(){
        sendMsg.disabled = false;
        sendBtn.disabled = false;
        closeBtn.disabled = false;
        recipents.disabled = false;
    }

    connectionUrl.disabled = true;
    connectionBtn.disabled = true;

    if(!socket){
        disable();
    }else{
        switch (socket.readyState){
            case WebSocket.CLOSED:
                state.innerHTML = "Closed";
                connId.innerHTML = "ConnID: N/A"
                state.classList.remove("connected");
                disable();
                connectionUrl.disabled = false;
                connectionBtn.disabled = false;
                break;
            case WebSocket.CLOSING:
                state.innerHTML = "Closing...";
                disable();
                break;
            case WebSocket.OPEN:
                state.innerHTML = "Connection Open";
                state.classList.add("connected");
                enable();
                break;
            default:
                state.innerHTML = `Unknow WebSocket State: ${htmlEscape(socket.readyState)}`;
                disable();
                break;

        }
    }
}