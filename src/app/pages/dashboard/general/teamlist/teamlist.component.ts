import {Component, ElementRef, HostListener, OnDestroy, ViewChild} from '@angular/core';
import {DataHolderService} from "../../../../services/data/data-holder.service";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {PageThumbComponent} from "../../../../structure/util/page-thumb/page-thumb.component";
import {DashboardLayoutComponent} from "../../../../structure/dashboard-layout/dashboard-layout.component";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faSearch, faXmark, IconDefinition} from "@fortawesome/free-solid-svg-icons";
import {faPlus} from "@fortawesome/free-solid-svg-icons/faPlus";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons/faChevronDown";
import {NgClass} from "@angular/common";
import {HttpErrorResponse} from "@angular/common/http";
import {ComService} from "../../../../services/discord-com/com.service";
import {Role, TeamList} from "../../../../services/types/discord/Guilds";
import {Router} from "@angular/router";
import {AlertBoxComponent} from "../../../../structure/util/alert-box/alert-box.component";
import {Subscription} from "rxjs";
import {faRefresh} from "@fortawesome/free-solid-svg-icons/faRefresh";

@Component({
  selector: 'app-teamlist',
  imports: [
    TranslatePipe,
    PageThumbComponent,
    DashboardLayoutComponent,
    FaIconComponent,
    NgClass,
    AlertBoxComponent
  ],
  templateUrl: './teamlist.component.html',
  styleUrl: './teamlist.component.scss'
})
export class TeamlistComponent implements OnDestroy {
  protected readonly faSearch: IconDefinition = faSearch;
  protected readonly faPlus: IconDefinition = faPlus;
  protected readonly faChevronDown: IconDefinition = faChevronDown;
  protected readonly faXmark: IconDefinition = faXmark;
  protected readonly faRefresh: IconDefinition = faRefresh;
  protected activeTab: number = 0;

  protected roles: Role[] = [];
  protected filteredRoles: Role[] = [];
  protected discordRoles: Role[] = [];

  protected selectedSupportLevels: number[] = [0, 1, 2];
  private subscriptions: Subscription[] = [];

  protected disabledCacheBtn: boolean = false;
  protected isRolePickerValid: boolean = false;

  @ViewChild('rolePicker') protected rolePicker!: ElementRef<HTMLSelectElement>;
  @ViewChild('filterDropdown') protected filterDropdown!: ElementRef<HTMLDivElement>;
  @ViewChild('dropdownButton') protected dropdownButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('roleModal') protected roleModal!: ElementRef<HTMLDivElement>;
  @ViewChild('roleModalContent') protected modalContent!: ElementRef<HTMLDivElement>;
  @ViewChild('roleBackdrop') protected roleBackdrop!: ElementRef<HTMLDivElement>;
  @ViewChild('roleButton') protected roleButton!: ElementRef<HTMLButtonElement>;

