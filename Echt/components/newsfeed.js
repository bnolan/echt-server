/* globals fetch */

import React from 'react';
import { ScrollView, AsyncStorage, TouchableHighlight, StyleSheet, Image, Text, View } from 'react-native';
// Lightbox is ganky and out of date but shows the idea
import Lightbox from 'react-native-lightbox';
import RNFS from 'react-native-fs';
import { CAMERA } from '../constants';

// curl --header "x-devicekey: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiIzMDJmNTkwYi03OTMyLTQ5MGItYTRlMi01ZmQ2ZjFjN2RmNTkiLCJkZXZpY2VJZCI6IjgzMWM1OWQ2LTc2MWUtNDQ2YS1iNGE3LTE1NjE0N2NkZDE5MCIsImlhdCI6MTQ5MDEwOTEyOX0." https://xypqnmu05f.execute-api.us-west-2.amazonaws.com/uat/photos

const endpoint = 'https://xypqnmu05f.execute-api.us-west-2.amazonaws.com/uat';

export default class Newsfeed extends React.Component {
  constructor () {
    super();

    this.state = {
      photos: []
    };
  }

  componentDidMount () {
    this.reload();
  }

  reload () {
    this.setState({
      photos: []
    });

    AsyncStorage.getItem('deviceKey').then((key) => {
      console.log(key);

      fetch(`${endpoint}/photos`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'x-devicekey': key
        }
      }).then(
        (response) => response.json()
      ).then((r) => {
        console.log(r);

        this.setState({
          photos: r.items || []
        });
      });
    });
  }

  takePhoto () {
    const options = {};
    let key;

    AsyncStorage.getItem('deviceKey').then((k) => {
      key = k;

      return this.camera.capture({metadata: options});
    }).then((data) => {
      console.log(data.path);
      return RNFS.readFile(data.path, 'base64');
    }).then((data) => {
      console.log(data.slice(0, 40));
      console.log(data.length);

      const request = {
        image: data,
        camera: CAMERA.FRONT_FACING
      };

      return fetch(`${endpoint}/photos`, {
        method: 'post',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'x-devicekey': key
        },
        body: JSON.stringify(request)
      });
    }).then(
      (response) => response.json()
    ).then((json) => {
      console.log(JSON.stringify(json));
    }).catch(err => console.error(err));
  }

  render () {
    const photos = this.state.photos.map((photo) => {
      return (
        <View style={styles.item} key={photo.uuid}>
          <Lightbox
            activeProps={{
              width: 400,
              height: 400,
              source: {uri: photo.original.url}
            }}>
            <Image
              style={{width: 120, height: 120}}
              source={{uri: photo.small.url}}
            />
          </Lightbox>
        </View>
      );
    });

    return (
      <ScrollView style={styles.container}>
        <View style={styles.wrapper}>
          <View style={styles.item}>
            <TouchableHighlight onPress={(e) => this.reload()}>
              <View style={styles.date}>
                <Text style={styles.dateText}>03.03</Text>
              </View>
            </TouchableHighlight>
          </View>

          {photos}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  item: {
    width: 120,
    height: 120,
    flex: 0
  },
  shutter: {
    borderWidth: 4,
    borderColor: 'white',
    width: 64,
    height: 64,
    borderRadius: 64,
    marginTop: 500
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  slide1: {
    flex: 1,
    backgroundColor: '#ff00aa'
  },
  slide2: {
    flex: 1,
    backgroundColor: '#97CAE5',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  date: {
    width: 120,
    height: 120,
    padding: 20,
    backgroundColor: '#777'
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  container: {
    backgroundColor: '#fff',
    flexDirection: 'column'
  }
});
