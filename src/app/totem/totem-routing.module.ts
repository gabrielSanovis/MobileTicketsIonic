import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TotemPage } from './totem.page';

const routes: Routes = [{ path: '', component: TotemPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TotemPageRoutingModule {}
