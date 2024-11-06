import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SabletechComponent } from './ui/view/sabletech/sabletech.component';

const routes: Routes = [
  {
    path: "",
    component: SabletechComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
