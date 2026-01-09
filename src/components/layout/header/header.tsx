import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import useIsGrowthbookIsLoaded from '@/hooks/growthbook/useIsGrowthbookLoaded';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { StandaloneCircleUserRegularIcon } from '@deriv/quill-icons/Standalone';



import { requestOidcAuthentication } from '@deriv-com/auth-client';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { Tooltip } from '@deriv-com/ui';
import niloteLogo from '../../../../public/assets/images/NILOTE9999.png';
import { FaInstagram, FaTelegram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { FiHome, FiSettings, FiInfo, FiUser, FiHelpCircle } from 'react-icons/fi';
import ChangeTheme from '../footer/ChangeTheme';
import { useEffect } from 'react';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MobileMenu from './mobile-menu';
import './header.scss';

// SBS imports
import { ArrowDownCircle, ArrowUpCircle, Mail, Menu } from 'lucide-react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const AppHeader = observer(() => {
    // Check and apply theme on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDarkMode = savedTheme === 'dark';
        console.log('Current theme from localStorage:', savedTheme);
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
        }
    }, []);
    const { isGBLoaded, isGBAvailable } = useIsGrowthbookIsLoaded();
    const { isDesktop } = useDevice();
    const { isAuthorizing, activeLoginid } = useApiBase();
    const { client, ui } = useStore() ?? {};

    const { data: activeAccount } = useActiveAccount({ allBalanceData: client?.all_accounts_balance });
    const { accounts, getCurrency } = client ?? {};
    const has_wallet = Object.keys(accounts ?? {}).some(id => accounts?.[id].account_category === 'wallet');

    const currency = getCurrency?.();
    const { localize } = useTranslations();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Drawer state

    const renderAccountSection = () => {
        if (isAuthorizing) {
            return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
        } else if (activeLoginid) {
            return (
                <>
                    {isDesktop &&
                        (() => {
                            const redirect_url = new URL(standalone_routes.personal_details);
                            const urlParams = new URLSearchParams(window.location.search);
                            const account_param = urlParams.get('account');
                            const is_virtual = client?.is_virtual || account_param === 'demo';

                            if (is_virtual) {
                                redirect_url.searchParams.set('account', 'demo');
                            } else if (currency) {
                                redirect_url.searchParams.set('account', currency);
                            }
                            return (
                                <Tooltip
                                    as='a'
                                    href={redirect_url.toString()}
                                    tooltipContent={localize('Manage account settings')}
                                    tooltipPosition='bottom'
                                    className='app-header__account-settings'
                                >
                                    <StandaloneCircleUserRegularIcon className='app-header__profile_icon' />
                                </Tooltip>
                            );
                        })()}
                    <AccountSwitcher activeAccount={activeAccount} />
                    {isDesktop &&
                        (has_wallet ? (
                            <Button
                                className='manage-funds-button'
                                has_effect
                                text={localize('Manage funds')}
                                onClick={() => {
                                    let redirect_url = new URL(standalone_routes.wallets_transfer);

                                    if (isGBAvailable && isGBLoaded) {
                                        redirect_url = new URL(standalone_routes.recent_transactions);
                                    }

                                    if (currency) {
                                        redirect_url.searchParams.set('account', currency);
                                    }
                                    window.location.assign(redirect_url.toString());
                                }}
                                primary
                            />
                        ) : (
                            <Button
                                primary
                                onClick={() => {
                                    const redirect_url = new URL(standalone_routes.cashier_deposit);
                                    if (currency) {
                                        redirect_url.searchParams.set('account', currency);
                                    }
                                    window.location.assign(redirect_url.toString());
                                }}
                                className='deposit-button'
                            >
                                {localize('Deposit')}
                            </Button>
                        ))}
                </>
            );
        } else {
            return (
                <div className='auth-actions'>
                    <Button
                        tertiary
                        onClick={async () => {
                            const app_id = window.localStorage.getItem('APP_ID');
                            window.location.href =
                                'https://oauth.deriv.com/oauth2/authorize?app_id=' + app_id + '&l=EN&brand=deriv';
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
                        onClick={() => {
                            window.open(standalone_routes.signup);
                        }}
                    >
                        <Localize i18n_default_text='Sign up' />
                    </Button>
                </div>
            );
        }
    };

    return (
        <>
            <Header
                className={clsx('app-header', {
                    'app-header--desktop': isDesktop,
                    'app-header--mobile': !isDesktop,
                })}
            >
                <Wrapper variant='left'>
                    {isDesktop ? (
                        <div
                            className='custom-logo-wrapper'
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginRight: '24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={niloteLogo}
                                    alt='NILOTE9999 Logo'
                                    style={{
                                        height: '42px',
                                        width: 'auto',
                                        borderRadius: '4px',
                                        marginLeft: '16px',
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className='logo-text'>
                                        <span className='logo-markets'>MOSET</span>
                                        <span className='logo-markets'>FX</span>
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                        <a
                                            href='https://www.instagram.com/stedy.szn?igsh=MTRweml3dGVsNXdiMg=='
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            style={{
                                                color: '#c91450ff',
                                                fontSize: '23px',
                                                transition: 'transform 0.2s',
                                                ':hover': { transform: 'scale(1.1)' },
                                            }}
                                        >
                                            <FaInstagram />
                                        </a>
                                        <a
                                            href='https://www.instagram.com/stedy.szn?igsh=MTRweml3dGVsNXdiMg=='
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            style={{
                                                color: '#0088cc',
                                                fontSize: '23px',
                                                transition: 'transform 0.2s',
                                                ':hover': { transform: 'scale(1.1)' },
                                            }}
                                        >
                                            <FaTelegram />
                                        </a>
                                        <a
                                            href='https://www.facebook.com/share/16Nk8ksPhf/'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            style={{
                                                color: '#000000',
                                                fontSize: '23px',
                                                transition: 'transform 0.2s',
                                                ':hover': { transform: 'scale(1.1)' },
                                            }}
                                        >
                                            <FaTiktok />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button 
                                    className='menu-button' 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsDrawerOpen(prev => !prev);
                                    }}
                                    style={{
                                        background: 'var(--state-hover)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                                <img
                                    src={niloteLogo}
                                    alt='NILOTE9999 Logo'
                                    style={{
                                        height: '32px',
                                        width: 'auto',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>

                            <>
                                <div className={`mobile-menu ${isDrawerOpen ? 'open' : ''}`}>
                                    <div className='mobile-menu__header'>
                                        <h3>Menu</h3>
                                        <button 
                                            onClick={() => setIsDrawerOpen(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'var(--text-general)'
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className='mobile-menu__content'>
                                        

                                        <div className='social-icons'>
                                            <a href='https://www.instagram.com/yourusername' target='_blank' rel='noopener noreferrer' className='instagram'>
                                                <FaInstagram />
                                            </a>
                                            <a href='https://t.me/yourusername' target='_blank' rel='noopener noreferrer' className='telegram'>
                                                <FaTelegram />
                                            </a>
                                            <a href='https://tiktok.com/@yourusername' target='_blank' rel='noopener noreferrer' className='tiktok'>
                                                <FaTiktok />
                                            </a>
                                            <a href='https://wa.me/yourphonenumber' target='_blank' rel='noopener noreferrer' className='whatsapp'>
                                                <FaWhatsapp />
                                            </a>
                                        </div>

                                        <div className='theme-switch-container'>
                                            <ChangeTheme />
                                            <span style={{ marginLeft: '10px', fontSize: '14px' }}>Switch Theme</span>
                                        </div>
                                    </div>
                                </div>

                                {isDrawerOpen && (
                                    <div 
                                        className='mobile-menu__overlay open'
                                        onClick={() => setIsDrawerOpen(false)}
                                    />
                                )}
                            </>
                        </>
                    )}
                </Wrapper>

                <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
            </Header>
        </>
    );
});

export default AppHeader;