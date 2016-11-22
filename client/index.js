import React, {Component} from 'react'
import {render} from 'react-dom'
let socket = io();

var ua = navigator.userAgent.toLowerCase();
var isMobile = ua.indexOf("mobile") > -1;


socket.on('connected', function(data){
    socket.emit('matched',data);
});

class App extends Component {
  render() {
    return (
      <div>
        <Tables data = {this.props.data}/>
        <Disconnect />
      </div>
    )
  }
}


class Tables extends Component {
  constructor(props) {
    super(props)
    const makeTableArray = (rows, cols, table) => {
      return rows.map(function(row) {
        return cols.map(function(el) {
          let btn = (row * cols.length + el)
          tics[table][btn] = ''
          return {'t': table, 'btn' : btn}
        })
      })
    }
    //tics will hold the marks
    //over will hold bool if game is over or not
    //turn will hold whose turn it is per board
    //winner will hold if there was a winner and if so who it was
    //winner need not be a part of the state
    //tables will be used to make the boards
    let tics = [], over = {}, turn = {}, mark = {}, winner = {},
        gridSize = 3, games = 6,
        gridArray = new Array(gridSize).fill('').map((ae,i) => i),
        gameArray = new Array(games).fill(' '),
        tables = gameArray.map(function(el,i) {
          over[i] = false
          turn[i] = i % 2 ? this.props.data : !this.props.data
          mark[i] = turn[i] ? 'X' : 'O'
          winner[i] = {'winner': false, 'mark': null}
          tics[i] = {}
          return makeTableArray(gridArray, gridArray, i)
        }, this)
    this.state = {tables, tics, over, mark, turn, winner}
  }

  updateState(data) {
    let state_turn = this.state.turn
        if (!data.over) state_turn[data.table] = true
    data.over ? this.setState({tics: data.marks, over: data.over, winner: data.winner}) : this.setState({tics: data.marks, turn: state_turn})
  }

  componentWillMount() {
    var context = this
    socket.on('state_update', function(data) {
      context.updateState(data)
    })
  }

//glyphsearch circle-o times

  makeTable(el, i) {
    //make a tictactoe board
    return el.map(function(elem) {
      return (<tr>{elem.map(function(element) {
        return (<td>
              <button className={'btn btn-default button' + (isMobile ? '' : (this.state.tics[element.t][element.btn] === '' ? ' empty' : ''))}
                style={{color:this.state.mark[element.t] === this.state.tics[element.t][element.btn] ? "black" : "indianred"}}
                onClick={() => this.state.over[element.t] ? {} : this.takeTurn(element.t, element.btn)}>
                {this.state.tics[element.t][element.btn]}<span className="hovermark">{this.state.mark[element.t]}</span>
              </button>
             </td>)
      }, this)}</tr>)
    }, this)
  }

  takeTurn(t, btn) {
    let state_tics = this.state.tics,
        state_turn = this.state.turn
    if (state_turn[t] && state_tics[t][btn] === ''){
      state_tics[t][btn] = this.state.mark[t]
      state_turn[t] = false
      this.setState({tics: state_tics, turn: state_turn})
      let gamestate = this.gameState(t),
          data = gamestate.over[t] ? {'marks' : state_tics, 'over': gamestate.over, 'table': t, 'winner': gamestate.winner} : {'marks' : state_tics, 'table': t}
      socket.emit('state_update', data)
    }
  }

  gameState(t) {
    function check(array) {
      return array.reduce((a,b) => a && a === b ? a : false)
    }
    let btns = this.state.tics[t],
        toReduce = this.state.tables[0].map((ae,i,array) => array.map((ae,i,array) => i)),
        cols, rows, diag1, diag2

    rows = toReduce.reduce((a,b,i,array) => {
      return (Array.isArray(a) ? check(a.map((ae,j) => btns[(array.length * (i - 1) + j)])) : a) ||
              check(b.map((ae,j) => btns[(array.length * i + j)]))
    })
    cols = toReduce.reduce((a,b,i,array) => {
      return (Array.isArray(a) ? check(a.map((ae,j) => btns[(array.length * j + (i - 1))])) : a) ||
              check(b.map((ae,j) => btns[(array.length * j + i)]))
    })
    diag1 = check(toReduce.map((ae,i,array) => {
      return btns[(i * array.length + i)]
    }))
    diag2 = check(toReduce.map((ae,i,array) => {
      return btns[(i * array.length + (array.length - 1 - i))]
    }))

    let xInaRow = rows || cols || diag1 || diag2,
        over = this.state.over,
        winner = this.state.winner
    if (xInaRow) {
      over[t] = true
      winner[t].winner = true
      winner[t].mark = xInaRow
      this.setState({winner:winner})
    } else {
      let flag = true
      for (var mark in btns)
        if (btns[mark] === '') flag = false
      if (flag) over[t] = true
    }
    if (over[t]) this.setState({over: over})
    return {over:over,winner:winner}
  }

  gameStateOutput (i) {
    if (this.state.over[i]) {
      return this.state.winner[i].winner ? this.state.winner[i].mark + " WINS!" : "CAT'S GAME"
    } else {
      return this.state.turn[i] ? "Your turn " + this.state.mark[i] : "Wait your turn"
    }
  }

  render() {
    //provides a div that will clear:left to keep tables formatted nicely
    //add: check the amount of columns of games the user's screen size can support and set that as max
    const needsClearingDiv = (i, numGames) => {
      let breakAt = Math.ceil(Math.sqrt(numGames > 2 ? 2 : numGames))
      return i % breakAt === breakAt - 1 ? <div className="clearleft"></div> : ''
    }

    return (
        <div className="boards">
          {this.state.tables.map(function(el, i) {
              let block = <div>
                            <div className="block">
                                <table className={this.state.turn[i] ? "yourturn" : ""}
                                       style={{border:"3px solid " + (this.state.turn[i] ? "springgreen" : "red")}}><tbody>
                                  {this.makeTable(el,i)}
                                </tbody></table>
                                <div className="result">{this.gameStateOutput(i)}</div>
                              </div>
                              {needsClearingDiv(i, this.state.tables.length)}
                          </div>
              return block
            }, this)
          }
        </div>
    )
  }
}

class Disconnect extends Component {
  constructor() {
    super()
    let disconnect = ''
    this.state = {disconnect}
  }

  componentWillMount() {
    let context = this
    socket.on('partner_disconnect', (data) => context.setState({disconnect: <div>Partner Disconnected</div>}))
  }
  render() {
    return <div>{this.state.disconnect}</div>
  }

}

socket.on('start', function(data){
  render(<App data = {data}/>, document.querySelector('#root'))
});