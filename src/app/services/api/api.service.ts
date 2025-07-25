import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, of} from "rxjs";
import {GeneralStats} from "../types/Statistics";
import {SliderItems} from "../types/landing-page/SliderItems";
import {config} from "../../../environments/config";
import {TasksCompletionList} from "../types/Tasks";
import {AuthService} from "../auth/auth.service";
import {formGroupBug, formGroupIdea} from "../types/Forms";
import {FeatureData, FeatureVotes} from "../types/navigation/WishlistTags";
import {SupportSetup} from "../types/discord/Guilds";
import {SupportTheme, TicketAnnouncement, TicketSnippet} from "../types/Tickets";
import {BlockedUser} from "../types/discord/User";
import {EventEffects, EventEffectsRaw, Giveaway} from "../types/Events";
import {EmbedConfig} from "../types/Config";
import {BackupData, SecurityFeature, SecurityLogs, UnbanMethod, UnbanRequest} from "../types/Security";
import {GlobalChatConfig, GlobalChatCustomizing, GlobalChatObject} from "../types/Misc";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly API_URL: string = config.api_url;

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Fetches general statistics about the clank bot (guild count, user count & module related statistics).
   *
   * @returns An Observable that emits the general statistics.
   */
  getGeneralStats(): Observable<GeneralStats> {
    return this.http.get<GeneralStats>(`${this.API_URL}/stats/general`);
  }

  /**
   * Fetches some famous guilds that are using the clank bot.
   *
   * @returns An Observable that emits an array of SliderItems, each containing information about a guild.
   */
  getGuildUsage(limit: number): Observable<SliderItems[]> {
    return this.http.get<SliderItems[]>(`${this.API_URL}/stats/guilds_usage` + (limit ? `?limit=${limit}` : ''));
  }

  /**
   * Fetches the votes of all bot features.
   *
   * @returns An Observable that emits the feature votes.
   */
  getFeatureVotes(): Observable<FeatureVotes> {
    return this.http.get<FeatureVotes>(`${this.API_URL}/progress/features`, { headers: this.authService.headers });
  }

  /**
   * Fetches the status of all bot modules for a specific guild.
   * This function also caches the module status for 1 minute, to avoid ratelimits.
   *
   * @param guild_id - The ID of the guild for which to fetch the module status.
   * @returns An Observable that emits the status of the modules.
   */
  getModuleStatus(guild_id: string): Observable<TasksCompletionList> {
    const moduleStatusTimestamp: string | null = localStorage.getItem('moduleStatusTimestamp');
    const moduleStatus: string | null = localStorage.getItem('moduleStatus');

    try {
      if (moduleStatusTimestamp && moduleStatus) {
        const timestamp: number = parseInt(moduleStatusTimestamp);
        const module: TasksCompletionList = JSON.parse(moduleStatus);

        // check if module status cache is younger than 1 minute
        if (Date.now() - timestamp < 60000 && module['task_1'].guild_id === guild_id) {
          module['task_1'].cached = true;
          return of(module);
        }
      }
    } catch (error) { console.error('Cache reading error:', error); }

    return this.http.get<TasksCompletionList>(`${this.API_URL}/progress/modules?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches a list of blocked users for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the blocked users.
   * @returns An Observable that emits an array of `BlockedUser` objects.
   */
  getBlockedUsers(guild_id: string): Observable<BlockedUser[]> {
    return this.http.get<BlockedUser[]>(`${this.API_URL}/guilds/blocked-users?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Adds a new blocked user to the blocked users list for a specific guild.
   *
   * @param guild_id - The ID of the guild where the user is to be blocked.
   * @param blockedUser - The `BlockedUser` object containing details of the user to be blocked.
   * @returns An Observable emitting the server's response.
   */
  addBlockedUser(guild_id: string, blockedUser: BlockedUser): Observable<BlockedUser> {
    return this.http.post<BlockedUser>(`${this.API_URL}/guilds/blocked-users?guild_id=${guild_id}`, blockedUser,
      { headers: this.authService.headers });
  }

  /**
   * Deletes a blocked user from a specific guild.
   *
   * @param guild_id - The ID of the guild from which the user is to be removed.
   * @param user_id - The ID of the user to be removed from the blocked list.
   * @returns An Observable emitting the server's response.
   */
  deleteBlockedUser(guild_id: string, user_id: string): Observable<Object> {
    return this.http.delete(`${this.API_URL}/guilds/blocked-users?guild_id=${guild_id}&user_id=${user_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the support setup status for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the support setup status.
   * @returns An Observable that emits the support setup status.
   */
  getSupportSetupStatus(guild_id: string): Observable<SupportSetup> {
    return this.http.get<SupportSetup>(`${this.API_URL}/guilds/support-setup?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches all events (giveaways) for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the events.
   * @returns An Observable that emits an array of Giveaway objects.
   */
  getGuildEvents(guild_id: string): Observable<Giveaway[]> {
    return this.http.get<Giveaway[]>(`${this.API_URL}/guilds/events?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Saves the embed configuration for the giveaway design in a specific guild.
   *
   * @param embed_config - The embed configuration object containing details for the giveaway embed.
   * @returns An Observable emitting the server's response.
   */
  saveEmbedConfig(embed_config: EmbedConfig): Observable<EmbedConfig> {
    return this.http.post<EmbedConfig>(`${this.API_URL}/guilds/events/config?guild_id=${embed_config.guild_id}`, embed_config,
      { headers: this.authService.headers });
  }

  /**
   * Updates the status of an unban request for a specific guild and user.
   *
   * @param guild_id - The ID of the guild where the unban request is being updated.
   * @param user_id - The ID of the user whose unban request is being updated.
   * @param status - The new status of the unban request (e.g., 0 for pending, 1 for approved, 2 for denied).
   */
  updateUnbanRequest(guild_id: string, user_id: string, status: 1 | 2): Observable<Object> {
    return this.http.put<Object>(`${this.API_URL}/guilds/security/requests?guild_id=${guild_id}&user_id=${user_id}&status=${status}`, {},
      { headers: this.authService.headers });
  }

  /**
   * Fetches the configuration for discord event embeds in a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the event embed configuration.
   * @return An Observable that emits the EmbedConfig object containing the configuration details.
   */
  getEventConfig(guild_id: string): Observable<EmbedConfig> {
    return this.http.get<EmbedConfig>(`${this.API_URL}/guilds/events/config?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the global chat configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the global chat configuration.
   * @returns An Observable that emits the GlobalChatConfig object containing the configuration details.
   */
  getGuildGlobalChat(guild_id: string): Observable<GlobalChatConfig> {
    return this.http.get<GlobalChatConfig>(`${this.API_URL}/guilds/misc/global-chat?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Saves the global chat customizing settings for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to save the global chat customizing.
   * @param customize - The GlobalChatCustomizing object containing the customizing settings.
   * @returns An Observable emitting the server's response.
   */
  saveGlobalChatCustomizing(guild_id: string, customize: GlobalChatCustomizing): Observable<Object> {
    return this.http.post<Object>(`${this.API_URL}/guilds/misc/global-chat?guild_id=${guild_id}`, customize,
      { headers: this.authService.headers });
  }

  /**
   * Updates the global chat configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to update the global chat.
   * @param updated - The updated GlobalChatObject containing the new configuration.
   * @returns An Observable emitting the server's response.
   */
  updateGlobalChat(guild_id: string, updated: GlobalChatObject): Observable<Object> {
    return this.http.put<Object>(`${this.API_URL}/guilds/misc/global-chat?guild_id=${guild_id}`, updated,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the security logs configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the security logs configuration.
   * @return An Observable that emits the SecurityLogSetup object containing the configuration details.
   */
  getSecurityLogs(guild_id: string): Observable<SecurityLogs> {
    return this.http.get<SecurityLogs>(`${this.API_URL}/guilds/security/logs?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the security logs configuration for a specific guild, including pending actions.
   *
   * @param guild_id - The ID of the guild for which to fetch the security logs configuration.
   * @return An Observable that emits the SecurityLogs object containing the configuration details, including pending actions.
   */
  getSecurityLogsPending(guild_id: string): Observable<SecurityLogs> {
    return this.http.get<SecurityLogs>(`${this.API_URL}/guilds/security/logs/pending?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Updates the log-forum for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to update the log forum.
   * @param channel_id - The ID of the channel to be set as the log forum.
   * @param delete_action - Optional boolean indicating whether to delete the log forum (default: false).
   * @return An Observable that emits the server's response.
   */
  updateLogForum(guild_id: string, channel_id: string, delete_action?: boolean): Observable<Object> {
    return this.http.put<Object>(`${this.API_URL}/guilds/security/logs/forum?guild_id=${guild_id}&channel_id=${channel_id}` + (delete_action ? '&delete=true' : ''),
      {}, { headers: this.authService.headers });
  }

  /**
   * Updates the log threads enabled states for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to update the log threads.
   * @param logs - The SecurityLogs object containing the updated log threads configuration.
   * @return An Observable that emits the server's response.
   */
  updateLogThreads(guild_id: string, logs: SecurityLogs): Observable<SecurityLogs> {
    return this.http.post<SecurityLogs>(`${this.API_URL}/guilds/security/logs/pending?guild_id=${guild_id}`, logs,
      { headers: this.authService.headers });
  }

  /**
   * Gets the security logs configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to save the security logs configuration.
   * @return An Observable that emits the server's response.
   */
  getUnbanRequests(guild_id: string): Observable<UnbanRequest[]> {
    return this.http.get<UnbanRequest[]>(`${this.API_URL}/guilds/security/requests?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the configuration for event effects in a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the event effects configuration.
   * @return An Observable that emits the EventEffects object containing the configuration details.
   */
  getEventEffects(guild_id: string): Observable<EventEffectsRaw> {
    return this.http.get<EventEffectsRaw>(`${this.API_URL}/guilds/events/effects?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the unban method configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the configuration.
   * @return An Observable that emits an UnbanMethod object representing the related config.
   */
  getUnbanMethod(guild_id: string): Observable<UnbanMethod> {
    return this.http.get<UnbanMethod>(`${this.API_URL}/guilds/security/unban-method?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Saves a specific pending action related to unban methods for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to save the unban method.
   * @param method - The UnbanMethod object containing the details of the unban method to be saved.
   * @param action - The action to be performed (0 for disable, 1 for enable).
   * @return An Observable that emits the server's response.
   */
  doUnbanAction(guild_id: string, method: UnbanMethod, action: 0 | 1): Observable<Object> {
    return this.http.post<Object>(`${this.API_URL}/guilds/security/unban-method?guild_id=${guild_id}&type=${action}`,
      method, { headers: this.authService.headers });
  }

  /**
   * Fetches the security shields configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the security shields configuration.
   * @return An Observable that emits an array of SecurityFeature objects representing the security shields.
   */
  getSecurityShields(guild_id: string): Observable<SecurityFeature[]> {
    return this.http.get<SecurityFeature[]>(`${this.API_URL}/guilds/security/shields?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Saves the security shields configuration for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to save the security shields configuration.
   * @param shields - An Observable that emits an array of SecurityFeature objects representing the security shields to be saved.
   */
  saveSecurityShields(guild_id: string, shields: SecurityFeature[]): Observable<Object> {
    return this.http.post<Object>(`${this.API_URL}/guilds/security/shields?guild_id=${guild_id}`, shields,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the backup data for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the backup data.
   * @return An Observable that emits the BackupData object containing the backup information.
   */
  getBackupData(guild_id: string): Observable<BackupData> {
    return this.http.get<BackupData>(`${this.API_URL}/guilds/security/backups?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Saves a specific pending action for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to save the security logs configuration.
   * @param action - The action to be performed (0 = Panic Mode, 1 = Backup Restore, 2 = AutoMod Setup).
   * @return An Observable that emits the server's response.
   */
  insertBotAction(guild_id: string, action: 0 | 1 | 2): Observable<Object> {
    return this.http.put<Object>(`${this.API_URL}/guilds/security/actions?guild_id=${guild_id}&action=${action}`,
      {}, { headers: this.authService.headers });
  }

  /**
   * Saves the event effects configuration for a specific guild.
   *
   * @param effects - An array of EventEffects objects containing the effects to be saved.
   * @param guild_id - The ID of the guild for which to save the event effects.
   */
  saveEventEffects(effects: EventEffects, guild_id: string): Observable<Object> {
    return this.http.post<Object>(`${this.API_URL}/guilds/events/effects?guild_id=${guild_id}`, effects,
      { headers: this.authService.headers });
  }

  /**
   * Creates a new giveaway for a specific guild.
   *
   * @param giveaway - The giveaway object to be created.
   * @returns An Observable emitting the server's response.
   */
  createGuildEvent(giveaway: Giveaway): Observable<Giveaway> {
    return this.http.post<Giveaway>(`${this.API_URL}/guilds/events?guild_id=${giveaway.guild_id}`, giveaway,
      { headers: this.authService.headers });
  }

  /**
   * Updates an existing giveaway for a specific guild.
   *
   * @param giveaway - The giveaway object to be updated.
   * @returns An Observable emitting the server's response.
   */
  updateGuildEvent(giveaway: Giveaway): Observable<Giveaway> {
    return this.http.put<Giveaway>(`${this.API_URL}/guilds/events?guild_id=${giveaway.guild_id}`, giveaway,
      {headers: this.authService.headers});
  }

  /**
   * Deletes an existing (SCHEDULED) giveaway for a specific guild.
   *
   * @param giveaway - The giveaway object to be deleted.
   * @returns An Observable emitting the server's response.
   */
  deleteGuildEvent(giveaway: Giveaway): Observable<Object> {
    return this.http.delete(`${this.API_URL}/guilds/events?guild_id=${giveaway.guild_id}&event_id=${giveaway.event_id}`,
      {headers: this.authService.headers});
  }

  /**
   * Starts a scheduled giveaway event for a specific guild.
   *
   * @param giveaway - The giveaway object to be started.
   * @returns An Observable emitting the server's response.
   */
  startScheduledEvent(giveaway: Giveaway): Observable<Giveaway> {
    return this.http.put<Giveaway>(`${this.API_URL}/guilds/events/start?guild_id=${giveaway.guild_id}&event_id=${giveaway.event_id}`,
      {}, { headers: this.authService.headers });
  }

  /**
   * Fetches the predefined text snippets for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the ticket snippets.
   * @returns An Observable that emits the ticket snippets.
   */
  getSnippets(guild_id: string): Observable<TicketSnippet[]> {
    return this.http.get<TicketSnippet[]>(`${this.API_URL}/guilds/support-snippets?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Creates a new support theme for a specific guild.
   *
   * @param snippet - The ticket snippet object to be created.
   * @returns An Observable emitting the server's response.
   */
  createSnippet(snippet: TicketSnippet): Observable<Object> {
    return this.http.post(`${this.API_URL}/guilds/support-snippets?guild_id=${snippet.guild_id}`, snippet,
      { headers: this.authService.headers });
  }

  /**
   * Updates an existing ticket snippet for a specific guild.
   *
   * @param snippet - The ticket snippet object to be updated. It must include the `guild_id` of the guild
   *                  and the `old_name` of the existing snippet.
   * @returns An Observable emitting the server's response.
   */
  editSnippet(snippet: TicketSnippet): Observable<Object> {
    return this.http.put(`${this.API_URL}/guilds/support-snippets?guild_id=${snippet.guild_id}`, snippet,
      { headers: this.authService.headers });
  }

  /**
   * Removes an existing ticket snippet for a specific guild.
   *
   * @param snippet - The ticket snippet object to be removed. It must include the `guild_id` of the guild.
   * @returns An Observable emitting the server's response.
   */
  deleteSnippet(snippet: TicketSnippet): Observable<Object> {
    return this.http.delete(
      `${this.API_URL}/guilds/support-snippets?guild_id=${snippet.guild_id}&name=${encodeURIComponent(snippet.name)}`,
      { headers: this.authService.headers });
  }

  /**
   * Fetches the current ongoing ticket announcement for a specific guild.
   *
   * @param guild_id - The ID of the guild for which to fetch the active ticket announcement.
   * @returns An Observable that emits the announcement
   */
  getTicketAnnouncement(guild_id: string): Observable<TicketAnnouncement> {
    return this.http.get<TicketAnnouncement>(`${this.API_URL}/guilds/support-announcement?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Sets a new ticket announcement for a specific guild.
   *
   * @param announcement - The `TicketAnnouncement` object containing the announcement details.
   * @param guild_id - The ID of the guild for which the announcement is being set.
   * @returns An Observable emitting the server's response.
   */
  setAnnouncement(announcement: TicketAnnouncement, guild_id: string): Observable<Object> {
    return this.http.post(`${this.API_URL}/guilds/support-announcement?guild_id=${guild_id}`, announcement,
      { headers: this.authService.headers });
  }

  /**
   * Deletes the current ongoing ticket announcement for a specific guild.
   *
   * @param guild_id - The ID of the guild for which the ticket announcement is to be deleted.
   * @returns An Observable emitting the server's response.
   */
  deleteAnnouncement(guild_id: string): Observable<Object> {
    return this.http.delete(`${this.API_URL}/guilds/support-announcement?guild_id=${guild_id}`,
      { headers: this.authService.headers });
  }

  /**
   * Creates a new support theme for a specific guild.
   *
   * @param theme - The support theme object to be created.
   * @param guild_id - The ID of the guild for which the support theme is created.
   * @returns An Observable emitting the server's response.
   */
  createSupportTheme(theme: SupportTheme, guild_id: string): Observable<Object> {
    return this.http.post(`${this.API_URL}/guilds/support-themes?guild_id=${guild_id}`, theme,
      { headers: this.authService.headers });
  }

  /**
   * Edits an existing support theme for a specific guild.
   *
   * @param theme - The support theme object to be updated.
   * @param guild_id - The ID of the guild for which the support theme is being updated.
   * @returns An Observable emitting the server's response.
   */
  editSupportTheme(theme: SupportTheme, guild_id: string): Observable<Object> {
    return this.http.put(`${this.API_URL}/guilds/support-themes?guild_id=${guild_id}`, theme,
      { headers: this.authService.headers });
  }

  /**
   * Deletes a support theme for a specific guild.
   *
   * @param theme - The support theme object to be deleted.
   * @param guild_id - The ID of the guild from which the support theme is deleted.
   * @returns An Observable emitting the server's response.
   */
  deleteSupportTheme(theme: SupportTheme, guild_id: string): Observable<Object> {
    const themeName: string = theme.old_name && theme.old_name !== theme.name ? theme.old_name : theme.name;
    return this.http.delete(
      `${this.API_URL}/guilds/support-themes?guild_id=${guild_id}&theme_name=${encodeURIComponent(themeName)}`,
      { headers: this.authService.headers }
    );
  }

  /**
   * Sends a vote for a bot feature.
   *
   * @param data - The feature vote details to be sent.
   * @returns An Observable that emits the server's response.
   */
  sendFeatureVote(data: FeatureData): Observable<Object> {
    return this.http.post(`${this.API_URL}/progress/features`, data, { headers: this.authService.headers });
  }

  /**
   * Sends a bug report to the server.
   *
   * @param data - The data of the bug report to be sent.
   * @returns An Observable that emits the server's response.
   */
  sendBugReport(data: formGroupBug): Observable<Object> {
    return this.http.post(`${this.API_URL}/contact/bug`, data, { headers: this.authService.headers });
  }

  /**
   * Sends an idea suggestion to the server.
   *
   * @param data - The data of the idea suggestion to be sent.
   * @returns An Observable that emits the server's response.
   */
  sendIdeaSuggestion(data: formGroupIdea): Observable<Object> {
    return this.http.post(`${this.API_URL}/contact/idea`, data, { headers: this.authService.headers });
  }
}
