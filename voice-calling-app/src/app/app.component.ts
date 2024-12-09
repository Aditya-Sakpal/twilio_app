import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  phoneNumber: string = ''; 
  callStatus: string = 'Ready to call';
  callSid: string = '';

  constructor(private http: HttpClient) {}

  makeCall() {
    if (this.phoneNumber) {
      const apiUrl = `${environment.apiUrl}/call`;
      this.http
        .post(apiUrl, { to: this.phoneNumber })
        .subscribe(
          (response: any) => {
            this.callSid = response.callSid;
            this.callStatus = 'Calling...';
            console.log('Call initiated:', response);
            // Start polling to check call status
            this.pollCallStatus();
          },
          (error) => {
            this.callStatus = 'Error initiating call';
            console.error('Error:', error);
          }
        );
    } else {
      alert('Please enter a phone number');
    }
  }

  pollCallStatus() {
    // Poll the backend every 5 seconds to check the call status
    const pollInterval = interval(5000);
    pollInterval.subscribe(() => {
      this.checkCallStatus();
    });
  }

  checkCallStatus() {
    // Fetch the call status from the server
    const statusUrl = `${environment.apiUrl}/call-status/${this.callSid}`;
    this.http.get(statusUrl).subscribe(
      (response: any) => {
        console.log('Call status:', response);
        if (response.status === 'completed') {
          this.callStatus = 'Call ended';
          console.log('Call ended');
        }
      },
      (error) => {
        console.error('Error fetching call status:', error);
      }
    );
  }
}
