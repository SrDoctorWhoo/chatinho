import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get('id');

  if (!instanceId) {
    return new NextResponse('Missing instance ID', { status: 400 });
  }

  const script = `
    (function() {
      const instanceId = "${instanceId}";
      const baseUrl = "${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}";
      
      // Create Widget Container
      const container = document.createElement('div');
      container.id = 'chatinho-widget-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '999999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'flex-end';
      
      // Create Iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'chatinho-widget-iframe';
      iframe.src = baseUrl + '/widget/' + instanceId;
      iframe.style.width = '400px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '24px';
      iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
      iframe.style.display = 'none';
      iframe.style.transition = 'all 0.3s ease';
      iframe.style.marginBottom = '15px';
      
      // Create Toggle Button
      const button = document.createElement('button');
      button.style.width = '60px';
      button.style.height = '60px';
      button.style.borderRadius = '30px';
      button.style.backgroundColor = '#6366f1';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 10px 25px rgba(99,102,241,0.4)';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.transition = 'all 0.3s ease';
      
      const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
      const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      
      button.innerHTML = icon;
      
      let isOpen = false;
      button.onclick = () => {
        isOpen = !isOpen;
        iframe.style.display = isOpen ? 'block' : 'none';
        button.innerHTML = isOpen ? closeIcon : icon;
        button.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
      };
      
      container.appendChild(iframe);
      container.appendChild(button);
      document.body.appendChild(container);

      // Listen for resize or close events from iframe
      window.addEventListener('message', (event) => {
        if (event.data === 'chatinho-close') {
          isOpen = false;
          iframe.style.display = 'none';
          button.innerHTML = icon;
          button.style.transform = 'rotate(0deg)';
        }
      });
    })();
  `;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
