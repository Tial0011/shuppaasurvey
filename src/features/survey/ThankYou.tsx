import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { BRAND } from '@/config/brand';

interface Props {
  earlyAccess: boolean;
  alreadyDone?: boolean;
  onAnother?: () => void;
}

export function ThankYou({ earlyAccess, alreadyDone, onAnother }: Props) {
  const shareUrl = `${window.location.origin}/?src=friend`;
  const text = `I just helped shape ${BRAND.name}: ${BRAND.tagline} It takes 3 minutes. Take the survey: ${shareUrl}`;

  return (
    <div className="card thanks">
      <div className="thanks-icon"><Icon name="check" /></div>
      <h2>{alreadyDone ? 'You’ve already responded' : 'Thank you!'}</h2>
      <p>
        {alreadyDone
          ? 'Your answers are in. Thanks for helping us build the right thing.'
          : earlyAccess
            ? 'Your answers are in and you’re on the early access list. We’ll reach out when Shuppaa is ready.'
            : 'Your answers are in. They’ll directly shape what we build first.'}
      </p>
      <div className="thanks-actions">
        <a className="btn btn-primary" target="_blank" rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}>
          Share on WhatsApp
        </a>
        <Link className="btn btn-ghost" to="/">Back to home</Link>
      </div>
      {alreadyDone && onAnother && (
        <p style={{ marginTop: 18 }}>
          Sharing a device? <button className="btn btn-ghost btn-sm" onClick={onAnother}>Submit another response</button>
        </p>
      )}
    </div>
  );
}
