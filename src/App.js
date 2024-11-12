import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [userFaceDescriptors, setUserFaceDescriptors] = useState([]);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(
          process.env.PUBLIC_URL + "/models"
        );
        await faceapi.nets.faceLandmark68Net.loadFromUri(
          process.env.PUBLIC_URL + "/models"
        );
        await faceapi.nets.faceRecognitionNet.loadFromUri(
          process.env.PUBLIC_URL + "/models"
        );
        setIsModelLoaded(true);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  // Debugging: Log the state to ensure the models are loaded
  useEffect(() => {
    console.log("isModelLoaded:", isModelLoaded);
  }, [isModelLoaded]);

  // Capture photo and extract face descriptor for registration
  const handleCapturePhoto = async () => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        setUserFaceDescriptors([detections.descriptor]);
        setIsUserRegistered(true);
        alert("You have registered successfully!");
      } else {
        // Clear existing registration state if no face is detected
        setUserFaceDescriptors([]);
        setIsUserRegistered(false);
        alert("No face detected. Please try again.");
      }
    } else {
      alert("Webcam not ready. Please ensure it's accessible.");
    }
  };

  // Handle login by comparing captured face with registered descriptor
  const handleLogin = async () => {
    if (userFaceDescriptors.length === 0 || !isUserRegistered) {
      alert("No user registered. Please capture your face first.");
      return;
    }

    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const faceMatcher = new faceapi.FaceMatcher(userFaceDescriptors, 0.6);
        const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

        if (bestMatch.label !== "unknown") {
          setIsUserAuthenticated(true);
          alert("Login successful!");
          navigate("/punchedin-successful");
        } else {
          setIsUserAuthenticated(false);
          alert("Authentication failed. No match found.");
        }
      } else {
        alert("No face detected! Please try again.");
      }
    } else {
      alert("Webcam not ready. Please ensure it's accessible.");
    }
  };

  return (
    <div className="App">
      <h1>Facial Recognition Login</h1>

      <div
        className="webcam-container"
        style={{ border: "2px solid black", padding: "10px" }}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
        />
      </div>

      {!isModelLoaded && <p>Loading models...</p>}

      {isModelLoaded && (
        <div className="button-container">
          <button onClick={handleCapturePhoto}>Register Face</button>
          <button onClick={handleLogin}>Login</button>
          {isUserAuthenticated && <h2>Welcome, User!</h2>}
        </div>
      )}
    </div>
  );
}

export default App;
