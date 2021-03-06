import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  constructor(private auth: AngularFireAuth, private route: Router) { }

  ngOnInit(): void {
  }

  public login(): void{
    this.auth.signInAnonymously().then(() => {
      this.route.navigate(['rooms']);
    })
  }

}
