"use strict"
let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)

app.use(express.static('dist'))

app.get('/', function(req, res){
  res.sendFile(__dirname + 'index.html')
})

var queue = [],
    inGame = []

io.on('connection', function(socket){
    
    function makeMatch(pos) {
        var matching = pos > 0 ? [pos, 0] : [],
            game = null
        if (matching.length) {
            inGame.push({pair:[queue.splice(pos,1)[0], queue.splice(0,1)[0]]})
            game = inGame[inGame.length - 1]
        }
        return game
    }

    queue.push(socket.id)
    var game = makeMatch(queue.length - 1)

    if (game) {
        io.to(game.pair[1]).emit('connected', game.pair[0])
    }

    socket.on('matched', function(data) {
        game = {pair: [socket.id, data]}
        var mark = Math.random() < .5 ? true : false
        io.to(game.pair[1]).emit('start', mark)
        io.to(game.pair[0]).emit('start', !mark)
    })

    socket.on('state_update', function(data) {
        io.to(game.pair[1]).emit('state_update', data)
    })

    socket.on('disconnect', function() {
        io.to(game.pair[1]).emit('partner_disconnect','data')
    })
})

http.listen(8080, function(){
  console.log('listening on 8080')
})