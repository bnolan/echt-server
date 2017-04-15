import React from 'react';
import { Modal, TouchableHighlight, StyleSheet, Image, Text, View } from 'react-native';
import Settings from './settings';
import Shutter from './shutter';

export default class Friends extends React.Component {
  constructor () {
    super();

    this.state = {
      selfies: [],
      pincode: null
    };
  }

  componentDidMount () {
  }

  render () {
    return (
      <View>
        <View>
          <Text>Welcome to Echt!</Text>

          <p>The friendly little shared photo roll app.</p>

          <View style={styles.buttonView}>
            <Text style={styles.buttonText}>Nice to meet you! 😍</Text>
          </View>
        </View>

        <View>
          <Text>How's your hair?</Text>

          <Text>Take a selfie to get started.</Text>

          <View style={styles.selfieCam}>
            <Shutter />
          </View>

          <Text style={styles.small}>
            Echt remembers your face to recognize you, so you don't have
            to enter your email or your phone number.
          </Text>
        </View>

        <View>
          <Text>Styling!</Text>

          <Text>
            Okay, that's your face. Now enter a 4-digit pincode in case you 
            get locked out or buy a new phone.
          </Text>

          <Pincode />
        </View>

        <View>
          <Text>
            Ok here's how it works
          </Text>

          <Text style={styles.hugeEmoji}>💋</Text>

          <Text>
            Echt (it's pronounced like ekt) is a photo
            app. Take a photo and it posts it to your
            special Echt photo roll. Anyone who is your
            friend will be able to see your photos.
          </Text>

          <Text>
            To add a friend, switch to the 🔁 front face camera
            and take a selfie with your friend.
          </Text>

          <Image src={ingoAndBen} />

          <Text>
            When you take the photo, Echt will recognize your friend 
            and send them a friend invite.
          </Text>

          <Text>
            If your friend doesn't use the app yet, you can send
            them an invitation, and after they sign up, we'll
            add you as friends.
          </Text>

          <Text>
            Boom. Instant selfie-friend-making.
          </Text>


      </View>
    );
  }
}

const styles = StyleSheet.create({
  settingsButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4
  }
});
