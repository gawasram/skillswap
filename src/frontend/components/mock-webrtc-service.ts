// Mock WebRTC service for development
// This will be used when the backend server is not available

import { v4 as uuidv4 } from 'uuid';

export class MockWebRTCService {
  private callbacks = {
    remoteStream: [] as any[],
    userJoined: [] as any[],
    userLeft: [] as any[],
    message: [] as any[],
    connectionStateChange: [] as any[],
    recordingStarted: [] as any[],
    recordingStopped: [] as any[],
  };

  private isConnected = false;
  private mockUsers = [
    { id: 'mock-user-1', name: 'Mock User 1' },
    { id: 'mock-user-2', name: 'Mock User 2' },
  ];
  
  constructor() {
    console.log('MockWebRTCService initialized');
  }
  
  public connect(sessionId: string, token: string): Promise<void> {
    console.log(`Mock connect to session ${sessionId} with token ${token}`);
    this.isConnected = true;
    
    // Simulate connection state changes
    this.emitConnectionStateChange('connecting');
    
    setTimeout(() => {
      this.emitConnectionStateChange('connected');
      
      // Simulate users joining
      setTimeout(() => {
        this.mockUsers.forEach(user => {
          this.emitUserJoined(user.id, user.name);
        });
      }, 2000);
      
      // Simulate messages
      setTimeout(() => {
        this.emitMessage({
          sender: this.mockUsers[0].name,
          message: 'Hello from mock user 1!',
          timestamp: new Date(),
        });
      }, 3000);
      
      setTimeout(() => {
        this.emitMessage({
          sender: this.mockUsers[1].name,
          message: 'Hi there from mock user 2!',
          timestamp: new Date(),
        });
      }, 5000);
      
    }, 1000);
    
    return Promise.resolve();
  }
  
  public disconnect(): void {
    console.log('Mock disconnect');
    this.isConnected = false;
    this.emitConnectionStateChange('disconnected');
  }
  
  public async startLocalStream(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream> {
    console.log(`Mock startLocalStream (video: ${videoEnabled}, audio: ${audioEnabled})`);
    // Create an empty media stream for development
    return new MediaStream();
  }
  
  public stopLocalStream(): void {
    console.log('Mock stopLocalStream');
  }
  
  public toggleVideo(enabled: boolean): boolean {
    console.log(`Mock toggleVideo (${enabled})`);
    return enabled;
  }
  
  public toggleAudio(enabled: boolean): boolean {
    console.log(`Mock toggleAudio (${enabled})`);
    return enabled;
  }
  
  public async startScreenShare(): Promise<MediaStream> {
    console.log('Mock startScreenShare');
    return new MediaStream();
  }
  
  public stopScreenShare(): void {
    console.log('Mock stopScreenShare');
  }
  
  public startRecording(sessionId: string): void {
    console.log(`Mock startRecording for session ${sessionId}`);
    this.emitRecordingStarted();
  }
  
  public stopRecording(sessionId: string): void {
    console.log(`Mock stopRecording for session ${sessionId}`);
    this.emitRecordingStopped();
  }
  
  public sendMessage(message: string): void {
    console.log(`Mock sendMessage: ${message}`);
    
    // Echo the message back as if it was from one of the mock users
    setTimeout(() => {
      const randomUser = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
      this.emitMessage({
        sender: randomUser.name,
        message: `Response to: ${message}`,
        timestamp: new Date(),
      });
    }, 1000);
  }
  
  public onRemoteStream(callback: (stream: MediaStream, userId: string) => void): void {
    this.callbacks.remoteStream.push(callback);
  }
  
  public onUserJoined(callback: (userId: string, username: string) => void): void {
    this.callbacks.userJoined.push(callback);
  }
  
  public onUserLeft(callback: (userId: string) => void): void {
    this.callbacks.userLeft.push(callback);
  }
  
  public onMessage(callback: (message: any) => void): void {
    this.callbacks.message.push(callback);
  }
  
  public onConnectionStateChange(callback: (state: string) => void): void {
    this.callbacks.connectionStateChange.push(callback);
    
    // Immediately emit the current state
    if (this.isConnected) {
      callback('connected');
    } else {
      callback('disconnected');
    }
  }
  
  public onRecordingStarted(callback: () => void): void {
    this.callbacks.recordingStarted.push(callback);
  }
  
  public onRecordingStopped(callback: () => void): void {
    this.callbacks.recordingStopped.push(callback);
  }
  
  public async setVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Mock setVideoQuality: ${quality}`);
    return Promise.resolve();
  }
  
  private emitRemoteStream(stream: MediaStream, userId: string): void {
    this.callbacks.remoteStream.forEach(callback => callback(stream, userId));
  }
  
  private emitUserJoined(userId: string, username: string): void {
    this.callbacks.userJoined.forEach(callback => callback(userId, username));
  }
  
  private emitUserLeft(userId: string): void {
    this.callbacks.userLeft.forEach(callback => callback(userId));
  }
  
  private emitMessage(message: any): void {
    this.callbacks.message.forEach(callback => callback(message));
  }
  
  private emitConnectionStateChange(state: string): void {
    this.callbacks.connectionStateChange.forEach(callback => callback(state));
  }
  
  private emitRecordingStarted(): void {
    this.callbacks.recordingStarted.forEach(callback => callback());
  }
  
  private emitRecordingStopped(): void {
    this.callbacks.recordingStopped.forEach(callback => callback());
  }
} 