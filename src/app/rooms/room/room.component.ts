import { Component, OnInit, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as AgoraRTC from 'agora-rtc-sdk';
import { environment } from 'src/environments/environment';
import { combineLatest } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Iroom } from '../rooms.component';
import { take } from 'rxjs/operators';
import { PresenceService } from 'src/app/services/presence.service';
import { DOCUMENT }from '@angular/common';

const randomNames = [
  'Alfred',
  'Tanguy',
  'Baptiste',
  'Julien',
  'Léandre',
  'Florentin',
  'Florentine'
];

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('streamContainer', {static: true})
  public streamContainer?: ElementRef;
  public $onlineList: any;
  private roomId?: string | null;
  private client!: AgoraRTC.Client;
  public room?: Iroom | null;
  private user: any;
  public isHost = false;
  private streamOptions = {
    audio: true,
    video: false,
    streamID: "",
    screen: false
  }
  private localStreams: number[]= [];
  private localStream!: AgoraRTC.Stream;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private db: AngularFireDatabase, private presenceService : PresenceService, @Inject(DOCUMENT) private document: Document){}

  ngOnInit(): void {
    this.roomId = this.activatedRoute.snapshot.paramMap.get('id');
    this.initClient();
    this.joinRoom();
  }
  ngOnDestroy(): void {
    this.presenceService.setPresenceOffline(
      {key: this.user.uid},
      this.roomId
    );
    this.client.leave()
  }
  private initClient(): void {
    this.client = AgoraRTC.createClient({
      mode: 'live',
      codec: 'vp8'
    });
    this.client.init(environment.agoraAppId);
  }
  private joinRoom(): void {
    combineLatest([
      this.auth.authState,
      this.db.object<Iroom>(`rooms/${this.roomId}`).valueChanges()
    ]).pipe(take(1))
    .subscribe({
      next: ([user, room])=>{
        this.user = user;
        this.room = room;
        this.isHost = this.user.uid === this.room?.host;
        this.client?.setClientRole(this.isHost ? 'host':'audience');
        this.presenceService.setPresenceOnline({
          displayName: randomNames[Math.floor(Math.random()*randomNames.length)],
          key: this.user.uid
        },this.roomId).pipe(take(1)).subscribe();
        this.joinStream();
      }
    })
  }
  public joinStream(): void{
    this.streamOptions.streamID = this.roomId == null ? "" : this.roomId;
    this.client.join(
      'token_agora.io->console->edit->generate_RTC-token',
      'demo',
      null,
      undefined,
      (uid: number)=>{
        this.localStreams.push(uid);
        if(this.isHost){
          this.createLocalStream();
        }
      },
      this.handleError,
    );
  }
  private createLocalStream(): void {
    this.localStream = AgoraRTC.createStream(this.streamOptions);
    this.localStream.init(()=>{
      this.client.publish(this.localStream, this.handleError);
    },this.handleError);
  }
  private addStream(elementId: any): void {
    const streamDiv = document.createElement('div');
    streamDiv.id = elementId;
    this.streamContainer?.nativeElement.appendChild(streamDiv);
  }
  private removeStream(elementId: any): void {
    const removeDiv = document.getElementById(elementId);
    if(removeDiv){
      removeDiv?.parentNode?.removeChild(removeDiv);
    }
  }
  private subscribeToStreamStart(): void {
    this.client.on('stream-added', (evt)=>{
      if(!this.localStreams.includes(evt.stream.getId())){
        this.client.subscribe(evt.stream, undefined, this.handleError)
      }
    });
    this.client.on('stream-subscribed', (evt)=>{
      const stream = evt.stream;
      const streamId = String(stream.getId());
      this.addStream(streamId);
      stream.play(streamId);
    })
  }
  private subscribeToStreamStop(): void {
    let stream;
    let  streamId;
    this.client.on('stream-removed',(evt)=>{
      stream = evt.stream;
      streamId = String(stream.getId());
      stream.close;
      this.removeStream(streamId);
    });
    this.client.on('peer-leave', (evt)=>{
      stream = (evt as any).stream;
      streamId = String(stream.getId());
      stream.close();
      this.removeStream(streamId);
    })
  }
  public leaveRoom(): void {
    if(this.localStream){
      this.localStream.stop();
      this.localStream.close();
    }
    this.router.navigate(['/rooms']);
  }
  private handleError(err: any): void {
    console.error(err);
  }
}
