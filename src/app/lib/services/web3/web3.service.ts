import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEventPattern, Subject } from 'rxjs';

export type WalletState = {
    address: string | null;
    chainId: string | null;
    isSupportedNetwork: boolean;
    isMetaMaskInstalled: boolean;
};

const SUPPORTED_CHAIN_IDS = ['0x1', '0x5', '0xaa36a7', '0x89']; // mainnet, goerli, sepolia, polygon (example)

const CHAIN_NAME_MAP: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0x3': 'Ropsten',
    '0x4': 'Rinkeby',
    '0x5': 'Goerli',
    '0xaa36a7': 'Sepolia',
    '0x89': 'Polygon',
};

const CHAIN_PARAMS: Record<string, any> = {
    '0x1': {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io'],
    },
    '0x5': {
        chainId: '0x5',
        chainName: 'Goerli',
        nativeCurrency: { name: 'Goerli Ether', symbol: 'GOR', decimals: 18 },
        rpcUrls: ['https://rpc.ankr.com/eth_goerli'],
        blockExplorerUrls: ['https://goerli.etherscan.io'],
    },
    '0xaa36a7': {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.org'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    '0x89': {
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
    },
};

@Injectable({
    providedIn: 'root',
})
export class Web3Service implements OnDestroy {
    address$ = new BehaviorSubject<string | null>(null);
    chainId$ = new BehaviorSubject<string | null>(null);
    networkName$ = new BehaviorSubject<string | null>(null);
    isSupportedNetwork$ = new BehaviorSubject<boolean>(true);
    isMetaMaskInstalled$ = new BehaviorSubject<boolean>(false);

    private _destroy$ = new Subject<void>();

    constructor() {
        this._init();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    private _init(): void {
        const w = window as any;
        if (w && w.ethereum) {
            this.isMetaMaskInstalled$.next(true);

            // read initial chainId if available
            if (w.ethereum.chainId) {
                this._handleChainChanged(w.ethereum.chainId);
            }

            // read initial accounts if available
            // some providers expose selectedAddress
            const addr = w.ethereum.selectedAddress || null;
            if (addr) {
                this.address$.next(this._normalizeAddress(addr));
            }

            // attach listeners
            w.ethereum.on('accountsChanged', (accounts: string[]) => this._handleAccountsChanged(accounts));
            w.ethereum.on('chainChanged', (chainId: string) => this._handleChainChanged(chainId));
        } else {
            this.isMetaMaskInstalled$.next(false);
        }
    }

    async connect(): Promise<string | null> {
        const w = window as any;
        if (!w || !w.ethereum) {
            this.isMetaMaskInstalled$.next(false);
            throw new Error('MetaMask not installed');
        }

        try {
            const accounts: string[] = await w.ethereum.request({ method: 'eth_requestAccounts' });
            this._handleAccountsChanged(accounts);
            const chainId = await w.ethereum.request({ method: 'eth_chainId' });
            this._handleChainChanged(chainId);
            return this.address$.getValue();
        } catch (err) {
            console.error('User rejected or error connecting to MetaMask', err);
            throw err;
        }
    }

    /**
     * Attempts to switch MetaMask to a supported network. If the chain is unknown to the wallet
     * it will try to add the chain using `wallet_addEthereumChain` with known params.
     */
    async switchToSupportedNetwork(): Promise<void> {
        const w = window as any;
        if (!w || !w.ethereum) {
            throw new Error('MetaMask not installed');
        }

        const current = this.chainId$.getValue();
        const target = SUPPORTED_CHAIN_IDS.find((id) => id !== current) || SUPPORTED_CHAIN_IDS[0];

        try {
            await w.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: target }] });
        } catch (err: any) {
            // 4902: Unrecognized chain. Try to add it if we have params
            const code = err && (err.code || (err.data && err.data.code));
            if (code === 4902) {
                const params = CHAIN_PARAMS[target];
                if (params) {
                    await w.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
                } else {
                    throw err;
                }
            } else {
                throw err;
            }
        }
    }

    disconnect(): void {
        // MetaMask does not provide programmatic disconnect; clear local state
        this.address$.next(null);
    }

    private _handleAccountsChanged(accounts: string[] | null | undefined): void {
        const addr = accounts && accounts.length > 0 ? accounts[0] : null;
        this.address$.next(addr ? this._normalizeAddress(addr) : null);
    }

    private _handleChainChanged(chainId: string | null | undefined): void {
        const cid = chainId || null;
        this.chainId$.next(cid);
        const supported = cid ? SUPPORTED_CHAIN_IDS.includes(cid) : false;
        this.isSupportedNetwork$.next(supported);
        const name = cid ? CHAIN_NAME_MAP[cid] || `Chain ${cid}` : null;
        this.networkName$.next(name);
    }

    private _normalizeAddress(address: string): string {
        return address;
    }
}
