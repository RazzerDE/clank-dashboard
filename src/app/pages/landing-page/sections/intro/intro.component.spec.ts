import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroComponent } from './intro.component';
import {ElementRef} from "@angular/core";
import {AnimationService} from "../../../../services/animation/animation.service";
import {ActivatedRoute} from "@angular/router";
import {TranslateModule} from "@ngx-translate/core";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {GeneralStats} from "../../../../services/types/Statistics";
import {of} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {DataHolderService} from "../../../../services/data-holder.service";

describe('IntroComponent', () => {
  let component: IntroComponent;
  let fixture: ComponentFixture<IntroComponent>;
  let animationService: AnimationService;
  let apiService: ApiService;
  let dataService: DataHolderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroComponent, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [ { provide: ActivatedRoute, useValue: {} }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntroComponent);
    component = fixture.componentInstance;
    animationService = TestBed.inject(AnimationService);
    apiService = TestBed.inject(ApiService);
    dataService = TestBed.inject(DataHolderService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call startSliding and start star animation in ngAfterViewInit', () => {
    const startSlidingSpy = jest.spyOn(component, 'startSliding');
    const setCanvasIDSpy = jest.spyOn(animationService, 'setCanvasID');
    const startAnimationSpy = jest.spyOn(animationService, 'startAnimation');

    component.ngAfterViewInit();

    expect(startSlidingSpy).toHaveBeenCalled();
    expect(setCanvasIDSpy).toHaveBeenCalledWith('intro-canvas', 'star');
    expect(startAnimationSpy).toHaveBeenCalledWith('intro-canvas');
  });

  it('should fetch and update bot statistics', () => {
    const mockStats: GeneralStats = {
      user_count: 1000,
      guild_count: 100,
      giveaway_count: 50,
      ticket_count: 20,
      punish_count: 10,
      global_verified_count: 5
    };

    jest.spyOn(apiService, 'getGeneralStats').mockReturnValue(of(mockStats));

    component.getBotStats();

    expect(dataService.bot_stats).toEqual({
      user_count: '1.000',
      guild_count: '100',
      giveaway_count: '50',
      ticket_count: '20',
      punish_count: '10',
      global_verified_count: '5'
    });
  });

  it('should start sliding when startSliding is called', () => {
    (component as any).isPaused = false;

    jest.spyOn(component, 'slide');


    jest.useFakeTimers();
    component.startSliding();
    jest.advanceTimersByTime(30);

    expect((component as any).slidingInterval).toBeDefined();
    expect((component as any).slide).toHaveBeenCalled();
  });

  it('should reset the position to avoid visual jump when the slider has moved past the first set of items', () => {
    component['currentTranslate'] = -1000; // Set a value to ensure the if path is taken

    jest.useFakeTimers();
    component.slide();

    expect(component['isResetting']).toBe(true);
    expect(component['currentTranslate']).toBe(0);

    jest.advanceTimersByTime(5);

    expect(component['isResetting']).toBe(false);
  });

  it('should apply grayscale filter on mouseenter and remove it on mouseleave', () => {
    const sliderItem = document.createElement('div');
    sliderItem.classList.add('slider-item');
    (component as any).slider = {nativeElement: {querySelectorAll: () => [sliderItem]}} as unknown as ElementRef<HTMLDivElement>;

    const mouseEnterEvent = new MouseEvent('mouseenter');
    const mouseLeaveEvent = new MouseEvent('mouseleave');

    component.activeSlide(mouseEnterEvent);
    expect(sliderItem.style.filter).toBe('grayscale(100%)');

    component.activeSlide(mouseLeaveEvent);
    expect(sliderItem.style.filter).toBe('none');
  });
});
