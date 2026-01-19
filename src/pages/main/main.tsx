import React, { lazy, Suspense, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { 
    FaChartBar, 
    FaChartLine, 
    FaPuzzlePiece, 
    FaChessKnight, 
    FaUsers, 
    FaShieldAlt, 
    FaRobot, 
    FaTachometerAlt, 
    FaExchangeAlt, 
    FaCopy, 
    FaLightbulb, 
    FaBolt, 
    FaCube,
    FaChartPie,
    FaTools,
    FaSignal,
    FaChartArea,
    FaRobot as FaFreeBots 
} from 'react-icons/fa';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel'; //ss
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';
import FreeBots from '../free-bots';
import ToolsHub from '../tools-hub';

const AiPage = lazy(() => import('../ai/ai')); // Assuming you created AiPage.tsx
const BotsPage = lazy(() => import('../bots/freebots')); // Assuming you created BotsPage.tsx
const SignalPage = lazy(() => import('../signal/signal')); // Assuming you created SignalPage.tsx
const InvestPage = lazy(() => import('../invest/invest')); // Assuming you created InvestPage.tsx
const ChartWrapper = lazy(() => import('../chart/chart-wrapper'));
const Tutorial = lazy(() => import('../tutorials'));
const Analysis = lazy(() => import('../analysis/analysis'));
const Tool = lazy(() => import('../tool/tool'));
const Copy = lazy(() => import('../copy/copy'));
const Tradeview = lazy(() => import('../tradeview/tradeview'));
const Dptool = lazy(() => import('../dptool/dptool')); // Assuming you created Dptool.tsx
const Trader = lazy(() => import('../trader/trader')); // Assuming you created Trader.tsx

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const {
        active_tab,
        active_tour,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
        setWebSocketState,
        setActiveTour,
        setTourDialogVisibility,
    } = dashboard;
    const { onEntered, dashboard_strategies } = load_modal;
    const {
        is_dialog_open,
        is_drawer_open,
        dialog_options,
        onCancelButtonClick,
        onCloseDialog,
        onOkButtonClick,
        stopBot,
    } = run_panel;
    const { is_open } = quick_strategy;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const init_render = React.useRef(true);
    const hash = ['dashboard', 'bot_builder','analysis', 'tradeview', 'ai', 'bots', 'trader', 'copy', 'signal','chart', 'dptool', 'tutorials', 'freebots', 'tools-hub'];
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    let tab_value: number | string = active_tab;
    const GetHashedValue = (tab: number) => {
        tab_value = location.hash?.split('#')[1];
        if (!tab_value) return tab;
        return Number(hash.indexOf(String(tab_value)));
    };
    const active_hash_tab = GetHashedValue(active_tab);

    React.useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
                setWebSocketState(false);
            }
        }
    }, [clear, connectionStatus, setWebSocketState, stopBot]);

    React.useEffect(() => {
        if (is_open) {
            setTourDialogVisibility(false);
        }

        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            if (!isDesktop) handleTabChange(Number(active_hash_tab));
            init_render.current = false;
        } else {
            navigate(`#${hash[active_tab] || hash[0]}`);
        }
        if (active_tour !== '') {
            setActiveTour('');
        }
    }, [active_tab]);

    React.useEffect(() => {
        const trashcan_init_id = setTimeout(() => {
            if (active_tab === BOT_BUILDER && Blockly?.derivWorkspace?.trashcan) {
                const trashcanY = window.innerHeight - 250;
                let trashcanX;
                if (is_drawer_open) {
                    trashcanX = isDbotRTL() ? 380 : window.innerWidth - 460;
                } else {
                    trashcanX = isDbotRTL() ? 20 : window.innerWidth - 100;
                }
                Blockly?.derivWorkspace?.trashcan?.setTrashcanPosition(trashcanX, trashcanY);
            }
        }, 100);

        return () => {
            clearTimeout(trashcan_init_id);
        };
    }, [active_tab, is_drawer_open]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (dashboard_strategies.length > 0) {
            timer = setTimeout(() => {
                updateWorkspaceName();
            });
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dashboard_strategies, active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
            const el_id = TAB_IDS[tab_index];
            if (el_id) {
                const el_tab = document.getElementById(el_id);
                // Increase delay to ensure tab positioning is complete first
                setTimeout(() => {
                    el_tab?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }, 100); // Increased from 10ms to 100ms
            }
        },
        [active_tab]
    );

    // Expose the bot selection trigger globally
    useEffect(() => {
        const handleBotMessage = (event) => {
            const { type, filename } = event.data || {};

            if (type === 'botSelect') {
                handleTabChange(DBOT_TABS.BOT_BUILDER); // Go to bot builder

                setTimeout(() => {
                    if (filename) {
                        window.loadBotXmlFile?.(filename);
                    }
                }, 500);
            }
        };

        window.addEventListener('message', handleBotMessage);
        return () => window.removeEventListener('message', handleBotMessage);
    }, []);

    const handleLinkChange = (path: string) => {
        navigate(`/${path}`);
    };

    return (
        <React.Fragment>
            <div class="top-orange-line"></div>
            <div className='main'>
                <div
                    className={classNames('main__container', {
                        'main__container--active': active_tour && active_tab === DASHBOARD && !isDesktop,
                        'main__container--drawer-open': is_drawer_open && isDesktop,
                    })}
                >
                    <Tabs
                        active_index={active_tab}
                        className='main__tabs'
                        onTabItemChange={onEntered}
                        onTabItemClick={(tab_index) => handleTabChange(tab_index)}
                        top
                    >
                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaTachometerAlt size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text="Dashboard" />
                                </span>
                            )}
                            id='id-dbot-dashboard'
                        >
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaPuzzlePiece size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text='Bot Builder' />
                                </span>
                            )}
                            id='id-bot-builder'
                        />

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaChartPie size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('Analysis')} />
                                </span>
                            )}
                            id='id-analysis'
                            onClick={() => handleLinkChange('analysis')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading page...')} />}>
                                <Analysis />
                            </Suspense>
                        </div>
                        


                        

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaChartPie size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('AI')} />
                                </span>
                            )}
                            id='id-ai'
                            onClick={() => handleLinkChange('ai')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading page...')} />}>
                                <AiPage />
                            </Suspense>
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaRobot size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('Bots')} />
                                </span>
                            )}
                            id='id-bots'
                            onClick={() => handleLinkChange('bots')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Bots page...')} />}>
                                <BotsPage
                                    onBotSelect={() => {
                                        handleTabChange(DBOT_TABS.BOT_BUILDER);
                                    }}
                                />
                            </Suspense>
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaExchangeAlt size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('D Trader')} />
                                </span>
                            )}
                            id='id-trader'
                            onClick={() => handleLinkChange('trader')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Loading Trader...')} />}>
                                <Trader />
                            </Suspense>
                        </div>
                        
                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaTools size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('Tools Hub')} />
                                </span>
                            )}
                            id='id-tools-hub'
                            onClick={() => handleLinkChange('Digit tools')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tools hub...')} />}>
                                <ToolsHub />
                            </Suspense>
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaCopy size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('Copytrading')} />
                                </span>
                            )}
                            id='id-copy'
                            onClick={() => handleLinkChange('copy')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading copy page...')} />}>
                                <Copy />
                            </Suspense>
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaSignal size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text={localize('Signal')} />
                                </span>
                            )}
                            id='id-signal'
                            onClick={() => handleLinkChange('signal')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Signal page...')} />}>
                                <SignalPage />
                            </Suspense>
                        </div>

                        <div
                            label={(
                                <span style={{ color: '#000000', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px' }}>
                                    <FaChartLine size={14} style={{ marginRight: '8px' }} />
                                    <Localize i18n_default_text='Charts' />
                                </span>
                            )}
                            id={is_chart_modal_visible || is_trading_view_modal_visible ? 'id-charts--disabled' : 'id-charts'}
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <ChartWrapper show_digits_stats={false} />
                            </Suspense>
                        </div>
                        
                    </Tabs>
                </div>
            </div>

           <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    <RunPanel />
                </div>
                <ChartModal />
            </DesktopWrapper>
            <MobileWrapper>
                {!is_open && <RunPanel />}
            </MobileWrapper>

            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                className='dc-dialog__wrapper--fixed'
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_mobile_full_width={false}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                portal_element_id='modal_root'
                title={title}
            >
                {message}
            </Dialog>
        </React.Fragment>
    );
});

export default AppWrapper;