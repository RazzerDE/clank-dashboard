import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {config} from "../../../environments/config";
import { HttpClient } from "@angular/common/http";
import {AuthService} from "../auth/auth.service";
import {Guild, Role} from "../types/discord/Guilds";

@Injectable({
  providedIn: 'root'
})
export class ComService {
  private isInitialized: boolean = false;
  private readonly initPromise: Promise<void> = Promise.resolve();

  constructor(private http: HttpClient, private authService: AuthService) {
    // ensure that every HTTP request inside this file has the correct authorization header
    // is necessary after the first discord login, redirect to dashboard
    if (!localStorage.getItem('access_token')) {
      this.initPromise = new Promise<void>((resolve) => {
        window.addEventListener('storage', (_event: StorageEvent): void => {
          this.authService.headers = this.authService.setAuthorizationHeader(localStorage.getItem('access_token')!);
          this.isInitialized = true;
          resolve();
        });
      });
    }
  }

  /**
   * Ensures that the service is initialized before making any requests.
   *
   * This method checks if the service is initialized. If not, it waits for the initialization
   * promise to resolve, ensuring that the authorization headers are set correctly.
   *
   * @returns {Promise<void>} A promise that resolves when the service is initialized.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  /**
   * Retrieves the list of guilds the user is a member of.
   *
   * This method ensures that the service is initialized before making the request.
   * It makes a GET request to the internal API to fetch the guilds, including member counts.
   *
   * @returns {Promise<Observable<Guild[]>>} A promise that resolves to an observable of the list of guilds.
   */
  async getGuilds(): Promise<Observable<Guild[]>> {
    await this.ensureInitialized();
    return this.http.get<Guild[]>(`${config.api_url}/guilds`, { headers: this.authService.headers });
  }

  /**
   * Retrieves the team roles for a specific guild.
   *
   * This method ensures that the service is initialized before making the request.
   * It makes a GET request to the internal API to fetch the team roles for the specified guild.
   *
   * @param {string} guild_id - The ID of the guild to fetch team roles for.
   * @returns {Promise<Observable<Role[]>>} A promise that resolves to an observable of the list of team roles.
   */
  async getTeamRoles(guild_id: string): Promise<Observable<any>> {
    await this.ensureInitialized();
    return this.http.get<Role[]>(`${config.api_url}/guilds/team?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Removes a team role from a specific guild.
   *
   * This method ensures that the service is initialized before making the request.
   * It makes a DELETE request to the internal API to remove the specified team role
   * from the specified guild.
   *
   * @param {string} guild_id - The ID of the guild to remove the team role from.
   * @param {string} role_id - The ID of the role to be removed.
   * @returns {Promise<Observable<any>>} A promise that resolves to an observable of the result.
   */
  async removeTeamRole(guild_id: string, role_id: string): Promise<Observable<any>> {
    await this.ensureInitialized();
    return this.http.delete(`${config.api_url}/guilds/team?guild_id=${guild_id}&role_id=${role_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Adds a team role to a specific guild.
   *
   * This method ensures that the service is initialized before making the request.
   * It makes a POST request to the internal API to add the specified team role
   * to the specified guild.
   *
   * @param {string} guild_id - The ID of the guild to add the team role to.
   * @param {string} role_id - The ID of the role to be added.
   * @param {string} level - The support level of the role to be added.
   * @returns {Promise<Observable<any>>} A promise that resolves to an observable of the result.
   */
  async addTeamRole(guild_id: string, role_id: string, level: string): Promise<Observable<any>> {
    await this.ensureInitialized();
    return this.http.post(`${config.api_url}/guilds/team?guild_id=${guild_id}&role_id=${role_id}&level=${level}`, {},
      { headers: this.authService.headers });
  }
}
