import {Component} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {DataHolderService} from "../../services/data/data-holder.service";
import {SidebarComponent} from "../../structure/sidebar/sidebar.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {

  constructor(protected authService: AuthService, private dataService: DataHolderService) {
    this.dataService.isLoading = true;
    this.authService.discordLogin();
  }

}