  constructor(protected dataService: DataHolderService, private discordService: ComService, private router: Router,
              private translate: TranslateService) {
    document.title = "Teamlist ~ Clank Discord-Bot";
    this.dataService.isLoading = true;

    this.getTeamRoles(); // first call to get the server data
    const dataFetchSubscription: Subscription = this.dataService.allowDataFetch.subscribe((value: boolean): void => {
      if (value) { // only fetch data if allowed
        this.getTeamRoles();
      }
    });

    this.subscriptions.push(dataFetchSubscription);
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   *
   * This method unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Validates the role picker selection.
   *
   * This method checks the value of the role picker element and sets the `isRolePickerValid`
   * property to `true` if a valid role is selected, otherwise sets it to `false`.
   */
  validateRolePicker(): void {
    const selectedRole: string = this.rolePicker.nativeElement.value;
    this.isRolePickerValid = selectedRole !== '' && selectedRole !== '👥 - Wähle eine Discord-Rolle aus..';
  }

  /**
   * Refreshes the cache by fetching the team roles again.
   *
   * This method disables the cache button, sets the loading state, and calls the `getTeamRoles` method
   * with the `no_cache` parameter set to `true` to fetch fresh data. The cache button is re-enabled
   * after 30 seconds.
   */
  refreshCache(): void {
    this.disabledCacheBtn = true;
    this.dataService.isLoading = true;
    this.getTeamRoles(true);

    setTimeout((): void => { this.disabledCacheBtn = false; }, 30000); // 30 seconds
  }

  /**
   * Retrieves the team roles for the active guild.
   *
   * This method first checks if the team roles are already stored in the local storage and if the stored data is still valid.
   * If valid data is found, it uses the stored data. Otherwise, it makes an API call to fetch the team roles from the backend.
   * The fetched data is then stored in the local storage for future use.
   *
   * @param {boolean} no_cache - Whether to ignore the cached data and fetch fresh data from the backend.
   */
  getTeamRoles(no_cache?: boolean): void {
    // redirect to dashboard if no active guild is set
    if (!this.dataService.active_guild) {
      this.router.navigateByUrl("/dashboard").then();
      return;
    }

    // check if guilds are already stored in local storage (one minute cache)
    if ((localStorage.getItem('guild_team') && localStorage.getItem('guild_team_timestamp') &&
      Date.now() - Number(localStorage.getItem('guild_team_timestamp')) < 60000) && !no_cache) {
      this.roles = JSON.parse(localStorage.getItem('guild_team') as string);
      this.discordRoles = JSON.parse(localStorage.getItem('guild_roles') as string);
      this.filteredRoles = this.roles;
      this.dataService.isLoading = false;
      return;
    }

    this.discordService.getTeamRoles(this.dataService.active_guild!.id).then((observable) => {
      const subscription: Subscription = observable.subscribe({
        next: (roles: TeamList): void => {
          this.roles = roles.team_roles;
          this.filteredRoles = roles.team_roles;
          this.discordRoles = roles.other_roles;
          this.dataService.isLoading = false;

          localStorage.setItem('guild_team', JSON.stringify(this.roles));
          localStorage.setItem('guild_roles', JSON.stringify(this.discordRoles));
          localStorage.setItem('guild_team_timestamp', Date.now().toString());
        },
        error: (err: HttpErrorResponse): void => {
          if (err.status === 429) {
            this.dataService.redirectLoginError('REQUESTS');
          } else if (err.status === 401) {
            this.dataService.redirectLoginError('NO_CLANK');
          } else {
            this.dataService.redirectLoginError('EXPIRED');
          }
        }
      });

      this.subscriptions.push(subscription);
    });
  }

  /**
   * Filters the roles based on the selected support levels.
   *
   * This method updates the `filteredRoles` array to include only the roles
   * that have a `support_level` property and whose support level is included
   * in the `selectedSupportLevels` array.
   */
  applyFilters(): void {
    this.filteredRoles = this.roles.filter(role =>
      role.support_level !== undefined &&
      this.selectedSupportLevels.includes(role.support_level)
    );
  }

  /**
   * Filters the roles based on the search term entered by the user.
   *
   * This method updates the `filteredRoles` array to include only the roles
   * whose names contain the search term. The search is case-insensitive.
   *
   * @param {Event} event - The input event triggered by the search field.
   */
  searchRole(event: Event): void {
    const searchTerm: string = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredRoles = this.roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Removes a role from the team.
   *
   * This method sends a request to the backend to remove the specified role from the team.
   * If the role is successfully removed, it updates the local roles and filteredRoles arrays
   * and removes the cached roles from local storage. It also displays a success alert.
   * If an error occurs, it handles different error statuses by showing appropriate alerts
   * or redirecting the user.
   *
   * @param {Role} role - The role to be removed.
   */
  removeRole(role: Role): void {
    if (!this.dataService.active_guild) { return; }

    this.discordService.removeTeamRole(this.dataService.active_guild.id, role.id).then((observable) => {
      const subscription: Subscription = observable.subscribe({
        next: (_result: boolean): void => {
          // Successfully removed, update shown data
          this.roles = this.roles.filter(r => r.id !== role.id);
          this.filteredRoles = this.filteredRoles.filter(r => r.id !== role.id);
          // add back to role picker
          this.discordRoles.push(role);
          this.discordRoles.sort((a, b) => b.position - a.position);

          localStorage.removeItem('guild_team');
          this.dataService.error_color = 'green';
          this.dataService.showAlert(this.translate.instant('SUCCESS_ROLE_DELETE'),
                                     this.translate.instant('SUCCESS_ROLE_DELETE_DESC', { role: role.name }));
        },
        error: (err: HttpErrorResponse): void => {
          if (err.status === 404) {
            this.dataService.error_color = 'red';
            this.dataService.showAlert(this.translate.instant('ERROR_ROLE_DELETE_TITLE'),
              this.translate.instant('ERROR_ROLE_DELETE_DESC', { role: role.name }));

            this.roles = this.roles.filter(r => r.id !== role.id);
            this.filteredRoles = this.filteredRoles.filter(r => r.id !== role.id);
          } else if (err.status === 429) {
            this.dataService.redirectLoginError('REQUESTS');
          } else if (err.status === 401) {
            this.dataService.redirectLoginError('FORBIDDEN');
          } else {
            this.dataService.redirectLoginError('EXPIRED');
          }
        }
      });

      this.subscriptions.push(subscription);
    });
  }

  addRole(option: HTMLOptionElement): void {
    if (!this.dataService.active_guild) { return; }
    const found_role: Role = this.discordRoles.find(r => r.id === option.value) as Role
    found_role.support_level = this.activeTab;

    this.discordService.addTeamRole(this.dataService.active_guild.id, found_role.id, (this.activeTab + 1).toString())
      .then((observable) => {
        const subscription: Subscription = observable.subscribe({
          next: (_result: boolean): void => {
            // Successfully added, update shown data
            this.addRoleToTeam(found_role);
            localStorage.removeItem('guild_team');

            this.dataService.error_color = 'green';
            this.dataService.showAlert(this.translate.instant('SUCCESS_ROLE_ADD'),
              this.translate.instant('SUCCESS_ROLE_ADD_DESC',
                { role: option.innerText, level: this.getSupportLevel(this.activeTab) }));

            // close modal
            this.roleModal.nativeElement.classList.add('hidden');
            this.roleBackdrop.nativeElement.classList.add('hidden');
          },
          error: (err: HttpErrorResponse): void => {
            if (err.status === 409) {
              this.dataService.error_color = 'red';
              this.dataService.showAlert(this.translate.instant('ERROR_ROLE_ADD_TITLE'),
                this.translate.instant('ERROR_ROLE_ADD_DESC',
                  { role: option.innerText, level: this.getSupportLevel(this.activeTab) }));

              this.addRoleToTeam(found_role);
            } else if (err.status === 429) {
              this.dataService.redirectLoginError('REQUESTS');
            } else if (err.status === 401) {
              this.dataService.redirectLoginError('FORBIDDEN');
            } else {
              this.dataService.redirectLoginError('EXPIRED');
            }

            // close modal
            this.roleModal.nativeElement.classList.add('hidden');
            this.roleBackdrop.nativeElement.classList.add('hidden');
          }
        });

        this.subscriptions.push(subscription);
    });
  }

  /**
   * Toggles the support level selection based on the checkbox event.
   *
   * This method updates the `selectedSupportLevels` array by adding or removing
   * the specified support level based on the state of the checkbox. After updating
   * the selection, it applies the filters to update the `filteredRoles` array.
   *
   * @param {number} level - The support level to toggle.
   * @param {Event} event - The event triggered by the checkbox.
   */
  toggleSupportLevel(level: number, event: Event): void {
    const checkbox: HTMLInputElement = event.target as HTMLInputElement;

    if (checkbox.checked) {
      // Add the level if not already in the array
      if (!this.selectedSupportLevels.includes(level)) {
        this.selectedSupportLevels.push(level);
      }
    } else {
      // Remove the level
      this.selectedSupportLevels = this.selectedSupportLevels.filter(l => l !== level);
    }

    // Apply filters after selection change
    this.applyFilters();
  }

  /**
   * Returns a string representation of the support level based on the provided support level number.
   *
   * @param {number} supportLevel - The support level number (0, 1 or 2).
   * @returns {string} - The string representation of the support level.
   */
  getSupportLevel(supportLevel: number): string {
    switch (supportLevel) {
      case 1:
        return `🚔 - Second Level (${this.translate.instant('PLACEHOLDER_ROLE_SECOND')})`;
      case 2:
        return `🚨 - Third Level (${this.translate.instant('PLACEHOLDER_ROLE_THIRD')})`;
      default:
        return `🚑 - First Level (${this.translate.instant('PLACEHOLDER_ROLE_FIRST')})`;
    }
  }

  /**
   * Adds a role to the team.
   *
   * This method checks if the role already exists in the `roles` array to prevent duplicates.
   * If the role does not exist, it adds the role to the `roles` array and updates the `filteredRoles`
   * array based on the current filters. It also sorts the `filteredRoles` array by support level and position.
   * Finally, it removes the role from the `discordRoles` array, indicating that the role is now part of the team.
   *
   * @param {Role} role - The role to be added to the team.
   */
  private addRoleToTeam(role: Role): void {
    // Check if the role already exists in the roles array to prevent duplicates
    if (!this.roles.some(r => r.id === role.id)) {
      this.roles.push(role);

      // Update filtered roles based on current set filters
      if (role.support_level !== undefined && this.selectedSupportLevels.includes(role.support_level)) {
        this.filteredRoles = [...this.roles].filter(r =>
          r.support_level !== undefined &&
          this.selectedSupportLevels.includes(r.support_level)
        );

        // Sort the filtered roles
        this.filteredRoles.sort((a, b) => {
          if (a.support_level !== b.support_level) {
            return b.support_level! - a.support_level!;
          }
          return b.position - a.position;
        });
      }

      // Remove from discord roles; role is now in team
      this.discordRoles = this.discordRoles.filter(r => r.id !== role.id);
    }
  }

  /**
   * Handles document click events to close some dropdown or modals if the user clicks outside of them.
   *
   * @param {MouseEvent} event - The click event triggered on the document.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // "support-level" filter dropdown
    let clickedInside: boolean = this.filterDropdown.nativeElement.contains(event.target as Node) ||
      this.dropdownButton.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.filterDropdown.nativeElement.classList.add('hidden');
    }

    // role modal
    clickedInside = this.modalContent.nativeElement.contains(event.target as Node);
    if (!clickedInside && document.activeElement != this.roleButton.nativeElement) {
      this.roleModal.nativeElement.classList.add('hidden');
      this.roleBackdrop.nativeElement.classList.add('hidden');
    }
  }
}
