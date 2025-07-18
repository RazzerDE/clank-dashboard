import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import { WishlistComponent } from './wishlist.component';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ElementRef} from "@angular/core";
import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {defer, of} from "rxjs";
import {ApiService} from "../../../../services/api/api.service";
import {DiscordUser} from "../../../../services/types/discord/User";
import {Feature, FeatureVotes, Tag} from "../../../../services/types/navigation/WishlistTags";

describe('WishlistComponent', () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let apiService: ApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WishlistComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: ApiService, useValue: { getFeatureVotes: () => of({ featureVotes: [] }),
                sendFeatureVote: () => of({}) } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
    .compileComponents();

    apiService = TestBed.inject(ApiService);
    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle successful feature vote', fakeAsync(() => {
    const featureId = 1;
    const vote = true;
    const cooldownFeature = { featureId, onCooldown: false, isLoading: false };
    component['isOnCooldown'] = [cooldownFeature];
    component['dataService'].profile = { id: "123" } as DiscordUser;

    const sendFeatureVoteSpy = jest.spyOn(apiService, 'sendFeatureVote').mockReturnValue(defer(() => Promise.resolve({})));
    const getFeatureVotesSpy = jest.spyOn(component, 'getFeatureVotes');
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');

    component.sendFeatureVote(featureId, vote);
    tick();

    expect(sendFeatureVoteSpy).toHaveBeenCalledWith({ feature_id: 1, user_id: "123", vote });
    expect(getFeatureVotesSpy).toHaveBeenCalled();
    expect(cooldownFeature.isLoading).toBe(false);
    expect(component['dataService'].error_color).toBe('green');
    expect(showAlertSpy).toHaveBeenCalledWith('SUCCESS_VOTE_TITLE', 'SUCCESS_VOTE_DESC');

    sendFeatureVoteSpy.mockRestore();
    getFeatureVotesSpy.mockRestore();
    showAlertSpy.mockRestore();
  }));

  it('should handle error when feature vote fails', fakeAsync(() => {
    const featureId = 1;
    const vote = true;
    const cooldownFeature = { featureId, onCooldown: false, isLoading: false };
    component['isOnCooldown'] = [cooldownFeature];
    component['dataService'].profile = { id: "123" } as DiscordUser;

    const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    const sendFeatureVoteSpy = jest.spyOn(apiService, 'sendFeatureVote').mockReturnValue(defer(() => Promise.reject(errorResponse)));
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');

    component.sendFeatureVote(featureId, vote);
    tick();

    expect(sendFeatureVoteSpy).toHaveBeenCalledWith({ feature_id: 1, user_id: "123", vote });
    expect(component['dataService'].error_color).toBe('red');
    expect(showAlertSpy).toHaveBeenCalledWith('ERROR_UNKNOWN_TITLE', 'ERROR_UNKNOWN_DESC');
    expect(cooldownFeature.isLoading).toBe(false);

    sendFeatureVoteSpy.mockRestore();
    showAlertSpy.mockRestore();

    // return if profile is not set
    component['dataService'].profile = null;
    component.sendFeatureVote(featureId, vote);
    expect(sendFeatureVoteSpy).not.toHaveBeenCalled();
  }));

  it('should handle 304 error when feature vote fails', fakeAsync(() => {
    const vote = true;
    const cooldownFeature = { featureId: 1, onCooldown: false, isLoading: false };
    component['isOnCooldown'] = [cooldownFeature];
    component['dataService'].profile = { id: "123" } as DiscordUser;

    const errorResponse = new HttpErrorResponse({ status: 304, statusText: 'Not Modified' });
    const sendFeatureVoteSpy = jest.spyOn(apiService, 'sendFeatureVote').mockReturnValue(defer(() => Promise.reject(errorResponse)));
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');

    component.sendFeatureVote(1, vote);
    tick();

    expect(sendFeatureVoteSpy).toHaveBeenCalledWith({ feature_id: 1, user_id: "123", vote });
    expect(component['dataService'].error_color).toBe('red');
    expect(showAlertSpy).toHaveBeenCalledWith('ERROR_VOTE_SAME_TITLE', 'ERROR_VOTE_SAME_DESC');
    expect(cooldownFeature.isLoading).toBe(false);

    sendFeatureVoteSpy.mockRestore();
    showAlertSpy.mockRestore();
  }));

  it('should handle 429 error when feature vote fails', fakeAsync(() => {
    const vote = true;
    const cooldownFeature = { featureId: 1, onCooldown: false, isLoading: false };
    component['isOnCooldown'] = [cooldownFeature];
    component['dataService'].profile = { id: "123" } as DiscordUser;

    const errorResponse = new HttpErrorResponse({ status: 429, statusText: 'Too many requests' });
    const sendFeatureVoteSpy = jest.spyOn(apiService, 'sendFeatureVote').mockReturnValue(defer(() => Promise.reject(errorResponse)));
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');
    const redirectLoginErrorSpy = jest.spyOn(component['dataService'], 'redirectLoginError').mockImplementation(() => {});

    component.sendFeatureVote(1, vote);
    tick();

    expect(sendFeatureVoteSpy).toHaveBeenCalledWith({ feature_id: 1, user_id: "123", vote });
    expect(component['dataService'].error_color).toBe('red');
    expect(showAlertSpy).not.toHaveBeenCalled();
    expect(redirectLoginErrorSpy).toHaveBeenCalledWith('REQUESTS');

    sendFeatureVoteSpy.mockRestore();
    showAlertSpy.mockRestore();
    redirectLoginErrorSpy.mockRestore();
  }));

  it('should retrieve feature votes and update feature list', fakeAsync(() => {
    const featureVotesMock = {
      featureVotes: [
        { id: 1, votes: 10, dislikes: 2 },
        { id: 2, votes: 5, dislikes: 1 }
      ]
    } as FeatureVotes;

    const getFeatureVotesSpy = jest.spyOn(apiService, 'getFeatureVotes').mockReturnValue(defer(() => Promise.resolve(featureVotesMock)));

    component.getFeatureVotes();
    tick();

    expect(component['feature_list'][0].votes).toBe(10);
    expect(component['feature_list'][0].dislikes).toBe(2);
    expect(component['feature_list'][1].votes).toBe(5);
    expect(component['feature_list'][1].dislikes).toBe(1);
    expect(component['isOnCooldown'].length).toBe(2);
    expect(component['isOnCooldown'][0].featureId).toBe(1);
    expect(component['isOnCooldown'][1].featureId).toBe(2);
    expect(component['dataService'].isLoading).toBe(false);

    getFeatureVotesSpy.mockRestore();
  }));

  it('should handle error when retrieving feature votes', fakeAsync(() => {
    const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    const getFeatureVotesSpy = jest.spyOn(apiService, 'getFeatureVotes').mockReturnValue(defer(() => Promise.reject(errorResponse)));
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');

    component.getFeatureVotes();
    tick();

    expect(component['dataService'].error_color).toBe('red');
    expect(showAlertSpy).toHaveBeenCalledWith('ERROR_VOTE_SAME_TITLE', 'ERROR_VOTE_SAME_DESC');
    expect(component['dataService'].isLoading).toBe(false);

    getFeatureVotesSpy.mockRestore();
    showAlertSpy.mockRestore();
  }));

  it('should handle ratelimit error when retrieving feature votes', fakeAsync(() => {
    const errorResponse = new HttpErrorResponse({ status: 429, statusText: 'Too many requests' });

    const getFeatureVotesSpy = jest.spyOn(apiService, 'getFeatureVotes').mockReturnValue(defer(() => Promise.reject(errorResponse)));
    const showAlertSpy = jest.spyOn(component['dataService'], 'showAlert');
    const redirectLoginErrorSpy = jest.spyOn(component['dataService'], 'redirectLoginError').mockImplementation(() => {});

    component.getFeatureVotes();
    tick();

    expect(component['dataService'].error_color).toBe('red');
    expect(showAlertSpy).not.toHaveBeenCalledWith();
    expect(component['dataService'].isLoading).toBe(false);
    expect(redirectLoginErrorSpy).toHaveBeenCalledWith('REQUESTS');

    getFeatureVotesSpy.mockRestore();
    showAlertSpy.mockRestore();
    redirectLoginErrorSpy.mockRestore();
  }));

  it('should filter features based on tag ID', () => {
    const featureListMock = [
      { id: 1, tag_id: 2, enabled: false },
      { id: 2, tag_id: 3, enabled: true },
      { id: 3, tag_id: 2, enabled: false }
    ] as Feature[];
    const tagsMock = [
      { id: 1, isActive: false },
      { id: 2, isActive: true },
      { id: 3, isActive: false }
    ] as Tag[];

    component['feature_list'] = featureListMock;
    component['tags'] = tagsMock;

    component.filterFeatures(1);
    expect(component['allItemsDisabled']).toBe(false);

    component.filterFeatures(2);
    expect(component['tags'][1].isActive).toBe(true);
  });

  it('should filter features based on search input', () => {
    const translateService = TestBed.inject(TranslateService);
    const translateSpy = jest.spyOn(translateService, 'instant').mockImplementation((key: string | string[]) => Array.isArray(key) ? key.join(',') : key);

    const searchEvent = {target: {value: 'searchTerm'}} as unknown as KeyboardEvent;
    component.searchFeatures(searchEvent);

    component['feature_list'].forEach(feature => {
      const isEnabled = feature.name.includes('searchTerm') || feature.desc.includes('searchTerm');
      expect(feature.enabled).toBe(isEnabled);
    });

    expect(component['allItemsDisabled']).toBe(component['feature_list'].every(f => !f.enabled));

    translateSpy.mockRestore();
  });

  it('should set the responsive height of the wishlist container', () => {
    const dividerMock = { nativeElement: { offsetHeight: 100 } } as ElementRef<HTMLDivElement>;
    const wishlistContainerMock = { nativeElement: { style: { height: '' } } } as ElementRef<HTMLDivElement>;

    component['divider'] = dividerMock;
    component['wishlistContainer'] = wishlistContainerMock;

    (component as any).setResponsiveHeight();

    expect(wishlistContainerMock.nativeElement.style.height).toBe('100px');
  });

  it('should return true if the feature is in a loading state', () => {
    component['isOnCooldown'] = [{ featureId: 1, onCooldown: false, isLoading: true }];
    expect(component.isLoadingActive(1)).toBe(true);
  });

  it('should return true if the feature is not in a ccooldown state', () => {
    component['isOnCooldown'] = [{ featureId: 1, onCooldown: true, isLoading: false }];
    expect(component.isCooldownActive(1)).toBe(true);
  });
});
