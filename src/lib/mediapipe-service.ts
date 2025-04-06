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
  private calibrationData: { 
    handSize: number; 
    thumbIndexDist: number;
    fingerAngles: number[];
  } | null = null;
  private lastGestureDetected: number = 0;
  private gestureConfidence: { [key: number]: number } = {};
  private readonly gestureThreshold: number = 3;
  private lastFrameProcessed: number = 0;
  private processingFrameRate: number = 15;
  private lastLandmarkTime: number = 0;
  private isCameraRunningFlag: boolean = false;
  private fingersUp: boolean[] = [false, false, false, false, false];
  private gestureDebugInfo: string = '';
  private cameraStartedSuccessfully: boolean = false;
  private fingersExtendedHistory: boolean[][] = [];
  private historyMaxLength: number = 5;
  
  // New fields for enhanced detection
  private worker: Worker | null = null;
  private isHandMoving: boolean = false;
  private previousLandmarks: any[] = [];
  private movementThreshold: number = 0.01;
  private weightedBuffer: Array<{gesture: number, weight: number}> = [];
  private calibrationSamples: Array<{angles: number[], distance: number}> = [];
  private isProcessingFrame: boolean = false;

  constructor() {
    // The actual Hands and Camera initialization will happen when initialize() is called
    this.initializeWebWorker();
  }

  // Initialize web worker for offloading calculations
  private initializeWebWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { task, data } = e.data;
            
            if (task === 'calculateAngles') {
              const landmarks = data.landmarks;
              const angles = calculateFingerAngles(landmarks);
              const moving = detectMotion(landmarks, data.previous, data.threshold);
              
              self.postMessage({ 
                task: 'angleResults', 
                angles: angles,
                moving: moving 
              });
            }
            
            if (task === 'processGesture') {
              const { fingersExtended, calibration } = data;
              const gesture = determineGesture(fingersExtended, calibration);
              self.postMessage({ task: 'gestureResult', gesture });
            }
          };
          
          function calculateFingerAngles(landmarks) {
            if (!landmarks || landmarks.length < 21) return [];
            
            const angles = [];
            // Wrist is landmark[0]
            // For each finger
            for (let finger = 0; finger < 5; finger++) {
              const baseIndex = finger === 0 ? 1 : (finger * 4) + 1;  // Thumb has different structure
              const midIndex = baseIndex + 1;
              const tipIndex = baseIndex + 2;
              
              const base = landmarks[baseIndex];
              const mid = landmarks[midIndex];
              const tip = landmarks[tipIndex];
              
              // Calculate vectors
              const v1 = {
                x: mid.x - base.x,
                y: mid.y - base.y,
                z: mid.z - base.z
              };
              
              const v2 = {
                x: tip.x - mid.x,
                y: tip.y - mid.y,
                z: tip.z - mid.z
              };
              
              // Calculate dot product
              const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
              
              // Calculate magnitudes
              const v1Mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
              const v2Mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
              
              // Calculate angle in radians and convert to degrees
              let angle = Math.acos(dotProduct / (v1Mag * v2Mag)) * (180 / Math.PI);
              
              // Handle NaN cases (when vectors are too small)
              if (isNaN(angle)) angle = 0;
              
              angles.push(angle);
            }
            
            return angles;
          }
          
          function detectMotion(current, previous, threshold) {
            if (!previous || !current || previous.length === 0 || current.length === 0) return false;
            
            let totalMovement = 0;
            const samplingPoints = [0, 8, 12, 16, 20]; // Wrist, and all fingertips
            
            for (const point of samplingPoints) {
              if (current[point] && previous[point]) {
                const xDiff = current[point].x - previous[point].x;
                const yDiff = current[point].y - previous[point].y;
                totalMovement += Math.sqrt(xDiff*xDiff + yDiff*yDiff);
              }
            }
            
            return totalMovement > threshold;
          }
          
          function determineGesture(fingersExtended, calibration) {
            if (!fingersExtended || fingersExtended.length !== 5) return 0;
            
            const thumbExtended = fingersExtended[0];
            const nonThumbExtendedCount = fingersExtended.slice(1).filter(Boolean).length;
            
            // Thumbs up (gesture 6)
            if (thumbExtended && nonThumbExtendedCount === 0) {
              return 6;
            }
            
            // All 5 fingers (gesture 5)
            if (nonThumbExtendedCount === 4 && thumbExtended) {
              return 5;
            }
            
            // 4 fingers (gesture 4)
            if (nonThumbExtendedCount === 4 && !thumbExtended) {
              return 4;
            }
            
            // 1-3 fingers
            if (nonThumbExtendedCount >= 1 && nonThumbExtendedCount <= 3) {
              return nonThumbExtendedCount;
            }
            
            return 0;
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        
        this.worker.onmessage = (e) => {
          const { task, angles, moving, gesture } = e.data;
          
          if (task === 'angleResults') {
            this.handleAngleCalculationResult(angles, moving);
          }
          
          if (task === 'gestureResult') {
            this.handleGestureResult(gesture);
          }
        };
        
        console.log("Web Worker initialized for gesture processing");
      } catch (error) {
        console.error("Failed to initialize web worker:", error);
        this.worker = null;
      }
    } else {
      console.warn("Web Workers not supported in this browser");
      this.worker = null;
    }
  }

  private handleAngleCalculationResult(angles: number[], isMoving: boolean) {
    if (!this.isCalibrating) {
      this.isHandMoving = isMoving;
    }
  }

  private handleGestureResult(gesture: number) {
    if (gesture > 0 && !this.isCalibrating) {
      this.processGestureWithConfidence(gesture);
    }
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
            if (now - this.lastFrameProcessed > 1000 / this.processingFrameRate && !this.isProcessingFrame) {
              this.lastFrameProcessed = now;
              this.isProcessingFrame = true;
              if (this.videoElement && this.hands) {
                try {
                  await this.hands.send({ image: this.videoElement });
                } catch (err) {
                  console.error("Error sending frame to MediaPipe:", err);
                }
                this.isProcessingFrame = false;
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
    this.gestureConfidence = {};
    this.lastGestureDetected = 0;
    this.fingersExtendedHistory = [];
    this.calibrationSamples = [];
    console.log("Calibration started");
    
    // After 5 seconds, end calibration
    setTimeout(() => {
      this.isCalibrating = false;
      this.processCalibrationData();
      console.log("Calibration completed");
    }, 5000);
  }

  private processCalibrationData(): void {
    if (this.calibrationSamples.length === 0) {
      console.warn("No calibration samples collected");
      return;
    }

    // Calculate average angles for reference
    const averageAngles = [0, 0, 0, 0, 0];
    let thumbIndexDist = 0;
    let handSize = 0;
    
    for (const sample of this.calibrationSamples) {
      for (let i = 0; i < 5; i++) {
        averageAngles[i] += sample.angles[i] / this.calibrationSamples.length;
      }
      thumbIndexDist += sample.distance / this.calibrationSamples.length;
    }
    
    handSize = thumbIndexDist * 5; // Approximation based on thumb-index distance
    
    this.calibrationData = {
      handSize,
      thumbIndexDist: thumbIndexDist * 0.7, // 70% of calibration as threshold
      fingerAngles: averageAngles,
    };
    
    console.log("Calibration completed with data:", this.calibrationData);
  }

  public stopCamera(): void {
    if (!this.cameraStartedSuccessfully) return;
    
    this.isCameraRunningFlag = false;
    
    if (this.camera) {
      this.camera.stop();
    }
    
    // Also terminate web worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
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
      const landmarks = results.multiHandLandmarks[0];
      
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
      
      // Offload calculations to web worker if available
      if (this.worker) {
        this.worker.postMessage({
          task: 'calculateAngles',
          data: {
            landmarks: landmarks,
            previous: this.previousLandmarks,
            threshold: this.movementThreshold
          }
        });
      }
      
      // If we're calibrating, collect calibration data
      if (this.isCalibrating) {
        this.collectEnhancedCalibrationData(landmarks);
      } 
      // Only detect gestures if not calibrating
      else if (this.gestureCallback) {
        // First detect which fingers are extended using the vector-angle approach
        const currentFingersUp = this.detectFingersUpWithVectors(landmarks);
        this.fingersUp = currentFingersUp;
        
        // Add to history for stability
        this.fingersExtendedHistory.push(currentFingersUp);
        if (this.fingersExtendedHistory.length > this.historyMaxLength) {
          this.fingersExtendedHistory.shift();
        }
        
        // Use web worker for gesture processing if available
        if (this.worker) {
          this.worker.postMessage({
            task: 'processGesture',
            data: {
              fingersExtended: currentFingersUp,
              calibration: this.calibrationData
            }
          });
        } else {
          // Fallback to direct processing
          const gesture = this.detectImprovedGesture(landmarks);
          this.processGestureWithConfidence(gesture);
        }
      }
      
      // Update previous landmarks for motion detection
      this.previousLandmarks = [...landmarks];
    }

    // Add debug overlay if calibration is complete
    if (!this.isCalibrating && this.calibrationData && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Show current detected fingers
      const fingerLabels = ['👍', '☝️', '✌️', '🤟', '✋', '👌'];
      this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.canvasCtx.fillRect(10, 10, 150, 80);
      this.canvasCtx.font = '16px Arial';
      this.canvasCtx.fillStyle = 'white';
      this.canvasCtx.fillText('Fingers: ' + this.fingersUp.map(f => f ? '1' : '0').join(''), 20, 30);
      
      // Show the current detected gesture
      const gesture = this.lastGestureDetected;
      const gestureText = gesture > 0 ? fingerLabels[gesture - 1] + ' ' + gesture : 'None';
      this.canvasCtx.fillText('Gesture: ' + gestureText, 20, 50);
      
      // Show motion status
      this.canvasCtx.fillText('Motion: ' + (this.isHandMoving ? 'Yes' : 'No'), 20, 70);
    }
    
    this.canvasCtx.restore();
  }

  // Enhanced calibration with vector/angle data collection
  private collectEnhancedCalibrationData(landmarks: any[]): void {
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

    // Calculate angles between finger segments
    const angles = this.calculateFingerAngles(landmarks);
    
    // Store sample with rich data
    this.calibrationSamples.push({
      angles,
      distance: thumbIndexDist
    });
    
    // Update calibration data
    this.calibrationData = {
      handSize,
      thumbIndexDist: thumbIndexDist * 0.7, // 70% of max separation as threshold
      fingerAngles: angles
    };
  }

  // Calculate angles between finger segments for all fingers
  private calculateFingerAngles(landmarks: any[]): number[] {
    if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];
    
    const angles = [];
    
    // For each finger
    for (let finger = 0; finger < 5; finger++) {
      const baseIndex = finger === 0 ? 1 : (finger * 4) + 1;  // Thumb has different structure
      const midIndex = baseIndex + 1;
      const tipIndex = baseIndex + 2;
      
      const base = landmarks[baseIndex];
      const mid = landmarks[midIndex];
      const tip = landmarks[tipIndex];
      
      // Calculate vectors
      const v1 = {
        x: mid.x - base.x,
        y: mid.y - base.y,
        z: mid.z - base.z
      };
      
      const v2 = {
        x: tip.x - mid.x,
        y: tip.y - mid.y,
        z: tip.z - mid.z
      };
      
      // Calculate dot product
      const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
      
      // Calculate magnitudes
      const v1Mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
      const v2Mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
      
      // Calculate angle in radians and convert to degrees
      let angle = Math.acos(dotProduct / (v1Mag * v2Mag)) * (180 / Math.PI);
      
      // Handle NaN cases (when vectors are too small)
      if (isNaN(angle)) angle = 0;
      
      angles.push(angle);
    }
    
    return angles;
  }

  // Enhanced finger detection using vector angles
  private detectFingersUpWithVectors(landmarks: any[]): boolean[] {
    if (!landmarks || landmarks.length < 21) return [false, false, false, false, false];

    const tipIds = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky tips
    const mcpIds = [1, 5, 9, 13, 17]; // Knuckles
    const pipIds = [2, 6, 10, 14, 18]; // PIP joints
    
    const wrist = landmarks[0];
    const fingers = [];

    // Get the angles we calculated
    const angles = this.calculateFingerAngles(landmarks);
    
    // For each finger, determine if it's extended based on angle thresholds
    for (let i = 0; i < 5; i++) {
      const angle = angles[i];
      
      // A smaller angle indicates a straighter finger (more extended)
      // For thumb (i=0), we need special handling
      if (i === 0) {
        // For thumb, check horizontal position relative to hand orientation
        const thumbTip = landmarks[tipIds[0]];
        const thumbIp = landmarks[pipIds[0]];
        const isRightHand = landmarks[17].x < landmarks[5].x; // Check pinky vs index position
        
        let thumbExtended = false;
        if (isRightHand) {
          thumbExtended = thumbTip.x < thumbIp.x;
        } else {
          thumbExtended = thumbTip.x > thumbIp.x;
        }
        
        // Combine with angle check - more extended thumb has smaller angle
        thumbExtended = thumbExtended && (angle < 40);
        fingers.push(thumbExtended);
      } else {
        // For other fingers, use both angle and position
        const tipY = landmarks[tipIds[i]].y;
        const mcpY = landmarks[mcpIds[i]].y;
        
        // A finger is extended if:
        // 1. Angle is relatively straight (< 60 degrees)
        // 2. The tip is higher (smaller Y) than the base
        const isExtended = angle < 60 && tipY < mcpY;
        fingers.push(isExtended);
      }
    }
    
    return fingers;
  }

  // Improved confidence-based gesture detection with weighted history
  private processGestureWithConfidence(gesture: number): void {
    // Skip processing if no movement is detected (reduces false positives)
    if (!this.isHandMoving && this.previousLandmarks.length > 0) {
      // Allow initial detection even without motion
      if (this.gestureConfidence[gesture] && this.gestureConfidence[gesture] > 0) {
        this.gestureDebugInfo = `Hand still, waiting for movement`;
        return;
      }
    }
    
    // Add to weighted buffer with time decay
    const now = Date.now();
    const weight = 1.0; // Base weight for current detection
    
    // Add new gesture with weight
    this.weightedBuffer.push({ gesture, weight });
    
    // Limit buffer size
    if (this.weightedBuffer.length > 10) {
      this.weightedBuffer.shift();
    }
    
    // Calculate weighted scores for each gesture
    const scores: {[key: number]: number} = {};
    let totalWeight = 0;
    
    for (const entry of this.weightedBuffer) {
      scores[entry.gesture] = (scores[entry.gesture] || 0) + entry.weight;
      totalWeight += entry.weight;
    }
    
    // Find the dominant gesture
    let dominantGesture = 0;
    let highestScore = 0;
    
    for (const [gesture, score] of Object.entries(scores)) {
      const normalizedScore = score / totalWeight;
      if (normalizedScore > highestScore) {
        highestScore = normalizedScore;
        dominantGesture = parseInt(gesture);
      }
    }
    
    // Update confidence for the dominant gesture
    for (const key in this.gestureConfidence) {
      if (parseInt(key) !== dominantGesture) {
        this.gestureConfidence[parseInt(key)] = 0;
      }
    }
    
    this.gestureConfidence[dominantGesture] = (this.gestureConfidence[dominantGesture] || 0) + 1;
    
    // Update debug info
    this.gestureDebugInfo = `Gesture ${dominantGesture}: Conf ${this.gestureConfidence[dominantGesture]}/${this.gestureThreshold}, Score ${highestScore.toFixed(2)}`;
    
    // If we've reached the threshold, trigger the callback
    if (this.gestureConfidence[dominantGesture] >= this.gestureThreshold && 
        this.lastGestureDetected !== dominantGesture && 
        dominantGesture > 0) {
      console.log(`Gesture detected: ${dominantGesture} with confidence: ${this.gestureConfidence[dominantGesture]}`);
      this.lastGestureDetected = dominantGesture;
      
      if (this.gestureCallback) {
        this.gestureCallback(dominantGesture);
      }
      
      // Reset confidence after triggering
      setTimeout(() => {
        this.lastGestureDetected = 0;
        this.gestureConfidence = {};
        this.weightedBuffer = [];
      }, 1000);
    }
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
