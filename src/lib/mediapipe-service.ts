
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
          if (gesture > 0) {
            this.gestureCallback(gesture);
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
    
    // Check if each finger is extended
    // For this gesture recognition, we'll use y-coordinate comparison
    // A finger is extended if its tip is higher (smaller y) than its PIP joint
    
    // Thumb is special - check if it's extended outward
    // For right hand, extended thumb has smaller x than wrist
    const isThumbExtended = thumbTip.x < wrist.x;
    
    // For fingers, extended means tip is higher (smaller y) than middle joint
    const isIndexExtended = indexTip.y < indexPIP.y;
    const isMiddleExtended = middleTip.y < middlePIP.y;
    const isRingExtended = ringTip.y < ringPIP.y;
    const isPinkyExtended = pinkyTip.y < pinkyPIP.y;
    
    // Count extended fingers (excluding thumb)
    const extendedFingerCount = 
      (isIndexExtended ? 1 : 0) + 
      (isMiddleExtended ? 1 : 0) + 
      (isRingExtended ? 1 : 0) + 
      (isPinkyExtended ? 1 : 0);
    
    // Special case for thumbs up (gesture 6)
    if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 6;
    }
    
    // Special case for open hand (gesture 5)
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
