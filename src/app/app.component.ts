import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logInOutline,
  personCircleOutline,
  trash,
  refreshOutline,
  arrowBackOutline,
  gridOutline,
  leafOutline,
  ribbonOutline,
  trendingUpOutline,
  mapOutline,
  informationCircleOutline,
  trophyOutline,
  optionsOutline,
  navigateOutline,
  chevronForward,
  locationOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      'log-in-outline': logInOutline,
      'person-circle-outline': personCircleOutline,
      trash,
      'refresh-outline': refreshOutline,
      'arrow-back-outline': arrowBackOutline,
      'grid-outline': gridOutline,
      'leaf-outline': leafOutline,
      'ribbon-outline': ribbonOutline,
      'trending-up-outline': trendingUpOutline,
      'map-outline': mapOutline,
      'information-circle-outline': informationCircleOutline,
      'trophy-outline': trophyOutline,
      'options-outline': optionsOutline,
      'navigate-outline': navigateOutline,
      'chevron-forward': chevronForward,
      'location-outline': locationOutline
    });
  }
}
