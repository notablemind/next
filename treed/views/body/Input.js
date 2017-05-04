// just saving this in case I need it later...

export default class Input extends Component {
  focus(at) {
    let pos = this.input.value.length
    switch (this.props.editState) {
      case 'start':
        pos = 0
        break
      case 'end':
      case 'default':
        break
      case 'change':
        this.input.selectionStart = 0
        this.input.selectionEnd = this.input.value.length
        return
      default:
        if (parseInt(this.props.editState) === this.props.editState) {
          pos = this.props.editState
        }
    }
    this.input.selectionStart = this.input.selectionEnd = pos
  }
}
