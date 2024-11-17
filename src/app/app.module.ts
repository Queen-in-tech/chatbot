import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SabletechComponent } from './ui/view/sabletech/sabletech.component';
import { HeaderComponent } from './ui/view/sabletech/components/header/header.component';
import { FooterComponent } from './ui/view/sabletech/components/footer/footer.component';
import { HeroComponent } from './ui/view/sabletech/components/hero/hero.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    SabletechComponent,
    HeaderComponent,
    FooterComponent,
    HeroComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
