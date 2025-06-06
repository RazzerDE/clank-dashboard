import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportThemeAddComponent } from './support-theme-add.component';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {of, Subscription, throwError} from "rxjs";
import {SupportTheme} from "../../../../../services/types/Tickets";
import {HttpErrorResponse} from "@angular/common/http";
import {DataHolderService} from "../../../../../services/data/data-holder.service";
import {ApiService} from "../../../../../services/api/api.service";
import {Emoji, Role} from "../../../../../services/types/discord/Guilds";

describe('SupportThemeAddComponent', () => {
  let component: SupportThemeAddComponent;
  let fixture: ComponentFixture<SupportThemeAddComponent>;

  let mockApiService: any;
  let mockDataService: any;

  beforeEach(async () => {

    mockApiService = {
      createSupportTheme: jest.fn(),
      editSupportTheme: jest.fn(),
    };
    mockDataService = {
      faq_answer: 'Test FAQ',
      active_guild: { id: 'guild1' },
      support_themes: [],
      error_color: '',
      showAlert: jest.fn(),
      getEmojibyId: jest.fn(),
      initTheme: { name: '', desc: '', faq_answer: '', roles: [] },
    };

    await TestBed.configureTestingModule({
      imports: [SupportThemeAddComponent, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [TranslateService,
        { provide: ActivatedRoute, useValue: {} },
        { provide: ApiService, useValue: mockApiService },
        { provide: DataHolderService, useValue: mockDataService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportThemeAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return false for isDefaultMentioned by default', () => {
    expect(component.isDefaultMentioned('anyRoleId')).toBe(false);
  });

  it('should call API, update data, show success alert and close modal on successful addSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    const pushSpy = jest.spyOn(mockDataService.support_themes, 'push');
    const updateThemesSpy = jest.spyOn(component as any, 'updateThemes');
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.createSupportTheme.mockReturnValue(of({}));
    localStorage.removeItem('support_themes');

    component.newTheme = { ...theme };
    component['addSupportTheme'](theme);

    expect(mockApiService.createSupportTheme).toHaveBeenCalledWith(theme, 'guild1');
    expect(mockDataService.error_color).toBe('green');
    expect(mockDataService.showAlert).toHaveBeenCalledWith('SUCCESS_THEME_CREATION_TITLE', 'SUCCESS_THEME_CREATION_DESC');
    expect(pushSpy).toHaveBeenCalledWith(theme);
    expect(updateThemesSpy).toHaveBeenCalled();
    expect(localStorage.getItem('support_themes')).toBeTruthy();
    expect(component.newTheme).toEqual(mockDataService.initTheme);
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should show conflict alert and close modal on 409 error in addSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.createSupportTheme.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 }))
    );
    component.newTheme = { ...theme };
    component['addSupportTheme'](theme);

    expect(mockDataService.error_color).toBe('red');
    expect(mockDataService.showAlert).toHaveBeenCalledWith('ERROR_THEME_CREATION_CONFLICT', 'ERROR_THEME_CREATION_CONFLICT_DESC');
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should show unknown error alert, reset newTheme and close modal on other error in addSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.createSupportTheme.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    component.newTheme = { ...theme };
    component['addSupportTheme'](theme);

    expect(mockDataService.error_color).toBe('red');
    expect(mockDataService.showAlert).toHaveBeenCalledWith('ERROR_UNKNOWN_TITLE', 'ERROR_UNKNOWN_DESC');
    expect(component.newTheme).toEqual(mockDataService.initTheme);
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should push the subscription to the subscriptions array', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    mockApiService.createSupportTheme.mockReturnValue(of({}));
    component.newTheme = { ...theme };
    const initialLength = component['subscriptions'].length;
    component['addSupportTheme'](theme);
    expect(component['subscriptions'].length).toBe(initialLength + 1);
    expect(component['subscriptions'][0]).toBeInstanceOf(Subscription);
  });

  it('should call API, update data, show success alert and close modal on successful editSupportTheme', () => {
    localStorage.removeItem('support_themes');
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    mockDataService.support_themes = [{ ...theme }];
    const updateThemeMentionsSpy = jest.spyOn(component as any, 'updateThemeMentions');
    const updateThemesSpy = jest.spyOn(component as any, 'updateThemes');
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.editSupportTheme.mockReturnValue(of({}));
    component.newTheme = { ...theme };

    component['editSupportTheme'](theme);

    expect(mockApiService.editSupportTheme).toHaveBeenCalledWith(theme, 'guild1');
    expect(mockDataService.error_color).toBe('green');
    expect(mockDataService.showAlert).toHaveBeenCalledWith(
      expect.stringContaining('SUCCESS_THEME_EDIT_TITLE'),
      expect.stringContaining('SUCCESS_THEME_EDIT_DESC')
    );

    expect(updateThemeMentionsSpy).toHaveBeenCalled();
    expect(mockDataService.support_themes[0]).toEqual(theme);
    expect(updateThemesSpy).toHaveBeenCalled();
    expect(localStorage.getItem('support_themes')).toBeTruthy();
    expect(component.newTheme).toEqual(mockDataService.initTheme);
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should show conflict alert and close modal on 400 error in editSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '', old_name: 'OldName' } as SupportTheme;
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.editSupportTheme.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 }))
    );
    component.newTheme = { ...theme };

    component['editSupportTheme'](theme);

    expect(mockDataService.error_color).toBe('red');
    expect(mockDataService.showAlert).toHaveBeenCalledWith(
      expect.stringContaining('ERROR_THEME_EDIT_CONFLICT'),
      expect.stringContaining('ERROR_THEME_EDIT_CONFLICT_DESC')
    );
    expect(component.newTheme).toEqual(mockDataService.initTheme);
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should show unknown error alert, reset newTheme and close modal on other error in editSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '', old_name: 'OldName' } as SupportTheme;
    const hideModalSpy = jest.spyOn(component as any, 'hideModal');
    mockApiService.editSupportTheme.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    component.newTheme = { ...theme };

    component['editSupportTheme'](theme);

    expect(mockDataService.error_color).toBe('red');
    expect(mockDataService.showAlert).toHaveBeenCalledWith(
      expect.stringContaining('ERROR_UNKNOWN_TITLE'),
      expect.stringContaining('ERROR_UNKNOWN_DESC')
    );
    expect(component.newTheme).toEqual(mockDataService.initTheme);
    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should push the subscription to the subscriptions array for editSupportTheme', () => {
    const theme = { id: '1', name: 'Test', desc: 'Desc', faq_answer: '', roles: [], icon: '' } as SupportTheme;
    mockApiService.editSupportTheme.mockReturnValue(of({}));
    component.newTheme = { ...theme };
    const initialLength = (component as any).subscriptions.length;
    component['editSupportTheme'](theme);
    expect((component as any).subscriptions.length).toBe(initialLength + 1);
    expect((component as any).subscriptions[0]).toBeInstanceOf(Subscription);
  });

  it('should sort support_themes by pending status and then by name', () => {
    const themeA = { name: 'Alpha', pending: false } as SupportTheme;
    const themeB = { name: 'Beta', pending: true } as SupportTheme;
    const themeC = { name: 'Charlie', pending: false } as SupportTheme;
    const themeD = { name: 'Bravo', pending: true } as SupportTheme;

    mockDataService.support_themes = [themeB, themeA, themeD, themeC];

    component['updateThemes']();

    expect(mockDataService.support_themes).toEqual([
      themeA, // non-pending, Alpha
      themeC, // non-pending, Charlie
      themeB, // pending, Beta
      themeD  // pending, Bravo
    ]);
  });

  it('should convert string role IDs to Role objects and add missing default roles', () => {
    const mockRole1 = { id: '1', name: 'Role1' } as Role;
    const mockRole2 = { id: '2', name: 'Role2' } as Role;
    const mockRole3 = { id: '3', name: 'Role3' } as Role;
    const defaultRole = { id: '4', name: 'DefaultRole' } as Role;

    component.discordRoles = [mockRole1, mockRole2, mockRole3, defaultRole];
    component.newTheme.roles = ['1', '2'] as any;
    mockDataService.support_themes = [{ default_roles: [defaultRole] } as any];

    component['updateThemeMentions']();

    expect(component.newTheme.roles).toEqual([mockRole1, mockRole2, defaultRole]);
  });

  it('should not add duplicate default roles if already present', () => {
    const mockRole1 = { id: '1', name: 'Role1' } as Role;
    const defaultRole = { id: '2', name: 'DefaultRole' } as Role;

    component.discordRoles = [mockRole1, defaultRole];
    component.newTheme.roles = [mockRole1, defaultRole];
    mockDataService.support_themes = [{ default_roles: [defaultRole] } as any];

    component['updateThemeMentions']();

    // Default role should not be duplicated
    expect(component.newTheme.roles).toEqual([mockRole1, defaultRole]);
  });

  it('should do nothing if newTheme.roles is not an array', () => {
    component.newTheme.roles = undefined as any;
    mockDataService.support_themes = [];

    expect(() => component['updateThemeMentions']()).not.toThrow();
  });

  it('should do nothing if there are no support_themes', () => {
    component.newTheme.roles = [];
    mockDataService.support_themes = [];

    component['updateThemeMentions']();

    expect(component.newTheme.roles).toEqual([]);
  });

  it('should do nothing if default_roles is missing or empty', () => {
    component.newTheme.roles = [];
    mockDataService.support_themes = [{} as any];

    component['updateThemeMentions']();

    expect(component.newTheme.roles).toEqual([]);

    mockDataService.support_themes = [{ default_roles: [] } as any];
    component['updateThemeMentions']();

    expect(component.newTheme.roles).toEqual([]);
  });

  it('should add the hidden class to modal and backdrop when hideModal is called', () => {
    const backdrop = document.createElement('div');
    backdrop.id = 'modal_backdrop';
    backdrop.classList.remove('hidden');
    document.body.appendChild(backdrop);

    const modal = document.createElement('div');
    modal.id = 'modal_container';
    modal.classList.remove('hidden');
    document.body.appendChild(modal);

    const backdropSpy = jest.spyOn(backdrop.classList, 'add');
    const modalSpy = jest.spyOn(modal.classList, 'add');

    (component as any).hideModal();

    expect(backdropSpy).toHaveBeenCalledWith('hidden');
    expect(modalSpy).toHaveBeenCalledWith('hidden');
    expect(backdrop.classList.contains('hidden')).toBe(true);
    expect(modal.classList.contains('hidden')).toBe(true);

    document.body.removeChild(backdrop);
    document.body.removeChild(modal);
  });

  it('should set FAQ preview to placeholder if textarea is empty', () => {
    const event = {
      target: { value: '' }
    } as unknown as KeyboardEvent;
    const mockInnerHtml = { innerHTML: '' };
    component.discordMarkdown = { faqPreview: { nativeElement: mockInnerHtml } } as any;
    jest.spyOn(component['translate'], 'instant').mockReturnValue('PLACEHOLDER');
    component['updateFAQPreview'](event);
    expect(mockInnerHtml.innerHTML).toBe('PLACEHOLDER');
  });

  it('should set FAQ preview to markdown transformed value if textarea is not empty', () => {
    const event = {
      target: { value: 'Test **Markdown**' }
    } as unknown as KeyboardEvent;
    const mockInnerHtml = { innerHTML: '' };
    component.discordMarkdown = { faqPreview: { nativeElement: mockInnerHtml } } as any;
    jest.spyOn(component['markdownPipe'], 'transform').mockReturnValue('<b>Test</b>');
    component['updateFAQPreview'](event);
    expect(mockInnerHtml.innerHTML).toBe('<b>Test</b>');
  });

  it('should return true if object is of type Emoji', () => {
    const emoji = {id: '123', name: 'smile'} as unknown as Emoji;
    expect(component.isEmojiType(emoji)).toBe(true);
  });

  it('should return false if object is a string', () => {
    const emojiString = 'smile';
    expect(component.isEmojiType(emojiString)).toBe(false);
  });

  it('should return false for non-FAQ theme when name and desc are filled', () => {
    component.newTheme.name = 'Test';
    component.newTheme.desc = 'Description';
    mockDataService.isFAQ = false;
    expect(component.isThemeInvalid()).toBe(false);
  });

  it('should return true for non-FAQ theme when name is empty', () => {
    component.newTheme.name = '';
    component.newTheme.desc = 'Description';
    mockDataService.isFAQ = false;
    expect(component.isThemeInvalid()).toBe(true);
  });

  it('should return true for non-FAQ theme when desc is empty', () => {
    component.newTheme.name = 'Test';
    component.newTheme.desc = '';
    mockDataService.isFAQ = false;
    expect(component.isThemeInvalid()).toBe(true);
  });

  it('should return false for FAQ theme when name, desc, and faq_answer are filled', () => {
    component.newTheme.name = 'Test';
    component.newTheme.desc = 'Description';
    mockDataService.isFAQ = true;
    mockDataService.faq_answer = 'FAQ';
    expect(component.isThemeInvalid()).toBe(false);
  });

  it('should return true for FAQ theme when faq_answer is empty', () => {
    component.newTheme.name = 'Test';
    component.newTheme.desc = 'Description';
    mockDataService.isFAQ = true;
    mockDataService.faq_answer = '';
    expect(component.isThemeInvalid()).toBe(true);
  });

  it('should return true for FAQ theme when name is empty', () => {
    component.newTheme.name = '';
    component.newTheme.desc = 'Description';
    mockDataService.isFAQ = true;
    mockDataService.faq_answer = 'FAQ';
    expect(component.isThemeInvalid()).toBe(true);
  });

  it('should return true for FAQ theme when desc is empty', () => {
    component.newTheme.name = 'Test';
    component.newTheme.desc = '';
    mockDataService.isFAQ = true;
    mockDataService.faq_answer = 'FAQ';
    expect(component.isThemeInvalid()).toBe(true);
  });

  it('should update the theme icon and guild_id, and close the emoji picker', () => {
    const emoji = { id: '123', animated: true } as Emoji;
    const mockIcon = '<emoji>';
    const mockGuildId = 'guild-1';
    jest.spyOn(component['dataService'], 'getEmojibyId').mockReturnValue(mockIcon);
    component['dataService'].active_guild = { id: mockGuildId } as any;
    component.newTheme = {} as any;
    component['showEmojiPicker'] = true;

    component.updateThemeIcon(emoji);

    expect(component.newTheme.icon).toBe(mockIcon);
    expect(component['dataService'].getEmojibyId).toHaveBeenCalledWith('123', true, true);
    expect(component.newTheme.guild_id).toBe(mockGuildId);
    expect(component['showEmojiPicker']).toBe(false);
  });

  it('should hide the emoji picker when a document click occurs and showEmojiPicker is true', () => {
    component['showEmojiPicker'] = true;
    component.onDocumentClick();
    expect(component['showEmojiPicker']).toBe(false);
  });

  it('should not change showEmojiPicker when a document click occurs and showEmojiPicker is false', () => {
    component['showEmojiPicker'] = false;
    component.onDocumentClick();
    expect(component['showEmojiPicker']).toBe(false);
  });
});
