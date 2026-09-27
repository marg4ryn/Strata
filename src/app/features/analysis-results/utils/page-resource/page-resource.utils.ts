import { resource } from '@angular/core';

export function pageResource<T>(loaderFn: () => Promise<T>, requestKey: () => string) {
  return resource<T, string>({
    params: requestKey,
    loader: () => loaderFn(),
  });
}
