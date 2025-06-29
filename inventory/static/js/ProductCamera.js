// import React, { useState, useRef, useEffect } from 'react';
// import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';

// const ProductCamera = ({ onCapture }) => {
//   const videoRef = useRef(null);
//   const [devices, setDevices] = useState([]);
//   const [currentDeviceId, setCurrentDeviceId] = useState('');
//   const [stream, setStream] = useState(null);
//   const [error, setError] = useState('');
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [isCameraActive, setIsCameraActive] = useState(true);

//   // Get available cameras
//   useEffect(() => {
//     const getCameras = async () => {
//       try {
//         // First get permission
//         const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
//         tempStream.getTracks().forEach(track => track.stop());
        
//         // Then enumerate devices
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const videoDevices = devices.filter(device => device.kind === 'videoinput');
//         setDevices(videoDevices);
        
//         if (videoDevices.length > 0) {
//           // Prefer back camera if available
//           const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back'));
//           setCurrentDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
//         }
//       } catch (err) {
//         setError('Camera access denied or not available');
//         console.error('Camera error:', err);
//       }
//     };

//     getCameras();
//   }, []);

//   // Start camera when device is selected
//   useEffect(() => {
//     if (!currentDeviceId) return;

//     const startCamera = async () => {
//       try {
//         // Stop previous stream if exists
//         if (stream) {
//           stream.getTracks().forEach(track => track.stop());
//         }

//         const newStream = await navigator.mediaDevices.getUserMedia({
//           video: { deviceId: { exact: currentDeviceId } }
//         });

//         setStream(newStream);
        
//         if (videoRef.current) {
//           videoRef.current.srcObject = newStream;
//           videoRef.current.play();
//         }
//         setIsCameraActive(true);
//       } catch (err) {
//         setError('Failed to start camera');
//         console.error('Stream error:', err);
//       }
//     };

//     startCamera();

//     return () => {
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [currentDeviceId]);

//   const switchCamera = () => {
//     if (devices.length < 2) return;

//     const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
//     const nextIndex = (currentIndex + 1) % devices.length;
//     setCurrentDeviceId(devices[nextIndex].deviceId);
//   };

//   const capturePhoto = () => {
//     if (!videoRef.current || !isCameraActive) return;

//     const canvas = document.createElement('canvas');
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
    
//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
//     const imageData = canvas.toDataURL('image/jpeg');
//     setCapturedImage(imageData);
//     onCapture(imageData);
//     setIsCameraActive(false);
//   };

//   const retakePhoto = () => {
//     setCapturedImage(null);
//     setIsCameraActive(true);
//   };

//   return (
//     <View style={styles.container}>
//       {error ? (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       ) : capturedImage ? (
//         <View style={styles.previewContainer}>
//           <Image source={{ uri: capturedImage }} style={styles.previewImage} />
//           <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
//             <Text style={styles.buttonText}>Retake</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <>
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted
//             style={styles.cameraPreview}
//           />
//           <View style={styles.controls}>
//             <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
//               <View style={styles.captureInner} />
//             </TouchableOpacity>
            
//             {devices.length > 1 && (
//               <TouchableOpacity style={styles.switchButton} onPress={switchCamera}>
//                 <Text style={styles.buttonText}>Switch Camera</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     width: '100%',
//     backgroundColor: 'black',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   cameraPreview: {
//     width: '100%',
//     height: 400,
//     objectFit: 'cover',
//   },
//   controls: {
//     position: 'absolute',
//     bottom: 20,
//     width: '100%',
//     alignItems: 'center',
//   },
//   captureButton: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     borderWidth: 5,
//     borderColor: 'white',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   captureInner: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'white',
//   },
//   switchButton: {
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 10,
//     borderRadius: 5,
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   previewContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   previewImage: {
//     width: '100%',
//     height: 400,
//     resizeMode: 'contain',
//     backgroundColor: 'black',
//   },
//   retakeButton: {
//     position: 'absolute',
//     bottom: 20,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     padding: 15,
//     borderRadius: 5,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     color: 'white',
//     fontSize: 16,
//     textAlign: 'center',
//   },
// });

// export default ProductCamera;

// const ProductImageSection = ({ capturedImage, setCapturedImage }) => {
//   const [showCamera, setShowCamera] = useState(false);

//   return (
//     <View style={styles.imageSection}>
//       <Text style={styles.sectionTitle}>Product Image</Text>
      
//       {showCamera ? (
//         <View style={styles.cameraContainer}>
//           <ProductCamera onCapture={(imageData) => {
//             setCapturedImage(imageData);
//             setShowCamera(false);
//           }} />
//           <TouchableOpacity 
//             style={styles.cancelButton} 
//             onPress={() => setShowCamera(false)}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <View style={styles.imageControls}>
//           {capturedImage ? (
//             <>
//               <Image 
//                 source={{ uri: capturedImage }} 
//                 style={styles.previewImage} 
//               />
//               <View style={styles.buttonRow}>
//                 <TouchableOpacity 
//                   style={styles.imageButton}
//                   onPress={() => setShowCamera(true)}
//                 >
//                   <Text>Retake Photo</Text>
//                 </TouchableOpacity>
//               </View>
//             </>
//           ) : (
//             <TouchableOpacity 
//               style={styles.imageButton}
//               onPress={() => setShowCamera(true)}
//             >
//               <Text>Take Photo</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       )}
//     </View>
//   );
// };