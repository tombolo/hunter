import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { LabelPairedFileArrowDownCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { LabelPairedMoonCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { LabelPairedExclamationCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { Localize } from '@deriv-com/translations';

// Import XML files from muley folder
import CandleMineBotXml from './muley/CANDLEMINEBOT.xml';
import CandleMineV2Xml from './muley/CandleMineVersion2.xml';
import CandleMine2Xml from './muley/Candlemine2.xml';
import EvenOddSwitcherBotXml from './muley/EvenOddSwitcherBot.xml';
import OverUnderTrendBotXml from './muley/OverUnderrendBot.xml';
import RiseFallSwitcherBotXml from './muley/RiseFallSwitcherBot.xml';
import NewUnder7Over2RecoveryXml from './muley/TheNewUnder7Over2Recovery.xml';
import TzxSpeedBotV1Xml from './muley/Tzxspeedbotvr1.xml';

// Import XML files from hurmy folder
import BeginnersBestBotV1Xml from './hurmy/BeginnersBestBotV1.xml';
import HitnRunProXml from './hurmy/HITnRUNPRO.xml';
import MarketExecutorAIXml from './hurmy/MarketExecutorAI.xml';
import PrintedDollarsBotXml from './hurmy/PrinteddollarsBot.xml';

// Import XML files from legacy folder
import Auto102ByLegacyHubXml from './legacy/AUTO102BYLEGACYHUB.xml';
import EvenEvenOddOddBotXml from './legacy/EVENEVEN_ODDODDBot.xml';
import EnhancedAutoSwitchOver2BotXml from './legacy/EnhancedAutoSwitchOver2bot.xml';
import OddOddEvenEvenBotXml from './legacy/ODDODDEVENEVENBOT.xml';
import OverDestroyerByLegacyXml from './legacy/OVERDESTROYERBYLEGACY.xml';
import Under78AIBotXml from './legacy/Under7_8_AIBOT.xml';
import UnderOverAutoSwitchXml from './legacy/UnderoverAutoswitch.xml';
import LegacyQ1Xml from './legacy/legacyQ1.xml';

// Import XML files from master folder

import DerivWizardXml from './master/Derivwizard.xml';
import EnhancedV1ByStateFxXml from './master/ENHANCEDV1BYSTATEFX.xml';
import MasterG8ByStateFxXml from './master/MasterG8ByStateFx.xml';
import MetroV4EvenAndOddDigitBotXml from './master/Metrov4EvenandOddDigitBotUpdated.xml';
import StateXV1Xml from './master/STATEXV1.xml';
import V4EvenAndOddDigitBotXml from './master/V4EvenandOddDigitBot.xml';

import './free-bots.scss';

const FreeBots = observer(() => {
    const { load_modal, dashboard } = useStore();
    const { handleFileChange } = load_modal;
    const [loadingBotId, setLoadingBotId] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const botXmlMap: Record<string, string> = {
        // Muley Bots
        'Candle Mine Bot.xml': CandleMineBotXml,
        'Candle Mine V2.xml': CandleMineV2Xml,
        'Candle Mine 2.xml': CandleMine2Xml,
        'Even Odd Switcher Bot.xml': EvenOddSwitcherBotXml,
        'Over Under Trend Bot.xml': OverUnderTrendBotXml,
        'Rise Fall Switcher Bot.xml': RiseFallSwitcherBotXml,
        'New Under 7 Over 2 Recovery.xml': NewUnder7Over2RecoveryXml,
        'TZX Speed Bot V1.xml': TzxSpeedBotV1Xml,
        
        // Hurmy Bots
        'Beginners Best Bot V1.xml': BeginnersBestBotV1Xml,
        'HITnRUN PRO.xml': HitnRunProXml,
        'Market Executor AI.xml': MarketExecutorAIXml,
        'Printed Dollars Bot.xml': PrintedDollarsBotXml,
        
        // Legacy Bots
        'AUTO 102 BY LEGACY HUB.xml': Auto102ByLegacyHubXml,
        'EVEN EVEN ODD ODD Bot.xml': EvenEvenOddOddBotXml,
        'Enhanced Auto Switch Over Bot.xml': EnhancedAutoSwitchOver2BotXml,
        'ODD ODD EVEN EVEN BOT.xml': OddOddEvenEvenBotXml,
        'OVER DESTROYER BY LEGACY.xml': OverDestroyerByLegacyXml,
        'Under 7/8 AI BOT.xml': Under78AIBotXml,
        'Under Over Auto Switch.xml': UnderOverAutoSwitchXml,
        'Legacy Q1.xml': LegacyQ1Xml,
   
        
        // Master Bots
       
        'Deriv Wizard.xml': DerivWizardXml,
        'ENHANCED V1 BY STATE FX.xml': EnhancedV1ByStateFxXml,
        'Master G8 By State Fx.xml': MasterG8ByStateFxXml,
        'Metro V4 Even and Odd Digit Bot.xml': MetroV4EvenAndOddDigitBotXml,
        'STATE X V1.xml': StateXV1Xml,
        'V4 Even and Odd Digit Bot.xml': V4EvenAndOddDigitBotXml,
   
       
    };

    const bots = [
        {
            name: '_Expert seed bot📉📈📊🚀',
            description: 'Seed strategy bot with market signals and volatility tracking',
            file: '_Expert seed bot📉📈📊🚀.xml',
            icon: '🚀',
        },
        {
            name: '_Original 📄💵 Expert Speed Bot',
            description: 'Original fast-paced strategy bot for quick trades',
            file: '_Original 📄💵 Expert Speed Bot .xml',
            icon: '📄',
        },
        {
            name: 'AUTO C4 VOLT 𝙂𝘽 2 𝙂𝘽 AI PREMIUM ROBOT',
            description: 'AI-powered premium robot with 2GB capacity and switching logic',
            file: 'AUTO C4 VOLT 𝙂𝘽 2 𝙂𝘽 AI PREMIUM ROBOT.xml',
            icon: '🤖',
        },
        {
            name: 'Candle-mine 22',
            description: 'Candle pattern detection bot with mine strategy',
            file: 'Candle-mine 22.xml',
            icon: '🕯️',
        },
        {
            name: 'Dollar dispenser $1',
            description: 'Dollar printer styled bot with payout filtering logic',
            file: 'Dollar dispenser $1.xml',
            icon: '💸',
        },
        {
            name: 'Even vs Odd Statistics (Version 2.0)',
            description: 'Statistical analysis bot for even vs odd digit predictions',
            file: 'Even vs Odd Statistics (Version 2.0).xml',
            icon: '📊',
        },
        {
            name: 'EXPERT EDGE OVER BOT✨',
            description: 'Sharp-edge prediction bot with expert precision strategy',
            file: 'EXPERT EDGE OVER BOT✨.xml',
            icon: '✨',
        },
        {
            name: 'Expert Speed Bot By CHOSEN DOLLAR PRINTER FX',
            description: 'Chosen FX version of the Expert Speed bot with sniper logic',
            file: 'Expert Speed Bot By CHOSEN DOLLAR PRINTER FX📉📉📈📈📉📉.xml',
            icon: '🎯',
        },
        {
            name: 'OVER UNDER COMPOUND BOT@Russian (1)',
            description: 'Over/Under compounding bot tailored for Russian markets',
            file: 'OVER UNDER COMPOUND BOT@Russian (1).xml',
            icon: '📈',
        },
        {
            name: 'Russian Harbor 1.0',
            description: 'Harbor-based volatility trader for Russian market timing',
            file: 'Russian Harbor 1.0.xml',
            icon: '⚓',
        },
    ];

    const handleBotSelect = (filename: string, botIndex: number) => {
        setLoadError(null);
        setLoadingBotId(botIndex);
        dashboard.setActiveTab(1);

        const xmlContent = botXmlMap[filename];

        if (!xmlContent) {
            console.error(`XML content not found for ${filename}`);
            setLoadError(`Could not load bot: XML file "${filename}" not found`);
            setLoadingBotId(null);
            return;
        }

        const loadBot = () => {
            let attempts = 0;
            const maxAttempts = 50;

            const tryLoadBot = () => {
                if (!window.Blockly?.derivWorkspace) {
                    attempts++;
                    if (attempts > maxAttempts) {
                        setLoadError('Blockly workspace not available after multiple attempts');
                        setLoadingBotId(null);
                        return;
                    }
                    setTimeout(tryLoadBot, 100);
                    return;
                }

                try {
                    if (!xmlContent.includes('<xml') || !xmlContent.includes('</xml>')) {
                        throw new Error('Invalid XML format');
                    }

                    window.Blockly.derivWorkspace.asyncClear();
                    const xml = window.Blockly.utils.xml.textToDom(xmlContent);
                    window.Blockly.Xml.domToWorkspace(xml, window.Blockly.derivWorkspace);
                    window.Blockly.derivWorkspace.strategy_to_load = xmlContent;
                    window.Blockly.derivWorkspace.cleanUp();
                    console.log(`Successfully loaded bot: ${filename}`);
                    setLoadingBotId(null);
                } catch (error) {
                    console.error('Error loading bot:', error);
                    setLoadError(`Failed to load bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    setLoadingBotId(null);
                }
            };

            tryLoadBot();
        };

        loadBot();
    };

    useEffect(() => {
        const cards = document.querySelectorAll('.free-bots__card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                (card as HTMLElement).style.opacity = '1';
                (card as HTMLElement).style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }, []);

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <LabelPairedMoonCaptionRegularIcon height='32px' width='32px' fill='var(--button-primary-default)' />
                <h1>Free Trading Bots</h1>
                <p>Select from our collection of high-performance trading bots</p>
            </div>
            {loadError && (
                <div className='free-bots__error-message'>
                    <LabelPairedExclamationCaptionRegularIcon height='20px' width='20px' fill='var(--status-danger)' />
                    <span>{loadError}</span>
                </div>
            )}
            <div className='free-bots__scroll-container'>
                <div className='bot-list-container'>
                    <div className='free-bots__grid'>
                        {bots.map((bot, index) => (
                            <div
                                key={index}
                                className='free-bots__card'
                                style={{
                                    opacity: 0,
                                    transform: 'translateY(20px)',
                                    transition: 'all 0.4s ease-out',
                                }}
                            >
                                <div className='free-bots__card-icon'>{bot.icon}</div>
                                <div className='free-bots__card-content'>
                                    <h3>{bot.name}</h3>
                                    <p>{bot.description}</p>
                                    <button
                                        className={`free-bots__download-btn ${loadingBotId === index ? 'loading' : ''}`}
                                        onClick={() => handleBotSelect(bot.file, index)}
                                        disabled={loadingBotId !== null}
                                    >
                                        {loadingBotId === index ? (
                                            <span>Loading...</span>
                                        ) : (
                                            <>
                                                <LabelPairedFileArrowDownCaptionRegularIcon height='16px' width='16px' />
                                                <span>Load Bot</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default FreeBots;
