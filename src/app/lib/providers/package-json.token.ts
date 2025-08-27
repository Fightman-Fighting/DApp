import { InjectionToken, Provider } from '@angular/core';
import pkg from '../../../../package.json';

type PackageJson = {
    name: string;
    version: string;
};

export const {name, version} = pkg;
export const PACKAGE_JSON = new InjectionToken<PackageJson>('PACKAGE_JSON');

export const providePackageJson = (): Provider => ({
    provide: PACKAGE_JSON,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    useValue: { name, version } as PackageJson,
});
