import { Injectable } from '@angular/core';
import {GeneralStats} from "../types/Statistics";
import {TranslateService} from "@ngx-translate/core";
import {Router} from "@angular/router";
import {DiscordUser} from "../types/discord/User";
import {Subject} from "rxjs";
import {Guild} from "../types/discord/Guilds";
import {HttpErrorResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DataHolderService {
  isLoading: boolean = true;
  isDarkTheme: boolean = false;
  showSidebarLogo: boolean = false;
  showMobileSidebar: boolean = false;
  hideGuildSidebar: boolean = false;
  allowDataFetch: Subject<boolean> = new Subject<boolean>();

  // error handler related
  error_title: string = '';
  error_desc: string = '';
  error_color: 'red' | 'green' = 'red';
  showAlertBox: boolean = false;

  // api related
  active_guild: Guild | null = null;
  profile: DiscordUser | null = null;
  bot_stats: GeneralStats = { user_count: '28.000', guild_count: 350, giveaway_count: 130, ticket_count: 290,
                              punish_count: 110, global_verified_count: '16.000' };

  constructor(private translate: TranslateService, private router: Router) {
    const temp_guild: string | null = localStorage.getItem('active_guild');
    if (temp_guild) {
      this.showSidebarLogo = true;
      this.active_guild = JSON.parse(temp_guild) as Guild;
    }

    // check if translations are loaded
    this.translate.onLangChange.subscribe((): void => {
      if (this.error_title == '' && this.error_desc == '') {
        this.error_title = this.translate.instant("ERROR_UNKNOWN_TITLE");
        this.error_desc = this.translate.instant("ERROR_UNKNOWN_DESC");
      }
    });
  }

  /**
   * Redirects the user to a simple error page with a specific error type.
   *
   * This method sets the error title and description based on the provided error type
   * and navigates the user to the `/errors/simple` page.
   *
   * @param {'LOGIN_INVALID' | 'LOGIN_EXPIRED' | 'LOGIN_BLOCKED' | 'UNKNOWN' | 'FORBIDDEN' | 'REQUESTS' | 'OFFLINE'} type - The type of error to display.
   */
  redirectLoginError(type: 'INVALID' | 'EXPIRED' | 'BLOCKED' | 'UNKNOWN' | 'FORBIDDEN' | 'REQUESTS' | 'OFFLINE' | 'NO_CLANK'): void {
    if (type === 'UNKNOWN' || type === 'OFFLINE') {
      this.error_title = this.translate.instant(`ERROR_${type}_TITLE`);
      this.error_desc = this.translate.instant(`ERROR_${type}_DESC`);
    } else {
      this.error_title = this.translate.instant(`ERROR_LOGIN_${type}_TITLE`);
      this.error_desc = this.translate.instant(`ERROR_LOGIN_${type}_DESC`);
    }

    if (type === 'NO_CLANK') {
      localStorage.removeItem('active_guild');
      this.active_guild = null;
    }

    this.router.navigateByUrl(`/errors/simple`).then();
  }

  /**
   * Handles API errors by redirecting to appropriate error pages based on the status code.
   *
   * This method checks the status code of the HTTP error response and redirects to specific
   * error pages for forbidden access (403), too many requests (429), and offline status (0).
   * If the error status code does not match any of these, it simply stops the loading state.
   *
   * @param err The HTTP error response object
   */
  handleApiError(err: HttpErrorResponse): void {
    if (err.status === 403) {
      this.redirectLoginError('FORBIDDEN');
      return;
    } else if (err.status === 401) {
      this.redirectLoginError('NO_CLANK');
    } else if (err.status === 429) {
      this.redirectLoginError('REQUESTS');
      return;
    } else if (err.status === 0) {
      this.redirectLoginError('OFFLINE');
      return;
    }

    this.isLoading = false;
  }

  /**
   * Displays an alert box with the specified title and description.
   *
   * This method sets the `error_title` and `error_desc` properties of the `DataHolderService`
   * to the provided title and description, respectively, and then sets the `showAlertBox`
   * property to `true` to display the alert box.
   *
   * @param {string} title - The title of the alert box.
   * @param {string} desc - The description of the alert box.
   */
  showAlert(title: string, desc: string): void {
    this.error_title = title;
    this.error_desc = desc;
    this.showAlertBox = true;

    setTimeout((): void => { this.showAlertBox = false; }, 5000);
  }

  /**
   * Retrieves the theme preference from local storage or the user's system settings.
   *
   * @returns {boolean} - `true` if the theme is dark, otherwise `false`.
   */
  getThemeFromLocalStorage(): boolean {
    const darkMode: string | null = localStorage.getItem('dark');
    if (darkMode !== null) {
      return darkMode === 'true';
    }

    // check user's system theme
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  /**
   * Toggles the theme between light and dark mode.
   */
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('dark', this.isDarkTheme.toString());
    this.applyTheme();
  }

  /**
   * Applies the current theme to the document
   */
  applyTheme(): void {
    const html: HTMLHtmlElement = document.querySelector('html') as HTMLHtmlElement;
    if (html) {
      if (this.isDarkTheme) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }

  /**
   * Toggles the visibility of the mobile sidebar.
   */
  toggleSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;
  }

}
