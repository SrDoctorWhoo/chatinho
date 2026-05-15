SELECT id, title, type, integrationId, targetFlowId, nextStepId 
FROM ChatbotNode 
WHERE flowId = (SELECT id FROM ChatbotFlow WHERE name = '3. Consulta de Boletos')
ORDER BY [order] ASC;
