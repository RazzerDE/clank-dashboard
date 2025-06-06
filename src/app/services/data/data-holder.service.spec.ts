import { TestBed } from '@angular/core/testing';

import { DataHolderService } from './data-holder.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {Router} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";

describe('DataHolderService', () => {
  let service: DataHolderService;
  let router: Router;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()]
    });

    localStorage.setItem('active_guild', 'true');
    router = TestBed.inject(Router);
    translate = TestBed.inject(TranslateService);
    service = TestBed.inject(DataHolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();

    translate.use('en');
    expect(service.error_title).not.toBe('');
  });

  it('should return the correct CDN URL for emoji ID with isID true and isAnimated true', () => {
    const emojiId = '123456789';
    const result = service.getEmojibyId(emojiId, true, true);
    expect(result).toBe('https://cdn.discordapp.com/emojis/123456789.gif');
  });

  it('should return the correct CDN URL for emoji ID with isID true and isAnimated false', () => {
    const emojiId = '987654321';
    const result = service.getEmojibyId(emojiId, true, false);
    expect(result).toBe('https://cdn.discordapp.com/emojis/987654321.png');
  });

  it('should return the correct CDN URL for a static emoji string', () => {
    const emoji = '<:smile:123456789>';
    const result = service.getEmojibyId(emoji);
    expect(result).toBe('https://cdn.discordapp.com/emojis/123456789.png');
  });

  it('should return the correct CDN URL for an animated emoji string', () => {
    const emoji = '<a:wave:987654321>';
    const result = service.getEmojibyId(emoji);
    expect(result).toBe('https://cdn.discordapp.com/emojis/987654321.gif');
  });

  it('should return the original string if emoji format is invalid', () => {
    const emoji = 'not-an-emoji';
    const result = service.getEmojibyId(emoji);
    expect(result).toBe('not-an-emoji');
  });

  it('should return the input if emoji is empty', () => {
    const emoji = '';
    const result = service.getEmojibyId(emoji);
    expect(result).toBe('');
  });

  it('should redirect to error page with correct title and description for UNKNOWN error', () => {
    const routerSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    service.redirectLoginError('UNKNOWN');

    expect(service.error_title).toBe('ERROR_UNKNOWN_TITLE');
    expect(service.error_desc).toBe('ERROR_UNKNOWN_DESC');
    expect(routerSpy).toHaveBeenCalledWith('/errors/simple');
  });

  it('should redirect to error page with correct title and description for other error types', () => {
    const routerSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    service.redirectLoginError('NO_CLANK');

    expect(service.error_title).toBe('ERROR_LOGIN_NO_CLANK_TITLE');
    expect(service.error_desc).toBe('ERROR_LOGIN_NO_CLANK_DESC');
    expect(routerSpy).toHaveBeenCalledWith('/errors/simple');
  });

  it('should display an alert box with the specified title and description', () => {
    const title = 'Test Title';
    const desc = 'Test Description';
    service.showAlertBox = true;

    jest.useFakeTimers();
    service.showAlert(title, desc);
    jest.advanceTimersByTime(5001);

    expect(service.error_title).toBe(title);
    expect(service.error_desc).toBe(desc);
    expect(service.showAlertBox).toBeFalsy();

  });

  it('should return true if darkMode is set to "true" in localStorage', () => {
    localStorage.setItem('dark', 'true');

    let result: boolean = service.getThemeFromLocalStorage();

    expect(result).toBe(true);

    localStorage.removeItem('dark');

    result = service.getThemeFromLocalStorage();
    expect(result).toBe(false);
  });

  it('should toggle the theme and update localStorage', () => {
    const applyThemeSpy = jest.spyOn(service, 'applyTheme');
    service.isDarkTheme = false;

    service.toggleTheme();

    expect(service.isDarkTheme).toBe(true);
    expect(localStorage.getItem('dark')).toBe('true');
    expect(applyThemeSpy).toHaveBeenCalled();

    service.toggleTheme();

    expect(service.isDarkTheme).toBe(false);
    expect(localStorage.getItem('dark')).toBe('false');
    expect(applyThemeSpy).toHaveBeenCalledTimes(2);
  });

  it('should toggle the visibility of the mobile sidebar', () => {
    const initialVisibility = service.showMobileSidebar;
    service.toggleSidebar();
    expect(service.showMobileSidebar).toBe(!initialVisibility);
  });

  it('should redirect to FORBIDDEN error page on 403 status', () => {
    const redirectSpy = jest.spyOn(service, 'redirectLoginError');
    const errorResponse = new HttpErrorResponse({ status: 403 });

    service.handleApiError(errorResponse);

    expect(redirectSpy).toHaveBeenCalledWith('FORBIDDEN');
  });

  it('should redirect to NO_CLANK error page on 401 status', () => {
    const redirectSpy = jest.spyOn(service, 'redirectLoginError');
    const errorResponse = new HttpErrorResponse({ status: 401 });

    service.handleApiError(errorResponse);

    expect(redirectSpy).toHaveBeenCalledWith('NO_CLANK');
  });

  it('should redirect to REQUESTS error page on 429 status', () => {
    const redirectSpy = jest.spyOn(service, 'redirectLoginError');
    const errorResponse = new HttpErrorResponse({ status: 429 });

    service.handleApiError(errorResponse);

    expect(redirectSpy).toHaveBeenCalledWith('REQUESTS');
  });

  it('should redirect to OFFLINE error page on 0 status', () => {
    const redirectSpy = jest.spyOn(service, 'redirectLoginError');
    const errorResponse = new HttpErrorResponse({ status: 0 });

    service.handleApiError(errorResponse);

    expect(redirectSpy).toHaveBeenCalledWith('OFFLINE');
  });

  it('should set isLoading to false for other statuses', () => {
    const errorResponse = new HttpErrorResponse({ status: 500 });

    service.handleApiError(errorResponse);

    expect(service.isLoading).toBe(false);
  });

});
