const socket = io();

const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');



form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value === "" ) return
    socket.emit('message', input.value);
    addMessageToUI(true, input.value)
    scrollBottom()
    input.value = ""
  });


socket.on('response', (response)=>{
    messageContainer.innerHTML += response
    scrollBottom()
})

  
function addMessageToUI(isOwnMessage, data){
      const element = `
      <li class="${isOwnMessage ? "message-right": "message-left"}">
      <p class="message">
        ${data}
      </p>
      </li>
      `
     messageContainer.innerHTML += element
  }
  
  function scrollBottom(){
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
  }
