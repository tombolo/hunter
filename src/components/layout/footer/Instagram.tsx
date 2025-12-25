import { LegacyInstagramIcon } from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';
import { Tooltip } from '@deriv-com/ui';

const Instagram = () => {
    const { localize } = useTranslations();

    return (
        <Tooltip
            as='a'
            className='app-footer__icon'
            href='https://whatsapp.com/channel/0029VbBH7nU1CYoTusaX6q3M'
            target='_blank'
            tooltipContent={localize('Instagram')}
        >
            <LegacyInstagramIcon iconSize='xs' />
        </Tooltip>
    );
};

export default Instagram;
