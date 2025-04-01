
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
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
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
        
        // Only detect gestures if not calibrating
        if (!this.isCalibrating && this.gestureCallback) {
          const gesture = this.detectGesture(landmarks);
          if (gesture > 0) {
            this.gestureCallback(gesture);
          }
        }
      }
    }
    
    this.canvasCtx.restore();
  }

  private detectGesture(landmarks: any[]): number {
    // Simple gesture detection based on finger extension
    if (!landmarks || landmarks.length < 21) return 0;
    
    // Get thumb and finger tips positions
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Get finger base positions
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    const ringBase = landmarks[13];
    const pinkyBase = landmarks[17];
    const wrist = landmarks[0];
    
    // Count extended fingers (simplified algorithm)
    let extendedFingers = 0;
    
    // Check if index finger is extended
    if (indexTip.y < indexBase.y) extendedFingers++;
    
    // Check if middle finger is extended
    if (middleTip.y < middleBase.y) extendedFingers++;
    
    // Check if ring finger is extended
    if (ringTip.y < ringBase.y) extendedFingers++;
    
    // Check if pinky finger is extended
    if (pinkyTip.y < pinkyBase.y) extendedFingers++;
    
    // Check if thumb is extended (separate for score 6)
    const isThumbExtended = thumbTip.x < wrist.x; // For right hand
    
    // Return cricket score based on gesture
    if (isThumbExtended && extendedFingers === 0) return 6;
    return extendedFingers;
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
