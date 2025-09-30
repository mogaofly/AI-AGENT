import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

export async function generateSmartCompose(prompt: string, conversationHistory: string[], knowledgeBase?: any[]): Promise<string> {
  try {
    let systemPrompt = `You are an AI assistant helping a customer service agent compose responses. Based on the conversation history and the agent's partial input, suggest a completion that is professional, helpful, and contextually appropriate. Provide only the completion text that naturally continues from the input.`;
    
    // Add knowledge base context if available
    if (knowledgeBase && knowledgeBase.length > 0) {
      const relevantInfo = knowledgeBase.slice(0, 3).map(kb => `Q: ${kb.question} A: ${kb.answer}`).join(" ");
      systemPrompt += ` Use this knowledge base information when relevant: ${relevantInfo}`;
    }
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Conversation history: ${conversationHistory.join('\n')}\n\nAgent's partial input: "${prompt}"\n\nComplete this message naturally (provide only the continuation):` }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      max_tokens: 80,
      temperature: 0.6,
      stream: false
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating smart compose:", error);
    throw new Error("Failed to generate smart compose suggestion");
  }
}

export async function generateSmartSuggestions(userMessage: string, knowledgeBase: any[], conversationHistory?: any[]): Promise<string[]> {
  try {
    const systemPrompt = `You are an AI customer service assistant generating detailed, contextual response suggestions. 
    
    Based on the user's message and the available knowledge base, provide 3 comprehensive response suggestions that:
    1. Directly address the user's specific question or concern
    2. Include relevant information from the knowledge base when applicable
    3. Are professional, helpful, and complete responses (50-150 words each)
    4. Provide actionable solutions or next steps
    
    Focus on quality over brevity - these should be full responses that agents can use directly.`;
    
    // Find relevant knowledge base entries
    const relevantKB = knowledgeBase.filter(kb => {
      const userLower = userMessage.toLowerCase();
      const questionLower = kb.question.toLowerCase();
      const answerLower = kb.answer.toLowerCase();
      
      // Check for keyword matches
      const keywords = userLower.split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => 
        questionLower.includes(keyword) || answerLower.includes(keyword)
      );
    }).slice(0, 5); // Get top 5 relevant entries
    
    const kbContext = relevantKB.length > 0 
      ? relevantKB.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')
      : knowledgeBase.slice(0, 3).map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n');
    
    const conversationContext = conversationHistory 
      ? conversationHistory.map(msg => `${msg.isAgent ? 'Agent' : 'Customer'}: ${msg.text}`).join('\n')
      : '';
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Customer message: "${userMessage}"

${conversationContext ? `Conversation history:\n${conversationContext}\n\n` : ''}

Relevant knowledge base information:
${kbContext}

Generate 3 detailed, contextual response suggestions that directly address the customer's needs using the knowledge base information. Each should be a complete, professional response.

Respond in JSON format: {"suggestions": ["detailed response 1", "detailed response 2", "detailed response 3"]}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Error generating smart suggestions:", error);
    throw new Error("Failed to generate smart suggestions");
  }
}

export async function generateSmartReplies(messageType: string): Promise<string[]> {
  try {
    const systemPrompt = `You are an AI assistant generating quick reply suggestions for customer service agents. Based on the message type or context, provide 3 brief, professional quick replies.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Message type/context: "${messageType}"\n\nProvide 3 quick reply suggestions in JSON format: {"replies": ["reply1", "reply2", "reply3"]}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.replies || [];
  } catch (error) {
    console.error("Error generating smart replies:", error);
    throw new Error("Failed to generate smart replies");
  }
}

export async function generateConversationSummary(messages: any[]): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant that summarizes customer service conversations. Provide a concise, professional summary highlighting key points, issues discussed, and resolution status.`;
    
    const conversationText = messages.map(msg => 
      `${msg.isAgent ? 'Agent' : 'Customer'}: ${msg.text}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please summarize this conversation:\n\n${conversationText}` }
      ],
      max_tokens: 200,
      temperature: 0.5
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating conversation summary:", error);
    throw new Error("Failed to generate conversation summary");
  }
}

export async function classifyMessageIntent(message: string): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant that classifies customer messages by intent. Classify the message into one of these categories: greeting, question, complaint, compliment, goodbye, technical_issue, billing, other.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Classify this message: "${message}"\n\nRespond with JSON: {"intent": "category"}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.intent || "other";
  } catch (error) {
    console.error("Error classifying message intent:", error);
    return "other";
  }
}
