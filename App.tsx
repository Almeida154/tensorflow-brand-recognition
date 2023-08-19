import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
} from './src/helpers/tensor-helper';

import { cropPicture } from './src/helpers/image-helper';

import { Camera, CameraType, WhiteBalance } from 'expo-camera';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

const RESULT_MAPPING = ['Triangle', 'Circle', 'Square'];

const Main = () => {
  const cameraRef = useRef();
  const [model, setModel] = useState(null);

  const processImagePrediction = async (base64Image) => {
    const croppedData = await cropPicture(base64Image, 300);
    const tensor = await convertBase64ToTensor(croppedData.base64);

    const prediction = await startPrediction(model, tensor);

    const highestPrediction = prediction.indexOf(Math.max.apply(null, prediction));
    console.log(RESULT_MAPPING[highestPrediction]);
  };

  const handleCameraStream = (images, updatePreview, gl) => {
    const loop = async () => {
      if (model === null) return;

      const nextImageTensor = images.next().value;

      processImagePrediction();

      requestAnimationFrame(loop);
    };

    loop();
  };

  const TensorCamera = cameraWithTensors(Camera);

  let textureDims;
  if (Platform.OS === 'ios') {
    textureDims = {
      height: 1920,
      width: 1080,
    };
  } else {
    textureDims = {
      height: 1200,
      width: 1600,
    };
  }

  const initialize = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    await tf.ready();

    const myModel = await getModel(tf);

    setModel(myModel);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <View>
      <TensorCamera
        // Standard Camera props
        style={styles.camera}
        type={CameraType.back}
        // Tensor related props
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={200}
        resizeWidth={152}
        resizeDepth={3}
        onReady={handleCameraStream}
        autorender
        useCustomShadersToResize={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: '100%',
  },
});

export default Main;
