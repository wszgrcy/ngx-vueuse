import {
  ɵINJECTOR_SCOPE,
  provideZonelessChangeDetection,
  ɵisEnvironmentProviders,
  Injector,
  Provider,
  EnvironmentInjector,
  runInInjectionContext,
  ErrorHandler,
} from '@angular/core';

export { runInInjectionContext };

export const createInjector = () => {
  const instance = Injector.create({
    providers: [
      { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
      ...(() => {
        const zone = provideZonelessChangeDetection();
        if (ɵisEnvironmentProviders(zone)) {
          return zone.ɵproviders as Provider[];
        }
        throw new Error('ɵproviders not found');
      })(),
      { provide: EnvironmentInjector, useFactory: () => instance },
      { provide: ErrorHandler, useFactory: () => new ErrorHandler() },
    ],
  });
  return instance;
};
