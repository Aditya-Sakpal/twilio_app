import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device } from '@twilio/voice-sdk';  // Importing the Twilio SDK

@Component({
  selector: 'app-twilio-call',
  templateUrl: './twilio-call.component.html',
  styleUrls: ['./twilio-call.component.scss'],
})
export class TwilioCallComponent implements OnInit {
  // UI bindings
  phoneNumber: string = '+919136885664';  // Input phone number for calling
  callStatus: string = 'Ready to call';  // To show the status
  token: string = '';
  device: Device | undefined;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  // Method to get the token from the server
  getToken(): void {
    this.http.get<{ token: string, identity: string }>('http://localhost:3000/token').subscribe(response => {
      this.token = response.token;
      this.setupTwilioDevice();
    });
  }

  // Method to setup Twilio device
  setupTwilioDevice(): void {
    if (!this.token) {
      console.error('Token is required to initialize the Twilio device');
      this.callStatus = 'Error: Token is missing';
      return;
    }

    try {
      // Initialize the Twilio device with the token
      this.device = new Device(this.token);

      this.device.on('ready', (device: any) => {
        console.log('Twilio device is ready');
        this.callStatus = 'Device is ready';
      });

      this.device.on('error', (error: any) => {
        console.log('Error: ' + error.message);
        this.callStatus = `Error: ${error.message}`;
      });

      this.device.on('connect', (connection: any) => {
        console.log('Call connected');
        this.callStatus = 'Call connected';
      });

      this.device.on('disconnect', (connection: any) => {
        console.log('Call disconnected');
        this.callStatus = 'Call disconnected';
      });
    } catch (error) {
      console.error('Error initializing Twilio device:', error);
      this.callStatus = 'Error initializing device';
    }
  }

  // Make a call to the entered phone number
  makeCall(): void {
    if (this.phoneNumber && this.device) {
      console.log(`Calling ${this.phoneNumber}`);
      this.device.connect({ to: this.phoneNumber });
      this.callStatus = `Calling ${this.phoneNumber}...`;
    } else if (!this.device) {
      console.error('Twilio device is not initialized');
      this.callStatus = 'Error: Twilio device not initialized';
    } else {
      alert('Please enter a phone number');
    }
  }

  // Disconnect the call
  disconnectCall(): void {
    if (this.device) {
      this.device.disconnectAll();
      this.callStatus = 'Call ended';
    }
  }
}
