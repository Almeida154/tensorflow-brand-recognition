import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { Camera, CameraType } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// initialisation of the new camera outside of the component
const TensorCamera = cameraWithTensors(Camera);

const initializeTensorflow = async () => {
  await tf.ready();
  tf.getBackend();
};

export default function App() {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [net, setNet] = useState<mobilenet.MobileNet>();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // initialise Tensorflow
      await initializeTensorflow();
      // load the model
      setNet(await mobilenet.load());
    })();
  }, []);

  const handleCameraStream = (images: IterableIterator<tf.Tensor3D>) => {
    const loop = async () => {
      if (net) {
        const nextImageTensor = images.next().value;
        if (nextImageTensor) {
          const objects = await net.classify(nextImageTensor);
          console.log(objects.map((object) => object.className));
          tf.dispose([nextImageTensor]);
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  if (!net) {
    return <Text>Model not loaded</Text>;
  }

  const textureDims =
    Platform.OS === 'ios'
      ? {
          height: 1920,
          width: 1080,
        }
      : {
          height: 1200,
          width: 1600,
        };

  return (
    <View style={styles.container}>
      <TensorCamera
        style={styles.camera}
        type={CameraType.back}
        onReady={handleCameraStream}
        resizeHeight={200}
        resizeWidth={152}
        resizeDepth={3}
        autorender
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        useCustomShadersToResize={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
});
