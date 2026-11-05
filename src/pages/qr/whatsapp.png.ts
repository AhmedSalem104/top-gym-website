import QRCode from 'qrcode';
import { business } from '../../config/business';

// Generated into the static build; no QR service, tracking redirect or client library.
export async function GET() {
  const image = await QRCode.toBuffer(business.links.whatsappGroup, {
    type: 'png',
    errorCorrectionLevel: 'M',
    width: 432,
    margin: 4,
    color: { dark: '#0B0D0FFF', light: '#FFFFFFFF' },
  });
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
}
