import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Web3Service } from '@lib/services';
import { LogoComponent } from '../logo/logo.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule, LogoComponent],
    templateUrl: './navbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
    private readonly _router = inject(Router);
    private readonly _authService = inject(AuthService);
    private readonly _web3 = inject(Web3Service);

    // Expose observables for template
    address$ = this._web3.address$;
    chainId$ = this._web3.chainId$;
    networkName$ = this._web3.networkName$;
    isSupportedNetwork$ = this._web3.isSupportedNetwork$;
    isMetaMaskInstalled$ = this._web3.isMetaMaskInstalled$;

    onClickSignOut(): void {
        this._authService.logout();
        this._router.navigate(['/auth/login']);
    }

    async onClickConnect(): Promise<void> {
        try {
            await this._web3.connect();
        } catch (err) {
            // ignore, user may have rejected
        }
    }

    onClickDisconnect(): void {
        this._web3.disconnect();
    }

    async onClickSwitchNetwork(): Promise<void> {
        try {
            await this._web3.switchToSupportedNetwork();
        } catch (err) {
            console.error('Failed to switch network', err);
        }
    }
}
