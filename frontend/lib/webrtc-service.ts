import { io, Socket } from 'socket.io-client';

type PeerConnection = RTCPeerConnection;
type MediaStream = MediaStream;

// Configuration for WebRTC
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private apiUrl: string;
  private roomId: string | null = null;
  private userId: string | null = null;
  private userToken: string | null = null;
  
  // Callbacks
  private onRemoteStreamCallbacks: ((stream: MediaStream, userId: string) => void)[] = [];
  private onUserJoinedCallbacks: ((userId: string, username: string) => void)[] = [];
  private onUserLeftCallbacks: ((userId: string) => void)[] = [];
  private onMessageCallbacks: ((message: any) => void)[] = [];
  private onConnectionStateChangeCallbacks: ((state: string) => void)[] = [];
  private onRecordingStartedCallbacks: (() => void)[] = [];
  private onRecordingStoppedCallbacks: (() => void)[] = [];
  
  constructor(apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') {
    this.apiUrl = apiUrl;
  }
  
  // Connect to signaling server
  public connect(sessionId: string, token: string) {
    if (this.socket) {
      console.warn('Socket already connected');
      return;
    }
    
    this.roomId = `session:${sessionId}`;
    this.userToken = token;
    
    this.socket = io(`${this.apiUrl}/webrtc`, {
      auth: {
        token,
      },
      path: '/socket.io',
    });
    
    this.setupSocketListeners();
    
    // Join session room
    this.socket.emit('join-session', { sessionId });
    
    // Update connection state
    this.emitConnectionStateChange('connecting');
  }
  
  // Disconnect from signaling server
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
    
    // Stop local streams
    this.stopLocalStream();
    this.stopScreenShare();
    
    // Update connection state
    this.emitConnectionStateChange('disconnected');
  }
  
  // Start local media stream (camera & microphone)
  public async startLocalStream(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream> {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      // Stop any existing stream
      this.stopLocalStream();
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } : false,
        audio: audioEnabled,
      });
      
      // Add local stream to all peer connections
      this.peerConnections.forEach((pc, userId) => {
        this.addStreamToPeerConnection(pc, this.localStream!);
      });
      
      return this.localStream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      throw error;
    }
  }
  
  // Stop local media stream
  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }
  
  // Toggle local video track
  public toggleVideo(enabled: boolean): boolean {
    if (!this.localStream) return false;
    
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;
    
    videoTracks.forEach((track) => {
      track.enabled = enabled;
    });
    
    return true;
  }
  
  // Toggle local audio track
  public toggleAudio(enabled: boolean): boolean {
    if (!this.localStream) return false;
    
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;
    
    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });
    
    return true;
  }
  
  // Start screen sharing
  public async startScreenShare(): Promise<MediaStream> {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported in this browser');
      }
      
      // Stop any existing screen share
      this.stopScreenShare();
      
      // Get screen share media
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as any,
        audio: false,
      });
      
      // Add screen stream to all peer connections
      this.peerConnections.forEach((pc, userId) => {
        this.addStreamToPeerConnection(pc, this.screenStream!);
      });
      
      // Handle when user stops screen sharing via browser UI
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
      
      return this.screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }
  
  // Stop screen sharing
  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.screenStream = null;
      
      // Re-add local stream to peer connections
      if (this.localStream) {
        this.peerConnections.forEach((pc, userId) => {
          this.addStreamToPeerConnection(pc, this.localStream!);
        });
      }
    }
  }
  
  // Start recording session
  public startRecording(sessionId: string) {
    if (!this.socket) return;
    
    this.socket.emit('start-recording', { sessionId });
  }
  
  // Stop recording session
  public stopRecording(sessionId: string) {
    if (!this.socket) return;
    
    this.socket.emit('stop-recording', { sessionId });
  }
  
  // Send chat message
  public sendMessage(message: string) {
    if (!this.socket || !this.roomId) return;
    
    this.socket.emit('message', {
      roomId: this.roomId,
      content: message,
    });
  }
  
  // Event listeners
  public onRemoteStream(callback: (stream: MediaStream, userId: string) => void) {
    this.onRemoteStreamCallbacks.push(callback);
    return this;
  }
  
  public onUserJoined(callback: (userId: string, username: string) => void) {
    this.onUserJoinedCallbacks.push(callback);
    return this;
  }
  
  public onUserLeft(callback: (userId: string) => void) {
    this.onUserLeftCallbacks.push(callback);
    return this;
  }
  
  public onMessage(callback: (message: any) => void) {
    this.onMessageCallbacks.push(callback);
    return this;
  }
  
  public onConnectionStateChange(callback: (state: string) => void) {
    this.onConnectionStateChangeCallbacks.push(callback);
    return this;
  }
  
  public onRecordingStarted(callback: () => void) {
    this.onRecordingStartedCallbacks.push(callback);
    return this;
  }
  
  public onRecordingStopped(callback: () => void) {
    this.onRecordingStoppedCallbacks.push(callback);
    return this;
  }
  
  // Helper method to emit events to all callbacks
  private emitRemoteStream(stream: MediaStream, userId: string) {
    this.onRemoteStreamCallbacks.forEach((callback) => callback(stream, userId));
  }
  
  private emitUserJoined(userId: string, username: string) {
    this.onUserJoinedCallbacks.forEach((callback) => callback(userId, username));
  }
  
  private emitUserLeft(userId: string) {
    this.onUserLeftCallbacks.forEach((callback) => callback(userId));
  }
  
  private emitMessage(message: any) {
    this.onMessageCallbacks.forEach((callback) => callback(message));
  }
  
  private emitConnectionStateChange(state: string) {
    this.onConnectionStateChangeCallbacks.forEach((callback) => callback(state));
  }
  
  private emitRecordingStarted() {
    this.onRecordingStartedCallbacks.forEach((callback) => callback());
  }
  
  private emitRecordingStopped() {
    this.onRecordingStoppedCallbacks.forEach((callback) => callback());
  }
  
  // Socket event handlers
  private setupSocketListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.emitConnectionStateChange('connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      this.emitConnectionStateChange('disconnected');
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emitConnectionStateChange('error');
    });
    
    this.socket.on('user-joined', ({ userId, username, role }) => {
      console.log(`User joined: ${username} (${userId})`);
      this.emitUserJoined(userId, username);
      
      // Create peer connection for new user
      this.createPeerConnection(userId);
    });
    
    this.socket.on('user-left', ({ userId }) => {
      console.log(`User left: ${userId}`);
      this.emitUserLeft(userId);
      
      // Close and remove peer connection
      const pc = this.peerConnections.get(userId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(userId);
      }
    });
    
    this.socket.on('room-users', ({ users }) => {
      console.log('Room users:', users);
      
      // Create peer connections for all existing users
      users.forEach((user) => {
        if (user.userId !== this.userId) {
          this.createPeerConnection(user.userId);
        }
      });
    });
    
    this.socket.on('signal', ({ from, signal }) => {
      console.log('Received signal from:', from);
      
      // Handle incoming WebRTC signaling
      const pc = this.peerConnections.get(from);
      if (!pc) {
        console.warn(`No peer connection for user: ${from}`);
        return;
      }
      
      if (signal.type === 'offer') {
        pc.setRemoteDescription(new RTCSessionDescription(signal))
          .then(() => pc.createAnswer())
          .then((answer) => pc.setLocalDescription(answer))
          .then(() => {
            this.socket!.emit('signal', {
              to: from,
              signal: pc.localDescription,
            });
          })
          .catch((error) => console.error('Error handling offer:', error));
      } else if (signal.type === 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(signal))
          .catch((error) => console.error('Error handling answer:', error));
      } else if (signal.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
          .catch((error) => console.error('Error adding ICE candidate:', error));
      }
    });
    
    this.socket.on('message', (message) => {
      console.log('Received message:', message);
      this.emitMessage(message);
    });
    
    this.socket.on('recording-started', () => {
      console.log('Recording started');
      this.emitRecordingStarted();
    });
    
    this.socket.on('recording-stopped', () => {
      console.log('Recording stopped');
      this.emitRecordingStopped();
    });
  }
  
  // Create and setup a new peer connection
  private createPeerConnection(userId: string): PeerConnection {
    console.log(`Creating peer connection for user: ${userId}`);
    
    // Check if RTCPeerConnection is available
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC is not supported in this browser');
    }
    
    // If there's already a connection, close it
    const existingPc = this.peerConnections.get(userId);
    if (existingPc) {
      existingPc.close();
    }
    
    // Create new peer connection
    const pc = new RTCPeerConnection(rtcConfig);
    this.peerConnections.set(userId, pc);
    
    // Add local stream if available
    if (this.localStream) {
      this.addStreamToPeerConnection(pc, this.localStream);
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('signal', {
          to: userId,
          signal: { candidate: event.candidate },
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state (${userId}):`, pc.connectionState);
    };
    
    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state (${userId}):`, pc.iceConnectionState);
    };
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${userId}:`, event.track.kind);
      this.emitRemoteStream(event.streams[0], userId);
    };
    
    // Initiate connection if we're the initiator
    // (Simple deterministic logic: lower user ID initiates)
    if (this.userId && this.userId < userId) {
      this.createOffer(pc, userId);
    }
    
    return pc;
  }
  
  // Create and send an offer to a peer
  private createOffer(pc: PeerConnection, userId: string) {
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        if (this.socket && pc.localDescription) {
          this.socket.emit('signal', {
            to: userId,
            signal: pc.localDescription,
          });
        }
      })
      .catch((error) => console.error('Error creating offer:', error));
  }
  
  // Add a media stream to a peer connection
  private addStreamToPeerConnection(pc: PeerConnection, stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }
  
  // Set video quality constraints
  public setVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.localStream) return Promise.resolve();
    
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return Promise.resolve();
    
    const videoTrack = videoTracks[0];
    const constraints: MediaTrackConstraints = {};
    
    switch (quality) {
      case 'low':
        constraints.width = { ideal: 640 };
        constraints.height = { ideal: 360 };
        break;
      case 'medium':
        constraints.width = { ideal: 1280 };
        constraints.height = { ideal: 720 };
        break;
      case 'high':
        constraints.width = { ideal: 1920 };
        constraints.height = { ideal: 1080 };
        break;
    }
    
    return videoTrack.applyConstraints(constraints);
  }
} 