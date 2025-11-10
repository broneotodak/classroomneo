// Netlify Function: AI Module Builder
// Generates modules and steps from curriculum description

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, classId, className } = JSON.parse(event.body);

    if (!prompt || !classId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Build enhanced prompt for module generation
    const systemPrompt = `You are an expert curriculum designer and educational content creator. Your task is to generate a comprehensive, well-structured learning curriculum based on the user's description.

IMPORTANT: Return ONLY a valid JSON object with NO other text. The JSON must follow this exact structure:

{
  "modules": [
    {
      "title": "Module Title",
      "description": "Brief description of what this module covers",
      "order_number": 1,
      "steps": [
        {
          "title": "Step Title",
          "content": "Detailed tutorial content in markdown format. Include explanations, code examples if applicable, and clear learning objectives.",
          "order_number": 1,
          "estimated_minutes": 30
        }
      ]
    }
  ]
}

Guidelines:
- Create 3-6 modules for the curriculum
- Each module should have 4-8 steps
- Steps should be progressive (easy to complex)
- Include practical examples and exercises
- Estimated minutes should be realistic (10-90 min per step)
- Content should be detailed and educational
- Use markdown formatting for readability
- Focus on hands-on, practical learning

Return ONLY the JSON object, no other text.`;

    const userPrompt = `Class: ${className || 'Training Program'}

Curriculum Request:
${prompt}

Generate a complete curriculum with modules and steps following the JSON structure specified.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'OpenAI API error',
          details: error
        })
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Validate the response structure
    if (!result.modules || !Array.isArray(result.modules)) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Invalid response format from AI',
          result: result
        })
      };
    }

    // Return the generated curriculum
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        curriculum: result,
        meta: {
          total_modules: result.modules.length,
          total_steps: result.modules.reduce((sum, m) => sum + (m.steps?.length || 0), 0),
          class_id: classId
        }
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
