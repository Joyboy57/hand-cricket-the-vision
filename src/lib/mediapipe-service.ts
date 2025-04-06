
// MediaPipe service for hand gesture recognition
export class MediaPipeService {
  private hands: any;
  private camera: any;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private gestureCallback: ((gesture: number, handedness: string, isMoving: boolean) => void) | null = null;
  private isCalibrating: boolean = true;
  private isReady: boolean = false;
  private calibrationData: { 
    handSize: number; 
    thumbIndexDist: number;
    fingerAngles: number[];
    knucklePositions: {x: number, y: number}[];
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
  private handednessValue: string = 'Unknown';
  
  // Enhanced fields for improved detection
  private worker: Worker | null = null;
  private isHandMoving: boolean = false;
  private previousLandmarks: any[] = [];
  private movementThreshold: number = 0.015;
  private weightedBuffer: Array<{gesture: number, weight: number, timestamp: number}> = [];
  private calibrationSamples: Array<{
    angles: number[], 
    distances: number[],
    handSize: number,
    knuckles: {x: number, y: number}[]
  }> = [];
  private isProcessingFrame: boolean = false;

  // Type definitions for enhanced gesture recognition
  private readonly FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  
  // Landmark indices for each finger
  private readonly FINGER_LANDMARKS = {
    thumb: [1, 2, 3, 4],
    index: [5, 6, 7, 8],
    middle: [9, 10, 11, 12],
    ring: [13, 14, 15, 16],
    pinky: [17, 18, 19, 20]
  };
  
  // Indices of finger tips
  private readonly FINGER_TIPS = {
    thumb: 4,
    index: 8,
    middle: 12,
    ring: 16,
    pinky: 20
  };
  
  // Indices of PIP joints (middle joints)
  private readonly FINGER_PIPS = {
    thumb: 2,
    index: 6,
    middle: 10,
    ring: 14,
    pinky: 18
  };
  
  // Indices of MCP joints (knuckles)
  private readonly FINGER_MCPS = {
    thumb: 1,
    index: 5,
    middle: 9,
    ring: 13,
    pinky: 17
  };

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
              const handDistance = calculateHandMetrics(landmarks);
              
              self.postMessage({ 
                task: 'angleResults', 
                angles: angles,
                metrics: handDistance,
                moving: moving 
              });
            }
            
