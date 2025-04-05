// MediaPipe service for hand gesture recognition
export class MediaPipeService {
  private hands: any;
  private camera: any;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private gestureCallback: ((gesture: number) => void) | null = null;
  private isCalibrating: boolean = true;
  private isReady: boolean = false;
  private calibrationData: { handSize: number; thumbIndexDist: number } | null = null;
  private lastGestureDetected: number = 0;
  private gestureConfidence: { [key: number]: number } = {};
  private readonly gestureThreshold: number = 3; // Increased threshold for more stable detection
  private lastFrameProcessed: number = 0;
  private processingFrameRate: number = 15; // Adjusted for better balance of performance/accuracy
  private lastLandmarkTime: number = 0;
  private isCameraRunningFlag: boolean = false;
  private fingersUp: boolean[] = [false, false, false, false, false];
  private gestureDebugInfo: string = '';
  private cameraStartedSuccessfully: boolean = false;
  private fingersExtendedHistory: boolean[][] = [];
  private historyMaxLength: number = 5; // Track last 5 frames for stability

  constructor() {
    // The actual Hands and Camera initialization will happen when initialize() is called
  }

  public async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGestureDetected: (gesture: number) => void
  ): Promise<boolean> {
    if (!window.Hands || !window.Camera) {
      console.error("MediaPipe libraries not loaded yet");
      return false;
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
    this.gestureCallback = onGestureDetected;
    
    // Create the hands object with optimized settings
    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    // Optimize for better reliability
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1, // Use medium complexity for better detection
      minDetectionConfidence: 0.6, // Increased for more stable detection
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results: any) => this.onResults(results));

    // Initialize camera
    try {
      const initialized = await this.initializeCamera();
      this.isReady = initialized;
      console.log("MediaPipe service initialized", initialized);
      return initialized;
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
      return false;
    }
  }
  
  private async initializeCamera(): Promise<boolean> {
    try {      
      if (this.videoElement) {
        this.camera = new window.Camera(this.videoElement, {
          onFrame: async () => {
            // Only process frames at specified frame rate to improve performance
            const now = Date.now();
            if (now - this.lastFrameProcessed > 1000 / this.processingFrameRate) {
              this.lastFrameProcessed = now;
              if (this.videoElement && this.hands) {
                try {
                  await this.hands.send({ image: this.videoElement });
                } catch (err) {
                  console.error("Error sending frame to MediaPipe:", err);
                }
              }
            }
          },
          width: 640,
          height: 480
        });
        
        try {
          await this.camera.start();
          this.isCameraRunningFlag = true;
          this.cameraStartedSuccessfully = true;
          console.log("Camera started successfully");
          return true;
        } catch (err) {
          console.error("Camera start error:", err);
          this.isCameraRunningFlag = false;
          return false;
        }
      }
      return false;
    } catch (err) {
      console.error("Camera initialization error:", err);
      this.isCameraRunningFlag = false;
      return false;
    }
  }
  
  public isCameraRunning(): boolean {
    return this.isCameraRunningFlag;
  }
  
  public isInitialized(): boolean {
    return this.isReady;
  }

  public getDebugInfo(): string {
    return this.gestureDebugInfo;
  }
  
  public startCalibration(): void {
    this.isCalibrating = true;
    this.calibrationData = null;
    // Reset all gesture confidence levels
    this.gestureConfidence = {};
    this.lastGestureDetected = 0;
    this.fingersExtendedHistory = [];
    console.log("Calibration started");
    
    // After 5 seconds, end calibration
    setTimeout(() => {
      this.isCalibrating = false;
      console.log("Calibration completed");
    }, 5000);
  }

  public stopCamera(): void {
    if (!this.cameraStartedSuccessfully) return; // Don't stop if never started successfully
    
    this.isCameraRunningFlag = false;
    
    if (this.camera) {
      this.camera.stop();
    }
  }

  private onResults(results: any): void {
    this.lastLandmarkTime = Date.now();
    
    if (!this.canvasCtx || !this.canvasElement) return;
    
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw camera feed (mirrored)
    if (this.videoElement) {
      this.canvasCtx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    // Draw hands with improved visibility
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections with increased visibility
        window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, 
          { color: '#22c55e', lineWidth: 3 });
        
        // Draw landmarks with different colors for better visualization
        window.drawLandmarks(this.canvasCtx, landmarks.slice(0, 5), // Thumb landmarks
          { color: '#f59e0b', lineWidth: 2, radius: 4 });
        
        window.drawLandmarks(this.canvasCtx, landmarks.slice(5, 9), // Index finger
          { color: '#ef4444', lineWidth: 2, radius: 4 });
          
        window.drawLandmarks(this.canvasCtx, landmarks.slice(9, 13), // Middle finger
          { color: '#3b82f6', lineWidth: 2, radius: 4 });
          
        window.drawLandmarks(this.canvasCtx, landmarks.slice(13, 17), // Ring finger
          { color: '#8b5cf6', lineWidth: 2, radius: 4 });
          
        window.drawLandmarks(this.canvasCtx, landmarks.slice(17, 21), // Pinky
          { color: '#ec4899', lineWidth: 2, radius: 4 });
        
        // If we're calibrating, collect calibration data
        if (this.isCalibrating) {
          this.collectCalibrationData(landmarks);
        } 
        // Only detect gestures if not calibrating
        else if (this.gestureCallback) {
          // First detect which fingers are extended
          const currentFingersUp = this.detectFingersUp(landmarks);
          this.fingersUp = currentFingersUp;
          
          // Add to history for stability
          this.fingersExtendedHistory.push(currentFingersUp);
          if (this.fingersExtendedHistory.length > this.historyMaxLength) {
            this.fingersExtendedHistory.shift();
          }
          
          // Now detect the gesture based on finger positions with history-based stability
          const gesture = this.detectImprovedGesture(landmarks);
          
          // Only trigger callback if we're confident about the gesture
          if (gesture > 0) {
            // Implement confidence-based gesture detection
            this.processGestureWithConfidence(gesture);
          }
        }
      }
    }

    // Add debug overlay if calibration is complete
    if (!this.isCalibrating && this.calibrationData && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Show current detected fingers
      const fingerLabels = ['👍', '☝️', '✌️', '🤟', '✋', '👌'];
      this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.canvasCtx.fillRect(10, 10, 120, 60);
      this.canvasCtx.font = '16px Arial';
      this.canvasCtx.fillStyle = 'white';
      this.canvasCtx.fillText('Fingers: ' + this.fingersUp.map(f => f ? '1' : '0').join(''), 20, 30);
      
      // Show the current detected gesture
      const gesture = this.lastGestureDetected;
      const gestureText = gesture > 0 ? fingerLabels[gesture - 1] + ' ' + gesture : 'None';
      this.canvasCtx.fillText('Gesture: ' + gestureText, 20, 50);
    }
    
    this.canvasCtx.restore();
  }

  private collectCalibrationData(landmarks: any[]): void {
    if (!landmarks || landmarks.length < 21) return;
    
    // Calculate hand size (distance from wrist to middle finger tip)
    const wrist = landmarks[0];
    const middleTip = landmarks[12];
    const handSize = Math.sqrt(
      Math.pow(middleTip.x - wrist.x, 2) + 
      Math.pow(middleTip.y - wrist.y, 2) + 
      Math.pow(middleTip.z - wrist.z, 2)
    );
    
    // Calculate thumb-index separation
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2) + 
      Math.pow(thumbTip.z - indexTip.z, 2)
    );
    
    this.calibrationData = {
      handSize,
      thumbIndexDist: thumbIndexDist * 0.7 // 70% of max separation as threshold
    };
  }

  // Improved confidence-based gesture detection system
  private processGestureWithConfidence(gesture: number): void {
    // Reset confidence for other gestures
    for (const key in this.gestureConfidence) {
      if (parseInt(key) !== gesture) {
        this.gestureConfidence[parseInt(key)] = 0;
      }
    }
    
    // Increment confidence for the current gesture
    this.gestureConfidence[gesture] = (this.gestureConfidence[gesture] || 0) + 1;
    
    // Update debug info
    this.gestureDebugInfo = `Gesture ${gesture}: Confidence ${this.gestureConfidence[gesture]}/${this.gestureThreshold}`;
    
    // If we've reached the threshold, trigger the callback
    if (this.gestureConfidence[gesture] >= this.gestureThreshold && 
        this.lastGestureDetected !== gesture) {
      console.log(`Gesture detected: ${gesture} with confidence: ${this.gestureConfidence[gesture]}`);
      this.lastGestureDetected = gesture;
      
      if (this.gestureCallback) {
        this.gestureCallback(gesture);
      }
      
      // Reset confidence after triggering
      setTimeout(() => {
        // Reset lastGestureDetected after a delay to allow for new gesture detection
        this.lastGestureDetected = 0;
        this.gestureConfidence = {};
      }, 1000);
    }
  }

  // Detect which fingers are extended (up)
  private detectFingersUp(landmarks: any[]): boolean[] {
    if (!landmarks || landmarks.length < 21) return [false, false, false, false, false];

    // Define indices for the tips and pips of each finger
    const tipIds = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky tips
    const pipIds = [2, 6, 10, 14, 18]; // Second joints
    const mcpIds = [1, 5, 9, 13, 17]; // Knuckles
    
    const fingers = [];
    const wrist = landmarks[0];
    
    // Special case for thumb due to its different orientation
    const thumbIp = landmarks[3];  // IP joint
    const thumbTip = landmarks[4]; // Tip
    const thumbMcp = landmarks[2]; // MCP joint
    
    // Calculate thumb extension using the 3D coordinates and angle
    // For thumb, check if tip is to the left/right of IP joint based on wrist position
    const isRightHand = landmarks[17].x < landmarks[5].x; // Check if pinky is left of index knuckle
    
    // For thumb, check if it's extended away from palm
    let thumbExtended = false;
    
    if (isRightHand) {
      // Right hand - thumb is extended if tip is to the left of the IP joint
      thumbExtended = thumbTip.x < thumbIp.x;
    } else {
      // Left hand - thumb is extended if tip is to the right of the IP joint
      thumbExtended = thumbTip.x > thumbIp.x;
    }
    
    // Also check vertical position - thumb should be higher than base
    thumbExtended = thumbExtended && (thumbTip.y < thumbMcp.y);
    
    fingers.push(thumbExtended);
    
    // For the four fingers - enhanced detection
    for (let i = 1; i < 5; i++) {
      const tipId = tipIds[i];
      const pipId = pipIds[i];
      const mcpId = mcpIds[i];
      
      // A finger is considered extended if:
      // 1. The tip is higher (lower y value) than the PIP joint
      // 2. The tip is higher than the MCP (knuckle)
      // 3. The tip is significantly in front of the PIP (z-axis extension)
      
      const tipAbovePip = landmarks[tipId].y < landmarks[pipId].y;
      const tipAboveMcp = landmarks[tipId].y < landmarks[mcpId].y;
      const tipInFrontOfPip = landmarks[tipId].z < landmarks[pipId].z - 0.05; // Z values are negative as they go towards the camera
      
      const fingerExtended = tipAbovePip && tipAboveMcp;
      fingers.push(fingerExtended);
    }
    
    return fingers;
  }

  // FIXED: Completely rewritten gesture detection with clear distinction between 4 and 5
  private detectImprovedGesture(landmarks: any[]): number {
    if (!landmarks || landmarks.length < 21) return 0;
    
    // Use history to determine the most stable reading of finger positions
    // Calculate how many frames in history show each finger as extended
    const fingerConsistency = [0, 0, 0, 0, 0];
    
    for (const frameFingers of this.fingersExtendedHistory) {
      for (let i = 0; i < 5; i++) {
        if (frameFingers[i]) {
          fingerConsistency[i]++;
        }
      }
    }
    
    // A finger is considered consistently extended if it's extended in the majority of frames
    const consistentlyExtended = fingerConsistency.map(count => 
      count >= Math.ceil(this.fingersExtendedHistory.length / 2)
    );
    
    // For thumbs up (gesture 6) - only thumb is extended
    if (consistentlyExtended[0] && !consistentlyExtended[1] && !consistentlyExtended[2] && 
        !consistentlyExtended[3] && !consistentlyExtended[4]) {
      return 6; // Thumbs up
    }
    
    // FIXED: Clear distinction between gestures 4 and 5
    // Count of extended fingers (excluding thumb)
    const nonThumbExtendedCount = consistentlyExtended.slice(1).filter(Boolean).length;
    
    // For gesture 5 (all 5 fingers) - must have thumb AND all four fingers extended
    if (nonThumbExtendedCount === 4 && consistentlyExtended[0]) {
      this.gestureDebugInfo = "Detected Score 5: All five fingers extended including thumb";
      return 5;
    }
    
    // For gesture 4 - all four non-thumb fingers extended, but NOT thumb
    if (nonThumbExtendedCount === 4 && !consistentlyExtended[0]) {
      this.gestureDebugInfo = "Detected Score 4: All four regular fingers extended, thumb closed";
      return 4;
    }
    
    // For gestures 1-3 - count the non-thumb fingers
    if (nonThumbExtendedCount >= 1 && nonThumbExtendedCount <= 3) {
      return nonThumbExtendedCount;
    }
    
    // Default case - no recognized gesture
    return 0;
  }
}

// Add global type declarations for MediaPipe
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export const mediaPipeService = new MediaPipeService();
