import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';

export interface Iroom{
  key?: string;
  name: string;
  host?: string;
}

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit, OnDestroy {
  public $rooms: Observable<Iroom[]> | undefined;
  public isRoomCreationShown = false;
  private user: string | undefined;
  private roomList = this.db.list<Iroom>('rooms');
  private $destroy: Subject<boolean> = new Subject<boolean>();

  constructor(private auth: AngularFireAuth, private router: Router, private db: AngularFireDatabase) { }

  ngOnInit(): void {
    this.$rooms = this.roomList.snapshotChanges().pipe(
      map((action)=>
      action.map((c)=>{
        return {
          ...(c.payload.val() as any),
          key: c.payload.key
        };
      })
      ),
      takeUntil(this.$destroy)
    );
    this.auth.authState.pipe(take(1)).subscribe({
      next: (user)=>{
        this.user = user?.uid;
      }
    });
  }
  ngOnDestroy(): void {
    this.$destroy.next(true);
    this.$destroy.unsubscribe();
  }
  public addRoom(nameInput : HTMLInputElement): void{
    if(nameInput.value.length){
      this.roomList.push({
        name: nameInput.value,
        host: this.user
      }).then((resp)=>{
        console.log(resp);
        this.navigate(resp.key);
      });
    }
    nameInput.value ='';
    this.isRoomCreationShown = false;
  }
  public navigate(roomId?: string | null): void{
    this.router.navigate(['rooms/' + roomId]);
  }
  public logout(): void{
    this.auth.signOut().then(() => {
      this.router.navigate(['profile']);
    })
  }
}
