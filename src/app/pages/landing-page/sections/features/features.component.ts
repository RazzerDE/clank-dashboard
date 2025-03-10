import { Component } from '@angular/core';
import {NgClass, NgOptimizedImage} from "@angular/common";
import {TranslatePipe} from "@ngx-translate/core";
import { feature_items } from '../../../../services/types/landing-page/feature-item';

@Component({
    selector: 'landing-section-features',
    imports: [
        NgOptimizedImage,
        NgClass,
        TranslatePipe
    ],
    templateUrl: './features.component.html',
    styleUrl: './features.component.scss'
})
export class LandingSectionFeaturesComponent {
  protected readonly feature_items = feature_items;

  /**
   * Toggles fullscreen mode for a video element.
   *
   * @param {string} video_id - The ID of the video element to toggle fullscreen.
   * @param {Event} [event] - Optional event parameter. If provided, requests fullscreen mode.
   */
  toggleFullscreen(video_id: string, event?: Event): void {
    const videoElement = document.getElementById(video_id) as HTMLVideoElement;
    if (event) {
      videoElement.requestFullscreen().then();
    } else {
      videoElement.classList.toggle('cursor-pointer');
    }

  }
}
