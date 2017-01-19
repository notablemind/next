
import React, {Component} from 'react';
import {css, StyleSheet} from 'aphrodite'

export default class CatalogViewer extends Component {
  state: any
  constructor() {
    super()
    this.state = {
      selected: null,
    }
  }

  render() {
    const {catalog} = this.props
    const keys = Object.keys(catalog)
    return <div>
      {keys.map(key => (
        catalog[key].items.length > 0 &&
        <div className={css(styles.catalogSection)}>
          <div
            className={css(styles.top)}
            onClick={() => this.setState({
              selected: key === this.state.selected ? null : key
            })}
          >
            <div className={css(styles.category)}>
              {catalog[key].name}
            </div>
            <div className={css(styles.count)}>
              {catalog[key].items.length}
            </div>
          </div>

          {key === this.state.selected &&
            <div className={css(styles.sectionItems)}>
              {catalog[key].items.map(item => (
                <div className={css(styles.item)}>
                  {item.title}
                </div>
              ))}
            </div>
          }
        </div>
      ))}
    </div>
  }
}

const styles = StyleSheet.create({

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '5px 10px',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

  count: {
    backgroundColor: '#aaa',
    color: 'black',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80%',
    borderRadius: 3,
  },

  category: {
    flex: 1,
  },

  sectionItems: {
    paddingLeft: 5,
  },

  item: {
    cursor: 'pointer',
    padding: '5px 10px',

    ':hover': {
      backgroundColor: '#eee',
    },
  },

})
