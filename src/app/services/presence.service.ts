import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  constructor(private db: AngularFireDatabase) { }

  public setPresenceOnline(newUser: any, roomId?: string | null): Observable<any> {
    return this.db.object('.info/connected')
      .valueChanges()
      .pipe(tap(() =>{
        const online = {
          displayName: newUser.displayName,
          date: new Date().getTime(),
          key: newUser.key
        };
        const ref = this.db.object(`online/${roomId}/${newUser.key}`);
        ref.set(online).then((user)=>{
          ref.query.ref.onDisconnect().remove();
        });
      })
    )
  }
  public setPresenceOffline(onlineUser: any, roomId?: string | null): void{
    this.db.object(`online/${roomId}/${onlineUser.key}`).remove();
  }
}
