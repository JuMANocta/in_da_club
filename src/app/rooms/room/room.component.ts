import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as AgoraRTC from 'agora-rtc-sdk';
import { environment } from 'src/environments/environment';
import { combineLatest } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Iroom } from '../rooms.component';
import { take } from 'rxjs/operators';
import { PresenceService } from 'src/app/services/presence.service';

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
export class RoomComponent implements OnInit {
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
  private localStreams = [];
  private localStream = AgoraRTC.createStream;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private db: AngularFireDatabase, private presenceService : PresenceService){}

  ngOnInit(): void {
    this.roomId = this.activatedRoute.snapshot.paramMap.get('id');
    this.initClient();
    this.joinRoom();
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
      }
    })
  }
  public joinStream(): void{
    this.streamOptions.streamID = this.roomId == null ? "" : this.roomId;
    this.client.join(
      'user_token',
      'demo',
      null,
      undefined,
      (uid)=>{
        this.localStreams.push(uid);
        if(this.isHost){
          //this.createLocalStream();
        }
      },
    );
  }
}
