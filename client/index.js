import React, {Component} from 'react'
import {render} from 'react-dom'

class App extends Component {
  render() {
    return (
      <div>
        <Cell />
      </div>
    )
  }
}

class Cell extends Component {
  constructor() {
    super()
    const makeTableArray = (rows, cols) => {
      return rows.map(function(row) {
        return cols.map(function(el) {
          return {id:"btn" + (row * cols.length + el), mark: ""}
        })
      })
    }
    let cells = makeTableArray([0,1,2], [0,1,2]),
        tics = {},
        mark = "X"
    cells.forEach((el) => {
      el.forEach((elem) => {
        tics[elem.id] = ""
      })
    })
    
    this.state = {cells, tics, mark}
  }

  makeX(id) {
    let mark = this.state.mark,
      newState = this.state.tics
    if (this.state.tics[id] === "")
      newState[id] = mark
    this.setState({tics: newState, mark: mark === "X" ? "O" : "X"})
  }

  makeTable() {
    return this.state.cells.map(function(el,i) {
      return <tr>{el.map(function(elem) {
        return (<td>
                <button className="button" ref={elem.id} onClick={() => this.makeX(elem.id)}>
                  {this.state.tics[elem.id]}
                </button>
               </td>)
      }, this)}</tr>
    }, this)
  }
  
  gameState() {
    //check if someone won
    //else if board is full then cat's game
  }

  render() {
    //check if game is over yet here
    return (
        <div>
            <table><tbody>
                {this.makeTable()}
            </tbody></table>
        </div>
    )
  }
}

render(<App />, document.querySelector('#root'))