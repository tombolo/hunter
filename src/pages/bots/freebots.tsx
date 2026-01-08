import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { LabelPairedFileArrowDownCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { LabelPairedMoonCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { LabelPairedExclamationCaptionRegularIcon } from '@deriv/quill-icons/LabelPaired';
import './freebots.scss';

// Import XML files from hurmy folder
import BeginnersBestBotV1Xml from '../free-bots/hurmy/BeginnersBestBotV1.xml';
import HitnRunProXml from '../free-bots/hurmy/HITnRUNPRO.xml';
import MarketExecutorAIXml from '../free-bots/hurmy/MarketExecutorAI.xml';
import PrintedDollarsBotXml from '../free-bots/hurmy/PrinteddollarsBot.xml';

// Import XML files from legacy folder
import Auto102ByLegacyHubXml from '../free-bots/legacy/AUTO102BYLEGACYHUB.xml';
import EvenEvenOddOddBotXml from '../free-bots/legacy/EVENEVEN_ODDODDBot.xml';
import EnhancedAutoSwitchOver2BotXml from '../free-bots/legacy/EnhancedAutoSwitchOver2bot.xml';
import OddOddEvenEvenBotXml from '../free-bots/legacy/ODDODDEVENEVENBOT.xml';
import Under78AIBotXml from '../free-bots/legacy/Under7_8_AIBOT.xml';
import UnderOverAutoSwitchXml from '../free-bots/legacy/UnderoverAutoswitch.xml';
import LegacyQ1Xml from '../free-bots/legacy/legacyQ1.xml';

// Import XML files from master folder
import DerivWizardXml from '../free-bots/master/Derivwizard.xml';
import MasterG8ByStateFxXml from '../free-bots/master/MasterG8ByStateFx.xml';
import MetroV4EvenAndOddDigitBotXml from '../free-bots/master/Metrov4EvenandOddDigitBotUpdated.xml';
import StateXV1Xml from '../free-bots/master/STATEXV1.xml';
import V4EvenAndOddDigitBotXml from '../free-bots/master/V4EvenandOddDigitBot.xml';

const FreeBots = observer(() => {
    const { load_modal, dashboard } = useStore();
    const { handleFileChange } = load_modal;
    const [loadingBotId, setLoadingBotId] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Bot files mapping with actual XML content
    const botXmlMap: Record<string, string> = {
        // Hurmy Bots
        'hurmy/BeginnersBestBotV1.xml': BeginnersBestBotV1Xml,
        'hurmy/HITnRUNPRO.xml': HitnRunProXml,
        'hurmy/MarketExecutorAI.xml': MarketExecutorAIXml,
        'hurmy/PrinteddollarsBot.xml': PrintedDollarsBotXml,
        
        // Legacy Bots
        'legacy/AUTO102BYLEGACYHUB.xml': Auto102ByLegacyHubXml,
        'legacy/EVENEVEN_ODDODDBot.xml': EvenEvenOddOddBotXml,
        'legacy/EnhancedAutoSwitchOver2bot.xml': EnhancedAutoSwitchOver2BotXml,
        'legacy/ODDODDEVENEVENBOT.xml': OddOddEvenEvenBotXml,
        'legacy/Under7_8_AIBOT.xml': Under78AIBotXml,
        'legacy/UnderoverAutoswitch.xml': UnderOverAutoSwitchXml,
        'legacy/legacyQ1.xml': LegacyQ1Xml,
        
        // Master Bots
        'master/Derivwizard.xml': DerivWizardXml,
        'master/MasterG8ByStateFx.xml': MasterG8ByStateFxXml,
        'master/Metrov4EvenandOddDigitBotUpdated.xml': MetroV4EvenAndOddDigitBotXml,
        'master/STATEXV1.xml': StateXV1Xml,
        'master/V4EvenandOddDigitBot.xml': V4EvenAndOddDigitBotXml
    };

    const bots = [
        // Hurmy Bots
        { number: 1, name: 'Beginners Best Bot V1', file: 'hurmy/BeginnersBestBotV1.xml', description: 'Perfect for beginners, this bot offers a balanced approach to trading.', icon: '1' },
        { number: 2, name: 'HITnRUN PRO', file: 'hurmy/HITnRUNPRO.xml', description: 'Quick in-and-out trading strategy for fast market movements.', icon: '2' },
        { number: 3, name: 'Market Executor AI', file: 'hurmy/MarketExecutorAI.xml', description: 'AI-powered trading bot that executes trades based on market conditions.', icon: '3' },
        { number: 4, name: 'Printed Dollars Bot', file: 'hurmy/PrinteddollarsBot.xml', description: 'Consistent profit strategy with built-in risk management.', icon: '4' },
        
        // Legacy Bots
        { number: 5, name: 'AUTO 102 Legacy', file: 'legacy/AUTO102BYLEGACYHUB.xml', description: 'Legacy auto-trading bot with proven 102 strategy.', icon: '5' },
        { number: 6, name: 'Even/Odd Pattern Bot', file: 'legacy/EVENEVEN_ODDODDBot.xml', description: 'Trading bot focusing on even/odd number patterns.', icon: '6' },
        { number: 7, name: 'Enhanced Auto Switch', file: 'legacy/EnhancedAutoSwitchOver2bot.xml', description: 'Advanced switching strategy between different trading approaches.', icon: '7' },
        { number: 8, name: 'Odd/Even Pattern Bot', file: 'legacy/ODDODDEVENEVENBOT.xml', description: 'Specialized in odd/even number pattern recognition.', icon: '8' },
        { number: 9, name: 'Under 7/8 AI Bot', file: 'legacy/Under7_8_AIBOT.xml', description: 'AI-powered bot for under 7/8 digit options.', icon: '9' },
        { number: 10, name: 'Under/Over Auto Switch', file: 'legacy/UnderoverAutoswitch.xml', description: 'Automatically switches between under/over strategies.', icon: '10' },
        { number: 11, name: 'Legacy Q1', file: 'legacy/legacyQ1.xml', description: 'First quarter legacy strategy bot.', icon: '11' },
        
        // Master Bots
        { number: 12, name: 'Deriv Wizard', file: 'master/Derivwizard.xml', description: 'Advanced trading strategies for derivative markets.', icon: '12' },
        { number: 13, name: 'Master G8', file: 'master/MasterG8ByStateFx.xml', description: 'Premium G8 currency trading strategy.', icon: '13' },
        { number: 14, name: 'Metro V4 Even/Odd', file: 'master/Metrov4EvenandOddDigitBotUpdated.xml', description: 'Updated version of the popular even/odd strategy.', icon: '14' },
        { number: 15, name: 'State XV1', file: 'master/STATEXV1.xml', description: 'Experimental V1 state trading strategy.', icon: '15' },
        { number: 16, name: 'V4 Even/Odd Digit Bot', file: 'master/V4EvenandOddDigitBot.xml', description: 'Version 4 of the even/odd digit trading bot.', icon: '16' }
    ];

    const handleBotSelect = async (filename: string, botIndex: number) => {
        setLoadError(null);
        setLoadingBotId(botIndex);
        dashboard.setActiveTab(1);

        let xmlContent = botXmlMap[filename];

        // Debug logging
        console.log(`Loading bot: ${filename}`, {
            found: !!xmlContent,
            type: typeof xmlContent,
            length: xmlContent?.length,
            preview: xmlContent?.substring?.(0, 100),
            hasDefault: !!(xmlContent as any)?.default
        });

        if (!xmlContent) {
            console.error(`XML content not found for ${filename}. Available keys:`, Object.keys(botXmlMap));
            setLoadError(`Could not load bot: XML file "${filename}" not found`);
            setLoadingBotId(null);
            return;
        }

        // Handle both static imports (string) and dynamic imports (object with default)
        // Some bundlers may wrap the content in a default export
        if (typeof xmlContent === 'object' && xmlContent !== null && 'default' in xmlContent) {
            xmlContent = (xmlContent as any).default;
        }

        // Ensure xmlContent is a string
        const xmlString = typeof xmlContent === 'string' ? xmlContent : String(xmlContent);
        
        if (!xmlString || xmlString.trim().length === 0) {
            console.error(`XML content is empty for ${filename}`);
            setLoadError(`Could not load bot: XML file "${filename}" is empty`);
            setLoadingBotId(null);
            return;
        }

        // Wait for tab switch and workspace to be ready
        await new Promise(resolve => setTimeout(resolve, 300));

        let attempts = 0;
        const maxAttempts = 50;

        const tryLoadBot = async () => {
            if (!window.Blockly?.derivWorkspace) {
                attempts++;
                if (attempts > maxAttempts) {
                    setLoadError('Blockly workspace not available after multiple attempts. Please wait for the page to fully load.');
                    setLoadingBotId(null);
                    return;
                }
                setTimeout(tryLoadBot, 100);
                return;
            }

            try {
                if (!xmlString.includes('<xml') && !xmlString.includes('<?xml')) {
                    console.error('Invalid XML format. Content preview:', xmlString.substring(0, 200));
                    throw new Error('Invalid XML format');
                }

                // Await asyncClear to ensure workspace is cleared before loading
                await window.Blockly.derivWorkspace.asyncClear();
                
                const xml = window.Blockly.utils.xml.textToDom(xmlString);
                
                // Use clearWorkspaceAndLoadFromXml to properly replace the workspace content
                window.Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, window.Blockly.derivWorkspace);
                
                window.Blockly.derivWorkspace.strategy_to_load = xmlString;
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
                                className='free-bots__card premium'
                                style={{
                                    opacity: 0,
                                    transform: 'translateY(20px)',
                                    transition: 'all 0.4s ease-out',
                                }}
                            >
                                <div className='premium-tag'>
                                    <span>PREMIUM</span>
                                    <div className='premium-glow'></div>
                                </div>
                                <div className='free-bots__card-icon'>{bot.number}</div>
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