const express = require('express');
const { createServer } = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();

const server = createServer(app);
const io = new Server(server);

const meals = [
    { id: 2, name: 'beans', price: 75 },
    {id: 4, name: 'jollof-rice', price: 60},
    {id: 6, name: 'ice-cream', price: 20},
    {id: 8, name: 'noodles', price: 50},
    {id: 10, name: 'swallow', price: 200},
]

const formatMealsAsHtmlList = (meals) => {
    let htmlList = '<ul style="list-style-type: none">';
    meals.forEach(meal => {
        htmlList += `<li>${meal.id} - ${meal.name} - ( $${meal.price} )</li>`;
    });
    htmlList += '</ul> <br/>';
    return htmlList;
};

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))


app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public/views', 'index.html'));
})

const sessions = {}

io.on('connection', (socket) => {
    console.log('a user connected');

    const userId = socket.id
    if(!sessions[userId]){
        sessions[userId] = { currentOrder :[], orderHistory : []}
    }
    socket.on('disconnect', ()=>{
        console.log('user deisconnected')
    } )

    socket.on('message', (msg) => {
        console.log('Received message:', msg);
        
        const session = sessions[userId];
        if (!session) {
            console.error('No session found for user:', userId);
            return socket.emit('response', createErrorResponse('Session not found'));
        }
    
        let response;
        try {
            switch (msg) {
                case '1': // Show meal selection
                    response = handleMealSelection(session);
                    break;
                case '99': // Checkout
                    response = handleCheckout(session);
                    break;
                case '98': // Order history
                    response = handleOrderHistory(session);
                    break;
                case '97': // Current order
                    response = handleCurrentOrder(session);
                    break;
                case '0': // Cancel order
                    response = handleOrderCancel(session);
                    break;
                default: // Add meal to order
                    response = handleMealAdd(msg, session, meals);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            response = createErrorResponse('An error occurred while processing your request');
        }
    
        socket.emit('response', response);
    });
    
    // Helper functions
    function handleMealSelection(session) {
        const res = '<p style="font-weight: bold;">Select the meal number to add to your order.</p><br/>' +
                    `${formatMealsAsHtmlList(meals)}`;
        return addInputToUI(false, res);
    }
    
    function handleCheckout(session) {
        let res;
        if (session.currentOrder.length > 0) {
            session.orderHistory.push([...session.currentOrder]);
            session.currentOrder = [];
            res = '<p style="font-weight: bold;">Order placed successfully! Would you like to place another order?</p><br/>';
        } else {
            res = '<p style="font-weight: bold;">No order to place.</p><br/>';
        }
        return addInputToUI(false, res + getWelcomeMessage());
    }
    
    function handleOrderHistory(session) {
        let res;
        if (session.orderHistory.length > 0) {
            res = generateOrderHistoryHtml(session);
        } else {
            res = '<p style="font-weight: bold;">No order history found.</p><br/>';
        }
        return addInputToUI(false, res + getWelcomeMessage());
    }
    
    function generateOrderHistoryHtml(session) {
        let htmlList = '<ul style="list-style-type: none"><p>Your order history:</p><br/>';
        
        session.orderHistory.forEach(innerOrder => {
            innerOrder.forEach(order => {
                htmlList += `<li style="font-weight: bold;">${order.name} - $${order.price}</li>`;
            });
        });
    
        const totalPrice = session.orderHistory.flat().reduce((sum, meal) => sum + meal.price, 0);
        htmlList += `<br/><p style="font-weight: bold;">Total price: $${totalPrice}</p>`;
        htmlList += '</ul><br/>';
    
        return htmlList;
    }
    
    function handleCurrentOrder(session) {
        let res;
        if (session.currentOrder.length > 0) {
            res = generateCurrentOrderHtml(session);
        } else {
            res = '<p style="font-weight: bold;">You have not placed an order yet.</p><br/>';
        }
        return addInputToUI(false, res + getWelcomeMessage());
    }
    
    function generateCurrentOrderHtml(session) {
        let htmlList = '<ul style="list-style-type: none"><p>Your current order:</p><br/>';
        session.currentOrder.forEach(order => {
            htmlList += `<li style="font-weight: bold;">${order.name} - $${order.price}</li>`;
        });
        htmlList += '</ul><br/>';
        return htmlList;
    }
    
    function handleOrderCancel(session) {
        let res;
        if (session.currentOrder.length > 0) {
            session.currentOrder = [];
            res = '<p style="font-weight: bold;">Your current order has been cancelled.</p><br/>';
        } else {
            res = '<p style="font-weight: bold;">No order to cancel.</p><br/>';
        }
        return addInputToUI(false, res + getWelcomeMessage());
    }
    
    function handleMealAdd(msg, session, meals) {
        const mealId = parseInt(msg);
        const meal = meals.find(m => m.id === mealId);
        let res;
    
        if (meal) {
            session.currentOrder.push(meal);
            res = `<p style="font-weight: bold;">${meal.name} added to your order. You can add more items or proceed to checkout.</p><br/>`;
        } else {
            res = '<p style="font-weight: bold;">Invalid selection. Please try again.</p><br/>';
        }
        return addInputToUI(false, res + getWelcomeMessage());
    }
    
    function createErrorResponse(message) {
        return addInputToUI(false, `<p style="color: red; font-weight: bold;">${message}</p>`);
    }
});

function getWelcomeMessage(){
  const message = 
    `<p id="message">
        Select [1] place an order <br/><br/>
        Select [99] to checkout order <br/><br/>
        Select [98] to see order history <br/><br/>
        Select [97] to see current order <br/><br/>
        Select [0] to cancel order <br/><br/>
     </p>`
  return message
}

function addInputToUI(isOwnMessage,data){
    const element =
      `<li class="${isOwnMessage ? "message-right": "message-left"}">
      <p id="message">
        ${data}
      </p>
      </li>`
  
      return element
  }


server.listen(4400, () => {
    console.log('server running at http://localhost:4400');
    });   