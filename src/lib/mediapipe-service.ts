
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
  private readonly gestureThreshold: number = 3; // Need to detect the same gesture multiple times

  constructor() {
    // The actual Hands and Camera initialization will happen when initialize() is called
  }

  public initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGestureDetected: (gesture: number) => void
  ): void {
    if (!window.Hands || !window.Camera) {
      console.error("MediaPipe libraries not loaded yet");
      setTimeout(() => this.initialize(videoElement, canvasElement, onGestureDetected), 500);
      return;
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');
    this.gestureCallback = onGestureDetected;
    
    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1, // Use higher model complexity for better accuracy
      minDetectionConfidence: 0.6, // Lower threshold for faster detection
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results: any) => this.onResults(results));

    this.camera = new window.Camera(this.videoElement, {
      onFrame: async () => {
        if (this.videoElement && this.hands) {
          await this.hands.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480
    });

    this.isReady = true;
    this.camera.start();
    console.log("MediaPipe service initialized");
  }

  public startCalibration(): void {
    this.isCalibrating = true;
    this.calibrationData = null;
    console.log("Calibration started");
    
    // After 5 seconds, end calibration
    setTimeout(() => {
      this.isCalibrating = false;
      console.log("Calibration completed");
    }, 5000);
  }

  public isInitialized(): boolean {
    return this.isReady;
  }

  public stopCamera(): void {
    if (this.camera) {
      this.camera.stop();
    }
  }

  private onResults(results: any): void {
    if (!this.canvasCtx || !this.canvasElement) return;
    
    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw hands
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, 
          { color: '#00FF00', lineWidth: 5 });
        window.drawLandmarks(this.canvasCtx, landmarks, 
          { color: '#FF0000', lineWidth: 2 });
        
        // If we're calibrating, collect calibration data
        if (this.isCalibrating) {
          this.collectCalibrationData(landmarks);
        } 
        // Only detect gestures if not calibrating
        else if (this.gestureCallback) {
          const gesture = this.detectImprovedGesture(landmarks);
          
          // Only trigger callback if we're confident about the gesture
          if (gesture > 0) {
            // Implement confidence-based gesture detection
            this.processGestureWithConfidence(gesture);
          }
        }
      }
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

  // Use confidence-based gesture detection to improve reliability
  private processGestureWithConfidence(gesture: number): void {
    // Reset confidence for other gestures
    for (const key in this.gestureConfidence) {
      if (parseInt(key) !== gesture) {
        this.gestureConfidence[parseInt(key)] = 0;
      }
    }
    
    // Increment confidence for the current gesture
    this.gestureConfidence[gesture] = (this.gestureConfidence[gesture] || 0) + 1;
    
    // If we've reached the threshold, trigger the callback
    if (this.gestureConfidence[gesture] >= this.gestureThreshold && 
        this.lastGestureDetected !== gesture) {
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

  private detectImprovedGesture(landmarks: any[]): number {
    // Improved gesture detection based on the Python reference code
    if (!landmarks || landmarks.length < 21) return 0;
    
    // Get fingertips and joints
    const wrist = landmarks[0];
    const thumbCMC = landmarks[1];
    const thumbMCP = landmarks[2];
    const thumbIP = landmarks[3];
    const thumbTip = landmarks[4];
    
    const indexMCP = landmarks[5];
    const indexPIP = landmarks[6];
    const indexDIP = landmarks[7];
    const indexTip = landmarks[8];
    
    const middleMCP = landmarks[9];
    const middlePIP = landmarks[10];
    const middleDIP = landmarks[11];
    const middleTip = landmarks[12];
    
    const ringMCP = landmarks[13];
    const ringPIP = landmarks[14];
    const ringDIP = landmarks[15];
    const ringTip = landmarks[16];
    
    const pinkyMCP = landmarks[17];
    const pinkyPIP = landmarks[18];
    const pinkyDIP = landmarks[19];
    const pinkyTip = landmarks[20];
    
    // Calculate vectors and distances for better gesture recognition
    // Vector from wrist to middle MCP (palm direction)
    const palmX = middleMCP.x - wrist.x;
    const palmY = middleMCP.y - wrist.y;
    const palmZ = middleMCP.z - wrist.z;
    
    // Check thumb position
    // For thumbs up gesture: thumb needs to be extended upwards and other fingers curled
    const isThumbExtended = this.isThumbUp(thumbTip, thumbIP, wrist, indexMCP);
    
    // Check if each finger is extended
    const isIndexExtended = this.isFingerExtended(indexTip, indexPIP, indexMCP);
    const isMiddleExtended = this.isFingerExtended(middleTip, middlePIP, middleMCP);
    const isRingExtended = this.isFingerExtended(ringTip, ringPIP, ringMCP);
    const isPinkyExtended = this.isFingerExtended(pinkyTip, pinkyPIP, pinkyMCP);
    
    // Count extended fingers (excluding thumb)
    const extendedFingerCount = 
      (isIndexExtended ? 1 : 0) + 
      (isMiddleExtended ? 1 : 0) + 
      (isRingExtended ? 1 : 0) + 
      (isPinkyExtended ? 1 : 0);
    
    // Debug output
    console.log(`Fingers: Thumb: ${isThumbExtended}, Index: ${isIndexExtended}, Middle: ${isMiddleExtended}, Ring: ${isRingExtended}, Pinky: ${isPinkyExtended}`);
    
    // Special case for thumbs up (gesture 6)
    // Thumb must be extended and all other fingers curled
    if (isThumbExtended && extendedFingerCount === 0) {
      return 6;
    }
    
    // Special case for open hand (gesture 5)
    // All fingers must be extended
    if (extendedFingerCount >= 4) {
      return 5;
    }
    
    // For gestures 1-4, return the number of extended fingers
    if (extendedFingerCount > 0 && extendedFingerCount <= 4) {
      return extendedFingerCount;
    }
    
    // Default - no recognized gesture
    return 0;
  }
  
  // Helper method to check if thumb is in the "thumbs up" position
  private isThumbUp(thumbTip: any, thumbIP: any, wrist: any, indexMCP: any): boolean {
    // For thumbs up, the thumb should be pointing upward
    // This means the y-coordinate of the thumb tip should be significantly lower than the thumb IP
    const thumbYDiff = thumbIP.y - thumbTip.y;
    
    // Also thumb should be extended outward from the hand
    // Compare the z-coordinate with the wrist to see if it's pointing toward the camera
    const thumbZDiff = thumbTip.z - wrist.z;
    
    // Check if thumb is extended upward and forward
    return thumbYDiff > 0.1 && Math.abs(thumbZDiff) < 0.1;
  }
  
  // Helper method to check if a finger is extended
  private isFingerExtended(tip: any, pip: any, mcp: any): boolean {
    // A finger is extended if its tip is higher (smaller y) than its PIP joint
    // and the horizontal distance from MCP is significant
    const verticalDist = pip.y - tip.y;
    const horizontalDist = Math.sqrt(
      Math.pow(tip.x - mcp.x, 2) + 
      Math.pow(tip.z - mcp.z, 2)
    );
    
    // For a finger to be considered extended, it should be higher than the PIP joint
    // and have some horizontal distance from the MCP joint
    return verticalDist > 0.05 && horizontalDist > 0.05;
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
