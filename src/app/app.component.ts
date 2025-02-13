import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {PageLoaderComponent} from "./structure/util/page-loader/page-loader.component";
import {LanguageSwitcherService} from "./services/language/language-switcher.service";
import {config} from "../environments/config";
import {DataHolderService} from "./services/data/data-holder.service";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, PageLoaderComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(private langService: LanguageSwitcherService, private dataService: DataHolderService) {
    this.langService.setLanguage();

    this.dataService.isDarkTheme = this.dataService.getThemeFromLocalStorage();
    this.dataService.applyTheme();

    // add Content-Security-Policy to header
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' " + config.api_url + "; object-src 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://cdn.discordapp.com; connect-src 'self' " + config.api_url + " https://discord.com;";
    document.getElementsByTagName('head')[0].appendChild(meta);
  }
}
