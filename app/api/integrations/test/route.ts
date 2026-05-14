import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { integrationId, message, variables: rawVariables } = body;
    let variables = rawVariables || {};

    let integration: any;

    if (integrationId) {
      integration = await prisma.externalIntegration.findUnique({
        where: { id: integrationId }
      });
    } else {
      // Allow testing with raw config from the form
      integration = {
        baseUrl: body.baseUrl,
        method: body.method,
        type: body.type,
        apiKey: body.apiKey,
        config: body.config
      };
    }

    if (!integration || (!integrationId && !integration.baseUrl)) {
      return NextResponse.json({ error: 'Configuração de integração incompleta ou não encontrada' }, { status: 400 });
    }

    // Logic similar to botEngine.ts
    const replaceVars = (str: string) => {
      if (!str) return str;
      let newStr = str;
      Object.keys(variables || {}).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        newStr = newStr.replace(regex, variables[key]);
      });
      return newStr;
    };

    const depts = await prisma.department.findMany({ select: { id: true, name: true, description: true } });
    const deptsText = depts.map(d => `ID: ${d.id} | Nome: ${d.name} ${d.description ? `| Descrição: ${d.description}` : ''}`).join('\n');
    
    // Fix: variables is already a 'let' object from line 13
    variables.departamentos = deptsText;
    variables.history = variables.history || "";
    variables.historico = variables.historico || "";

    const processedMessage = replaceVars(message || '');
    let url = integration.baseUrl || '';
    const method = (integration.method || 'POST').toUpperCase();
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(integration.apiKey ? { 'Authorization': `Bearer ${integration.apiKey}` } : {})
      }
    };

    if (integration.type === 'DIFY') {
      options.body = JSON.stringify({
        inputs: variables || {},
        query: processedMessage,
        response_mode: "streaming",
        user: "admin-test"
      });
    } else if (integration.type === 'OPENAI') {
      options.body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: processedMessage }]
      });
    } else {
      // Webhook
      if (method === 'GET') {
        const params = new URLSearchParams({
          message: processedMessage,
          ...variables
        });
        url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
      } else {
        options.body = JSON.stringify({
          message: processedMessage,
          variables: variables || {},
          isTest: true
        });
      }
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;

    if (contentType.includes('text/event-stream')) {
      const text = await response.text();
      const lines = text.split('\n');
      let fullAnswer = '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const chunk = JSON.parse(line.substring(6));
            if (chunk.event === 'message' || chunk.event === 'agent_message') {
              fullAnswer += chunk.answer || '';
            }
          } catch (e) {}
        }
      }
      responseData = { answer: fullAnswer, raw_stream: text.substring(0, 500) + '...' };
    } else {
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      data: responseData,
      conversation_id: responseData.conversation_id || null,
      url: url // Helpful for debugging GET requests
    });

  } catch (error: any) {
    console.error('[Integration Test Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
