
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  Linking,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';


export default class ActionBar extends Component {
  constructor(props) {
    super()
    this.state = {
    }
  }
  render() {
    return <View style={styles.container}>
      <Button>
        Add
      </Button>
      <Button>
        Type
      </Button>
      <Button>
        Delete
      </Button>
    </View>
  }
}

const Button = ({children, action}) => (
  <TouchableOpacity style={styles.button} onPress={action}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ddd',
    alignItems: 'center',
    flexDirection: 'row',
  },

  button: {
    padding: 20,
  },

  buttonText: {
    color: '#555',
  },
})