            if (task === 'processGesture') {
              const { fingersExtended, calibration, handedness, landmarks } = data;
              const gesture = determineGesture(fingersExtended, landmarks, calibration, handedness);
              self.postMessage({ task: 'gestureResult', gesture });
            }
          };
          
          // Get angle between three points
          function getJointAngle(a, b, c) {
            // Calculate vectors between points
            const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
            const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
            
            // Calculate dot product
            const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
            
            // Calculate magnitudes
            const magV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
            const magV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
            
            // Calculate angle in degrees
            let angle = Math.acos(dotProduct / (magV1 * magV2)) * (180 / Math.PI);
            if (isNaN(angle)) angle = 0;
            
            return angle;
          }
          
          function calculateFingerAngles(landmarks) {
            if (!landmarks || landmarks.length < 21) return [];
            
            const angles = [];
            // Index for each finger's key parts
            const fingerBase = [1, 5, 9, 13, 17]; // MCP joints
            const fingerMiddle = [2, 6, 10, 14, 18]; // PIP joints
            const fingerTip = [4, 8, 12, 16, 20]; // Fingertips
            
            // For each finger
            for (let finger = 0; finger < 5; finger++) {
              // Get the angle at the PIP joint (middle joint)
              const base = landmarks[fingerBase[finger]];
              const middle = landmarks[fingerMiddle[finger]];
              const tip = landmarks[fingerTip[finger]];
              
              const angle = getJointAngle(base, middle, tip);
              angles.push(angle);
            }
            
            return angles;
          }
          
          function calculateHandMetrics(landmarks) {
            if (!landmarks || landmarks.length < 21) return { handSize: 0, distances: [] };
            
            const wrist = landmarks[0];
            const distances = [];
            
            // Calculate distance from wrist to each fingertip
            const fingertips = [4, 8, 12, 16, 20];
            for (const tip of fingertips) {
              const tipPoint = landmarks[tip];
              const distance = Math.hypot(
                tipPoint.x - wrist.x,
                tipPoint.y - wrist.y,
                tipPoint.z - wrist.z
              );
              distances.push(distance);
            }
            
            // Use middle finger length as hand size reference
            const handSize = distances[2];
            
            return { handSize, distances };
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
          
          function isFingerExtended(fingerAngles, fingerIndex, handedness) {
            // Different angle thresholds for thumb vs. other fingers
            const isThumb = fingerIndex === 0;
            const angleThreshold = isThumb ? 150 : 160;
            
            return fingerAngles[fingerIndex] > angleThreshold;
          }
          
          function determineGesture(fingersExtended, landmarks, calibration, handedness) {
            if (!fingersExtended || fingersExtended.length !== 5) return 0;
            
            // Count how many fingers are extended, excluding thumb
            const thumbExtended = fingersExtended[0];
            const nonThumbExtended = fingersExtended.slice(1);
            const nonThumbCount = nonThumbExtended.filter(Boolean).length;
            
            // Special case for thumb only (6)
            if (thumbExtended && nonThumbCount === 0) {
              return 6; // Thumbs up!
            }
            
            // Special case for all five fingers (5)
            if (thumbExtended && nonThumbCount === 4) {
              return 5;
            }
            
            // Special case for all four fingers except thumb (4)
            if (!thumbExtended && nonThumbCount === 4) {
              return 4;
            }
            
            // Cases for 1-3 fingers, only counting non-thumb fingers
            if (nonThumbCount >= 1 && nonThumbCount <= 3) {
              return nonThumbCount;
            }
            
            return 0; // Unknown gesture
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        
        this.worker.onmessage = (e) => {
          const { task, angles, moving, gesture, metrics } = e.data;
          
          if (task === 'angleResults') {
            this.handleAngleCalculationResult(angles, moving, metrics);
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

  private handleAngleCalculationResult(angles: number[], isMoving: boolean, metrics: any) {
    if (this.isCalibrating) {
      // During calibration, store the angles and metrics
      if (metrics && metrics.handSize > 0) {
        this.collectCalibrationSample(angles, metrics);
      }
    } else {
      // During normal operation
      this.isHandMoving = isMoving;
    }
  }

  private collectCalibrationSample(angles: number[], metrics: any) {
    if (!this.calibrationSamples) {
      this.calibrationSamples = [];
    }
    
    // Collect knuckle positions for reference
    const knuckles: {x: number, y: number}[] = [];
    
    this.calibrationSamples.push({
      angles,
      distances: metrics.distances,
      handSize: metrics.handSize,
      knuckles
    });
  }

  private handleGestureResult(gesture: number) {
    if (gesture > 0 && !this.isCalibrating) {
      this.processGestureWithWeightedConfidence(gesture);
    }
  }

  public async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGestureDetected: (gesture: number, handedness: string, isMoving: boolean) => void
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
    const knucklePositions: {x: number, y: number}[] = [];
    let thumbIndexDist = 0;
    let handSize = 0;
    
    for (const sample of this.calibrationSamples) {
      for (let i = 0; i < 5; i++) {
        averageAngles[i] += sample.angles[i] / this.calibrationSamples.length;
      }
      
      // Average hand size
      handSize += sample.handSize / this.calibrationSamples.length;
    }
    
    this.calibrationData = {
      handSize,
      thumbIndexDist: thumbIndexDist * 0.7, // 70% of calibration as threshold
      fingerAngles: averageAngles,
      knucklePositions: knucklePositions
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
      
      // Get handedness (left or right hand)
      const handedness = results.multiHandedness && results.multiHandedness[0] ? 
                         results.multiHandedness[0].label : 'Unknown';
      
      this.handednessValue = handedness;
                         
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
        const currentFingersUp = this.detectFingersExtendedWithAngles(landmarks, handedness);
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
              landmarks: landmarks,
              calibration: this.calibrationData,
              handedness: handedness
            }
          });
        } else {
          // Fallback to direct processing
          const gesture = this.detectImprovedGesture(landmarks, handedness);
          this.processGestureWithWeightedConfidence(gesture);
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
      distances: [thumbIndexDist],
      handSize,
      knuckles: this.FINGER_NAMES.map(name => {
        const mcpIndex = this.FINGER_MCPS[name as keyof typeof this.FINGER_MCPS];
        return { 
          x: landmarks[mcpIndex].x, 
          y: landmarks[mcpIndex].y 
        };
      })
    });
    
    // Update calibration data
    this.calibrationData = {
      handSize,
      thumbIndexDist: thumbIndexDist * 0.7, // 70% of max separation as threshold
      fingerAngles: angles,
      knucklePositions: this.calibrationSamples[0].knuckles
    };
  }

  // Calculate angles between finger segments for all fingers
  private calculateFingerAngles(landmarks: any[]): number[] {
    if (!landmarks || landmarks.length < 21) return [0, 0, 0, 0, 0];
    
    const angles = [];
    
    // For each finger
    for (let finger = 0; finger < 5; finger++) {
      const fingerName = this.FINGER_NAMES[finger] as keyof typeof this.FINGER_LANDMARKS;
      const fingerPoints = this.FINGER_LANDMARKS[fingerName];
      
      // Get the MCP, PIP, and tip landmarks
      const mcp = landmarks[fingerPoints[0]];
      const pip = landmarks[fingerPoints[1]];
      const tip = landmarks[fingerPoints[3]];
      
      // Calculate vectors
      const v1 = {
        x: mcp.x - pip.x,
        y: mcp.y - pip.y,
        z: mcp.z - pip.z
      };
      
      const v2 = {
        x: tip.x - pip.x,
        y: tip.y - pip.y,
        z: tip.z - pip.z
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
  private detectFingersExtendedWithAngles(landmarks: any[], handedness: string): boolean[] {
    if (!landmarks || landmarks.length < 21) return [false, false, false, false, false];

    const wrist = landmarks[0];
    const fingers = [];

    // Get the angles we calculated
    const angles = this.calculateFingerAngles(landmarks);
    
    // For each finger, determine if it's extended based on angle thresholds and vertical position
    for (let i = 0; i < 5; i++) {
      const fingerName = this.FINGER_NAMES[i] as keyof typeof this.FINGER_TIPS;
      const tipIndex = this.FINGER_TIPS[fingerName];
      const mcpIndex = this.FINGER_MCPS[fingerName];
      const pipIndex = this.FINGER_PIPS[fingerName];
      
      const angle = angles[i];
      const tip = landmarks[tipIndex];
      const mcp = landmarks[mcpIndex];
      const pip = landmarks[pipIndex];
      
      // A smaller angle indicates a straighter finger (more extended)
      // For thumb (i=0), we need special handling
      if (i === 0) { 
        // For thumb, check position relative to hand orientation
        const isRightHand = handedness === 'Right';
        
        let thumbExtended = false;
        if (isRightHand) {
          thumbExtended = tip.x < pip.x;
        } else {
          thumbExtended = tip.x > pip.x;
        }
        
        // Also check angle - more extended thumb has larger angle
        thumbExtended = thumbExtended && (angle > 150);
        fingers.push(thumbExtended);
      } else {
        // For other fingers, use both angle and position
        // An extended finger is straighter (larger angle) and tip is above MCP
        const isExtended = angle > 160 && tip.y < mcp.y;
        fingers.push(isExtended);
      }
    }
    
    return fingers;
  }

  // Improved weighted confidence-based gesture detection
  private processGestureWithWeightedConfidence(gesture: number): void {
    const now = Date.now();
    
    // Skip processing if no movement is detected and we're not seeing a new gesture
    if (!this.isHandMoving && this.previousLandmarks.length > 0 && 
        this.lastGestureDetected === gesture && gesture > 0) {
      return;
    }
    
    // Add to weighted buffer with time decay
    const weight = 1.0; // Base weight for current detection
    
    // Add new gesture with weight and timestamp
    this.weightedBuffer.push({ gesture, weight, timestamp: now });
    
    // Limit buffer size and remove old entries (older than 1 second)
    this.weightedBuffer = this.weightedBuffer
      .filter(entry => now - entry.timestamp < 1000)
      .slice(-10); // Keep at most the last 10 entries
    
    // Calculate weighted scores for each gesture
    const scores: {[key: number]: number} = {};
    let totalWeight = 0;
    
    // Newer gestures get higher weights
    for (const entry of this.weightedBuffer) {
      // Age-based decay - newer entries have higher weight
      const age = (now - entry.timestamp) / 1000; // Age in seconds
      const timeDecay = Math.max(0, 1 - (age * 0.5)); // Decay by 50% per second
      const finalWeight = entry.weight * timeDecay;
      
      scores[entry.gesture] = (scores[entry.gesture] || 0) + finalWeight;
      totalWeight += finalWeight;
    }
    
    // Find the dominant gesture
    let dominantGesture = 0;
    let highestScore = 0;
    
    for (const [gesture, score] of Object.entries(scores)) {
      const normalizedScore = score / totalWeight;
      if (normalizedScore > highestScore && normalizedScore > 0.6) { // 60% confidence threshold
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
    
    if (dominantGesture > 0) {
      this.gestureConfidence[dominantGesture] = (this.gestureConfidence[dominantGesture] || 0) + 1;
    }
    
    // Update debug info
    this.gestureDebugInfo = `G:${dominantGesture} C:${this.gestureConfidence[dominantGesture] || 0}/${this.gestureThreshold} S:${highestScore.toFixed(2)}`;
    
    // If we've reached the threshold, trigger the callback
    if (this.gestureConfidence[dominantGesture] >= this.gestureThreshold && 
        this.lastGestureDetected !== dominantGesture && 
        dominantGesture > 0) {
      console.log(`Gesture detected: ${dominantGesture} with confidence: ${this.gestureConfidence[dominantGesture]}`);
      this.lastGestureDetected = dominantGesture;
      
      if (this.gestureCallback) {
        this.gestureCallback(dominantGesture, this.handednessValue, this.isHandMoving);
      }
      
      // Reset confidence after triggering
      setTimeout(() => {
        this.lastGestureDetected = 0;
        this.gestureConfidence = {};
        this.weightedBuffer = [];
      }, 1000);
    }
  }

  // FIXED: Completely rewritten gesture detection with clear distinction between scores
  private detectImprovedGesture(landmarks: any[], handedness: string): number {
    if (!landmarks || landmarks.length < 21) return 0;
    
    // Use history to determine the most stable reading of finger positions
    const fingerConsistency = [0, 0, 0, 0, 0];
    
    // Calculate how many frames in history show each finger as extended
    for (const frameFingers of this.fingersExtendedHistory) {
      for (let i = 0; i < 5; i++) {
        if (frameFingers[i]) {
          fingerConsistency[i]++;
        }
      }
    }
    
    // A finger is considered consistently extended if it's extended in most frames
    const historyThreshold = Math.ceil(this.fingersExtendedHistory.length * 0.6); // 60% of frames
    const consistentlyExtended = fingerConsistency.map(count => count >= historyThreshold);
    
    // Score 6: Only thumb is extended (Thumbs up)
    if (consistentlyExtended[0] && !consistentlyExtended[1] && !consistentlyExtended[2] && 
        !consistentlyExtended[3] && !consistentlyExtended[4]) {
      return 6;
    }
    
    // Count non-thumb extended fingers (index through pinky)
    const nonThumbExtendedCount = consistentlyExtended.slice(1).filter(Boolean).length;
    
    // Score 5: All five fingers extended (including thumb)
    if (nonThumbExtendedCount === 4 && consistentlyExtended[0]) {
      return 5;
    }
    
    // Score 4: All four non-thumb fingers extended, thumb not extended
    if (nonThumbExtendedCount === 4 && !consistentlyExtended[0]) {
      return 4;
    }
    
    // Score 1-3: Count of non-thumb fingers extended
    if (nonThumbExtendedCount >= 1 && nonThumbExtendedCount <= 3) {
      return nonThumbExtendedCount;
    }
    
    return 0; // No recognized gesture
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
